#!/usr/bin/env python3
"""Print the next safe iOS build number for this bundle id.

Every CI run must pick a number no earlier upload has used. Two things used to
break that:

1. /v1/builds only lists builds ASC has finished processing. An upload that is
   still processing, or whose processing failed, is a *buildUpload* but not a
   build, so max(builds)+1 handed the next run the SAME number. Its upload then
   died with "409 ... already reached the maximum number of buildUploadFiles",
   and every later run derived the same number and died the same way.
2. The build list was fetched unsorted with limit=200, so once an app has more
   than 200 builds the max would come from the oldest 200.

So: take the highest number seen in BOTH builds and buildUploads (newest 200
of each), add one, and never go below GITHUB_RUN_NUMBER. The run number is
unique and increasing per workflow run, so even if ASC listing is stale or a
query fails, two runs can't pick the same number. Only the number goes to
stdout; diagnostics go to stderr.
"""
import base64, os, sys, time
import jwt, requests

KEY_P8 = os.environ["ASC_KEY_P8"]
if not KEY_P8.lstrip().startswith("-----BEGIN"):
    KEY_P8 = base64.b64decode(KEY_P8).decode()
KEY_ID = os.environ["ASC_KEY_ID"]
ISSUER = os.environ["ASC_ISSUER_ID"]
BASE = "https://api.appstoreconnect.apple.com"


def log(msg):
    print(f"[asc-next-build] {msg}", file=sys.stderr)


token = jwt.encode(
    {"iss": ISSUER, "iat": int(time.time()), "exp": int(time.time()) + 1200, "aud": "appstoreconnect-v1"},
    KEY_P8, algorithm="ES256", headers={"kid": KEY_ID})
H = {"Authorization": f"Bearer {token}"}

r = requests.get(f"{BASE}/v1/apps?filter[bundleId]=com.kingjamesbiblereader.twa&limit=1", headers=H)
r.raise_for_status()
app_id = r.json()["data"][0]["id"]


def numbers(url, attr):
    """Integer build numbers found at `url` (best effort: [] on any failure)."""
    try:
        resp = requests.get(url, headers=H, timeout=30)
        resp.raise_for_status()
        out = []
        for item in resp.json().get("data", []):
            v = str((item.get("attributes") or {}).get(attr) or "")
            if v.isdigit():
                out.append(int(v))
        return out
    except Exception as e:  # never let a diagnostics query break the build
        log(f"could not read {url.split('?')[0]}: {e}")
        return []


built = numbers(f"{BASE}/v1/builds?filter[app]={app_id}&sort=-uploadedDate&limit=200&fields[builds]=version", "version")
uploaded = numbers(f"{BASE}/v1/apps/{app_id}/buildUploads?limit=200", "cfBundleVersion")

try:
    run_floor = int(os.environ.get("GITHUB_RUN_NUMBER", "0"))
except ValueError:
    run_floor = 0

highest = max(built + uploaded, default=0)
nxt = max(highest + 1, run_floor)
log(f"builds: max {max(built, default=0)} (n={len(built)}); buildUploads: max {max(uploaded, default=0)} (n={len(uploaded)}); run floor {run_floor} -> {nxt}")
# GitHub turns "::notice::" lines on stderr into run annotations, so the number
# chosen (and why) is visible on the run page without opening the raw log.
print(f"::notice title=ASC build number::next={nxt} builds_max={max(built, default=0)} uploads_max={max(uploaded, default=0)} run_floor={run_floor}", file=sys.stderr)
print(nxt)
