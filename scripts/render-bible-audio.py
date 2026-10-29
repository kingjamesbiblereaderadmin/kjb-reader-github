#!/usr/bin/env python3
"""Render every chapter of the KJB (Pure Cambridge Edition) to MP3.

Uses Piper — a free, open-source, offline text-to-speech engine (MIT licence,
no account, no API key, nothing leaves this machine) — and writes one MP3 per
chapter plus a manifest holding per-verse timings, so the app can highlight the
verse being read.

Setup (once):
    pip install piper-tts lameenc
    # a British voice, e.g. en_GB-alba-medium:
    python -m piper.download_voices en_GB-alba-medium --data-dir ./voices

Render everything (safe to stop and restart — finished chapters are skipped):
    python3 scripts/render-bible-audio.py --voice ./voices/en_GB-alba-medium.onnx

Then upload the generated `audio/` folder from the app's Audio Tools page.

Output:
    audio/<ABBR>-<chapter>.mp3
    audio/manifest.json   { "voice": ..., "chapters": [ { book, abbr, chapter,
                            file, duration, timings: [{verse,start,end}] } ] }
"""

import argparse
import array
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

DEFAULT_API = "https://kingjamesbiblereader.base44.app/functions/bibleApi"
VERSE_GAP_MS = 350
PARAGRAPH_GAP_MS = 800


# --- book table -------------------------------------------------------------
def load_books(bible_data_path):
    """Read the app's own book table so every book, abbreviation and chapter
    count matches the app exactly (no duplicated list to drift out of date)."""
    with open(bible_data_path, "r", encoding="utf-8") as handle:
        source = handle.read()
    pattern = re.compile(
        r'apiName:\s*"([^"]+)"\s*,\s*abbr:\s*"([^"]+)"\s*,\s*chapters:\s*(\d+)'
    )
    books = [{"apiName": m.group(1), "abbr": m.group(2), "chapters": int(m.group(3))}
             for m in pattern.finditer(source)]
    if len(books) != 66:
        sys.exit(f"Expected 66 books in {bible_data_path}, found {len(books)}.")
    return books


# --- chapter text -----------------------------------------------------------
def fetch_chapter(api, book, chapter, retries=3):
    body = json.dumps({"action": "getChapter", "book": book, "chapter": chapter}).encode()
    for attempt in range(1, retries + 1):
        try:
            request = urllib.request.Request(
                api, data=body, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.loads(response.read().decode())
            verses = payload.get("verses") or []
            if not verses:
                raise ValueError("no verses returned")
            return verses
        except Exception as error:  # noqa: BLE001 - retried below
            if attempt == retries:
                raise
            print(f"    retry {attempt} for {book} {chapter}: {error}")
            time.sleep(1.5 * attempt)


def to_speech(text):
    """Strip the printed marks that must not be spoken (italics brackets and the
    paragraph pilcrow) without changing the wording."""
    spoken = str(text or "")
    spoken = spoken.replace("[", "").replace("]", "")
    spoken = re.sub(r"([A-Za-z])[\u00B6\uFFFD\u2019](?=[A-Za-z\s]|$)", r"\1'", spoken)
    spoken = re.sub(r"[\u00B6\uFFFD]", " ", spoken)
    return re.sub(r"\s+", " ", spoken).strip()


# --- synthesis --------------------------------------------------------------
def speak(voice, text):
    """Return (int16 samples as an array, sample rate) for one passage."""
    samples = array.array("h")
    sample_rate = getattr(getattr(voice, "config", None), "sample_rate", 22050)

    chunks = voice.synthesize(text)
    for chunk in chunks:
        rate = getattr(chunk, "sample_rate", None)
        if rate:
            sample_rate = rate
        raw = getattr(chunk, "audio_int16_bytes", None)
        if raw is None:
            ints = getattr(chunk, "audio_int16_array", None)
            raw = ints.tobytes() if ints is not None else b""
        if raw:
            piece = array.array("h")
            piece.frombytes(raw[: len(raw) - (len(raw) % 2)])
            samples.extend(piece)
    return samples, sample_rate


def silence(ms, sample_rate):
    return array.array("h", bytes(2 * int(sample_rate * ms / 1000)))


def encode_mp3(samples, sample_rate, path, bitrate=48):
    import lameenc  # imported here so --help works without the dependency

    encoder = lameenc.Encoder()
    encoder.set_bit_rate(bitrate)
    encoder.set_in_sample_rate(sample_rate)
    encoder.set_channels(1)
    encoder.set_quality(5)
    data = encoder.encode(samples.tobytes()) + encoder.flush()
    with open(path, "wb") as handle:
        handle.write(data)
    return len(data)


# --- one chapter ------------------------------------------------------------
def render_chapter(voice, verses, sample_rate_hint=None):
    combined = array.array("h")
    timings = []
    sample_rate = sample_rate_hint or 22050

    for verse in verses:
        number = int(verse.get("verse") or 0)
        text = to_speech(verse.get("text"))
        if not text:
            continue
        is_paragraph = "\u00B6" in str(verse.get("text") or "") or "\uFFFD" in str(verse.get("text") or "")
        if len(timings):
            gap = PARAGRAPH_GAP_MS if is_paragraph else VERSE_GAP_MS
            combined.extend(silence(gap, sample_rate))
        start = len(combined) / sample_rate
        samples, sample_rate = speak(voice, text)
        combined.extend(samples)
        timings.append({
            "verse": number,
            "start": round(start, 3),
            "end": round(len(combined) / sample_rate, 3),
        })
        combined.extend(silence(120, sample_rate))
        timings[-1]["end"] = round(len(combined) / sample_rate, 3)

    return combined, sample_rate, timings


def main():
    parser = argparse.ArgumentParser(description="Render the KJB to chapter MP3s with Piper.")
    parser.add_argument("--voice", required=True, help="path to a Piper .onnx voice model")
    parser.add_argument("--out", default="audio", help="output folder (default: audio)")
    parser.add_argument("--api", default=DEFAULT_API, help="bibleApi endpoint serving the chapter text")
    parser.add_argument("--bible-data", default="src/lib/bibleData.js", help="app book table")
    parser.add_argument("--book", action="append", help="only this book (repeatable, e.g. --book Genesis)")
    parser.add_argument("--limit", type=int, default=0, help="stop after N chapters (0 = all)")
    parser.add_argument("--force", action="store_true", help="re-render chapters that already exist")
    args = parser.parse_args()

    try:
        from piper import PiperVoice
    except ImportError:
        sys.exit("Piper is not installed. Run: pip install piper-tts lameenc")

    books = load_books(args.bible_data)
    if args.book:
        wanted = {name.lower() for name in args.book}
        books = [b for b in books if b["apiName"].lower() in wanted]

    os.makedirs(args.out, exist_ok=True)
    manifest_path = os.path.join(args.out, "manifest.json")
    manifest = {"voice": os.path.basename(args.voice).replace(".onnx", ""), "chapters": []}
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as handle:
            manifest.update(json.load(handle))
    done = {(c["abbr"].lower(), int(c["chapter"])) for c in manifest["chapters"]}

    voice = PiperVoice.load(args.voice)
    rendered = 0
    total = sum(b["chapters"] for b in books)
    index = 0

    for book in books:
        for chapter in range(1, book["chapters"] + 1):
            index += 1
            label = f"{book['apiName']} {chapter}"
            abbr = book["abbr"].lower()
            filename = f"{book['abbr']}-{chapter:03d}.mp3"
            path = os.path.join(args.out, filename)

            if not args.force and (abbr, chapter) in done and os.path.exists(path):
                print(f"[{index}/{total}] {label} — already rendered")
                continue

            print(f"[{index}/{total}] {label} …", flush=True)
            started = time.time()
            verses = fetch_chapter(args.api, book["apiName"], chapter)
            samples, sample_rate, timings = render_chapter(voice, verses)
            size = encode_mp3(samples, sample_rate, path)
            duration = round(len(samples) / sample_rate, 2)

            manifest["chapters"] = [c for c in manifest["chapters"]
                                    if (c["abbr"].lower(), int(c["chapter"])) != (abbr, chapter)]
            manifest["chapters"].append({
                "book": book["apiName"],
                "abbr": abbr,
                "chapter": chapter,
                "file": filename,
                "duration": duration,
                "bytes": size,
                "timings": timings,
            })
            manifest["chapters"].sort(key=lambda c: (c["abbr"], int(c["chapter"])))
            with open(manifest_path, "w", encoding="utf-8") as handle:
                json.dump(manifest, handle)

            rendered += 1
            print(f"    {duration:.1f}s of audio, {size / 1024:.0f} KB, {time.time() - started:.1f}s wall")
            if args.limit and rendered >= args.limit:
                print("Reached --limit; stopping.")
                return

    print(f"Done. {rendered} chapter(s) rendered into {args.out}/")


if __name__ == "__main__":
    main()