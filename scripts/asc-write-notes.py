#!/usr/bin/env python3
"""Write the App Store "What's New" text for a release from the workflow.

Backs the "Build Apple Apps" `release_notes` dispatch input -- the App Store
counterpart of the Build Android `release_notes` option. Given the release's
marketing version (2.428) and the notes text, it writes the en-GB What's New on
the editable version record for each requested platform, in the owner's format:

    iOS/MacOS App Version: 2.428

    - First bullet

    - Second bullet

    - Release note generated with Ai.

Notes come from --notes or the ASC_RELEASE_NOTES env var (env is safer for
multi-line dispatch input). Literal \\n is treated as a line break, each line
becomes a bullet, and the header/footer are added if the text lacks them. ASC
caps What's New at 4000 characters, so anything longer fails before writing.

Usage:
  asc-write-notes.py --app 6813352869 --platform all --version 2.428 \
                     [--locale en-GB] [--notes "..."] [--dry-run]
"""
import argparse
import base64
import os
import sys
import time

import jwt
import requests

BASE = "https://api.appstoreconnect.apple.com"
EDITABLE_STATES = {
    "PREPARE_FOR_SUBMISSION",
    "DEVELOPER_REJECTED",
    "REJECTED",
    "METADATA_REJECTED",
    "INVALID_BINARY",
}
PLATFORMS = {"all": ["IOS", "MAC_OS"], "IOS": ["IOS"], "MAC_OS": ["MAC_OS"]}
FOOTER = "- Release note generated with Ai."
LIMIT = 4000

KEY_P8 = os.environ.get("ASC_KEY_P8", "")
if KEY_P8 and not KEY_P8.lstrip().startswith("-----BEGIN"):
    KEY_P8 = base64.b64decode(KEY_P8).decode()
KEY_ID = os.environ["ASC_KEY_ID"]
ISSUER = os.environ["ASC_ISSUER_ID"]


def log(msg):
    print(f"[asc-write-notes] {msg}", file=sys.stderr)


def token():
    now = int(time.time())
    return jwt.encode({"iss": ISSUER, "iat": now, "exp": now + 600,
                       "aud": "appstoreconnect-v1"}, KEY_P8,
                      algorithm="ES256", headers={"kid": KEY_ID})


def api(method, path, params=None, body=None):
    for attempt in range(5):
        try:
            r = requests.request(
                method, BASE + path,
                headers={"Authorization": "Bearer " + token(),
                         "Content-Type": "application/json"},
                params=params, json=body, timeout=60)
            if r.status_code in (429, 500, 502, 503, 504):
                raise requests.HTTPError(f"transient {r.status_code}", response=r)
            return r
        except (requests.HTTPError, requests.ConnectionError, requests.Timeout) as e:
            transient = isinstance(e, requests.HTTPError) and getattr(e, "response", None) is not None \
                and e.response.status_code in (429, 500, 502, 503, 504)
            if attempt == 4 or not (transient or not isinstance(e, requests.HTTPError)):
                raise
            wait = 3 * (attempt + 1)
            log(f"transient error ({e}); retrying in {wait}s")
            time.sleep(wait)


def build_text(version, raw):
    """Owner format: version header, blank-line-separated bullets, AI footer."""
    lines = [ln.strip() for ln in raw.replace("\\n", "\n").splitlines()]
    lines = [ln for ln in lines if ln]
    header = f"iOS/MacOS App Version: {version}"
    bullets = []
    for ln in lines:
        if ln.lower().startswith("ios/macos app version") or ln.lower().startswith("ios app version") \
                or ln.lower().startswith("macos app version"):
            continue
        if ln == FOOTER:
            continue
        bullets.append(ln if ln.startswith("-") else f"- {ln}")
    parts = [header, "", *bullets]
    if not bullets:
        parts = [header]
    return "\n\n".join([p for p in parts if p != ""]) + "\n\n" + FOOTER


def find_version(app, platform, version):
    r = api("GET", f"/v1/apps/{app}/appStoreVersions",
            params={"filter[platform]": platform, "limit": 200})
    r.raise_for_status()
    named = [v for v in r.json().get("data", [])
             if v["attributes"]["versionString"] == version]
    for v in sorted(named, key=lambda x: x["attributes"].get("createdDate", ""), reverse=True):
        if v["attributes"].get("appStoreState") in EDITABLE_STATES:
            return v
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--app", required=True)
    ap.add_argument("--platform", required=True, choices=sorted(PLATFORMS))
    ap.add_argument("--version", required=True)
    ap.add_argument("--locale", default="en-GB")
    ap.add_argument("--notes", default=os.environ.get("ASC_RELEASE_NOTES", ""))
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    version = args.version.strip()
    raw = (args.notes or "").strip()
    if not raw:
        print("ASC notes: skipped (no release notes given)")
        return 0

    text = build_text(version, raw)
    if len(text) > LIMIT:
        log(f"notes are {len(text)} characters, ASC allows {LIMIT}")
        print(f"ASC notes: not written, {len(text)} characters exceeds the {LIMIT} limit")
        return 1

    failures = 0
    for platform in PLATFORMS[args.platform]:
        ver = find_version(args.app, platform, version)
        if ver is None:
            log(f"{platform}: no editable record named {version}")
            print(f"- {platform}: notes not written, no editable record named {version}")
            failures += 1
            continue

        r = api("GET", f"/v1/appStoreVersions/{ver['id']}/appStoreVersionLocalizations",
                params={"limit": 50})
        r.raise_for_status()
        locs = r.json().get("data", [])
        match = next((l for l in locs if l["attributes"].get("locale") == args.locale), None)

        if args.dry_run:
            log(f"{platform}: would write {len(text)} chars to {args.locale}")
            print(f"- {platform}: would write What's New for {version} ({args.locale}, "
                  f"{len(text)} chars, {text.count(chr(10) + '- ')} bullets)")
            continue

        if match is None:
            resp = api("POST", "/v1/appStoreVersionLocalizations",
                       body={"data": {"type": "appStoreVersionLocalizations",
                                      "attributes": {"locale": args.locale, "whatsNew": text},
                                      "relationships": {"appStoreVersion": {
                                          "data": {"type": "appStoreVersions", "id": ver["id"]}}}}})
        else:
            resp = api("PATCH", f"/v1/appStoreVersionLocalizations/{match['id']}",
                       body={"data": {"type": "appStoreVersionLocalizations",
                                      "id": match["id"],
                                      "attributes": {"whatsNew": text}}})

        if resp.status_code in (200, 201):
            log(f"{platform}: What's New written for {version} ({args.locale})")
            print(f"- {platform}: What's New written for {version} ({args.locale})")
        else:
            log(f"{platform}: write failed ({resp.status_code}): {resp.text[:300]}")
            print(f"- {platform}: notes not written ({resp.status_code}) {resp.text[:200]}")
            failures += 1

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
