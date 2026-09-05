import re, sys

with open('/tmp/whole.txt', 'r', encoding='utf-8') as f:
    content = f.read()

pages = content.split('\f')
print(f"Total pages: {len(pages)}")

ALLOW_RE = re.compile(
    r'^(Chapter \d+|THE END\.?|THE END OF THE PROPHETS\.?|CONTENTS|\d+ of \d+|'
    r'THE OLD TESTAMENT|THE NEW TESTAMENT|\d+\.\s|.*Cover Page.*)$'
)

flagged = []
for i, page in enumerate(pages, start=1):
    lines = [l.strip() for l in page.split('\n')]
    nonblank = [l for l in lines if l.strip()]
    if len(nonblank) < 2:
        continue
    first = nonblank[0]
    rest = nonblank[1:]
    if not rest:
        continue
    second = rest[0]
    if ALLOW_RE.match(second):
        continue
    word_count = len(second.split())
    starts_with_verse_num = bool(re.match(r'^\d+\s', second))
    if word_count <= 3 and not starts_with_verse_num and not second.isupper():
        flagged.append((i, first, second, rest[1] if len(rest) > 1 else ''))

print(f"Flagged pages: {len(flagged)}")
for i, hdr, second, third in flagged[:200]:
    print(f"--- page {i} --- header: {hdr!r}")
    print(f"    first line: {second!r}")
    print(f"    next line : {third!r}")
