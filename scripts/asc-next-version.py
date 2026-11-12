#!/usr/bin/env python3
"""Print the next collision-free marketing version for one ASC platform.

altool rejects an upload whose CFBundleShortVersionString:
- is not higher than the highest already-approved version (error 90062), or
- matches a version that is closed for new builds (error 90478) -- anything
  submitted for review, approved, pending release, or released.

Usage:
  asc-next-version.py --app <asc_app_id> --platform IOS|MAC_OS|all [--requested X]

--platform all resolves ONE number across every platform, so an iOS build and
a macOS build from the same run always carry the same marketing version
(owner rule 2026-11-12). Without it, a per-platform resolver can hand macOS a
number far below the iOS track (run 89 produced iOS 2.115 and macOS 2.89).

Resolution:
- --requested is honored only when it names an OPEN staged version
  (PREPARE_FOR_SUBMISSION / DEVELOPER_REJECTED / REJECTED) AND is higher
  than every closed version on that platform, or when it is a brand-new
  number above every closed version.
- Otherwise the result is the patch-bump of the highest existing version
  (1.0.3 -> 1.0.4, 1.3 -> 1.4, 2.90 -> 2.91), which is always free and
  always higher than the last approved version.

Only the resolved version prints to stdout; diagnostics go to stderr.
"""
import argparse
import base64
import os
import sys
import time

import jwt
import requests

OPEN_STATES = {"PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED"}

KEY_P8 = os.environ.get("ASC_KEY_P8", "")
if KEY_P8 and not KEY_P8.lstrip().startswith("-----BEGIN"):
    KEY_P8 = base64.b64decode(KEY_P8).decode()
KEY_ID = os.environ["ASC_KEY_ID"]
ISSUER = os.environ["ASC_ISSUER_ID"]
BASE = "https://api.appstoreconnect.apple.com"


def log(msg):
    print(f"[asc-next-version] {msg}", file=sys.stderr)


def token():
    now = int(time.time())
    return jwt.encode({"iss": ISSUER, "iat": now, "exp": now + 600,
                       "aud": "appstoreconnect-v1"}, KEY_P8,
                      algorithm="ES256", headers={"kid": KEY_ID})


def versions_for(app, platform):
    out = []
    url = f"{BASE}/v1/apps/{app}/appStoreVersions"
    params = {"limit": 100}
    while True:
        # Apple's API returns sporadic 5xx/429 responses (a macOS job died on a
        # single 500 from this exact call on 2026-11-03 while iOS succeeded
        # minutes later), so retry transient failures with backoff instead of
        # failing the whole build.
        d = None
        for attempt in range(5):
            try:
                r = requests.get(url, headers={"Authorization": "Bearer " + token()},
                                 params=params, timeout=60)
                if r.status_code in (429, 500, 502, 503, 504):
                    raise requests.HTTPError(f"transient {r.status_code}", response=r)
                r.raise_for_status()
                d = r.json()
                break
            except (requests.HTTPError, requests.ConnectionError, requests.Timeout) as e:
                transient = isinstance(e, requests.HTTPError) and getattr(e, "response", None) is not None \
                    and e.response.status_code in (429, 500, 502, 503, 504)
                if attempt == 4 or not (transient or not isinstance(e, requests.HTTPError)):
                    raise
                wait = 3 * (attempt + 1)
                log(f"transient error ({e}); retrying in {wait}s")
                time.sleep(wait)
        wanted = {"IOS", "MAC_OS"} if platform == "all" else {platform}
        out += [x for x in d.get("data", [])
                if x["attributes"].get("platform") in wanted]
        nxt = (d.get("links") or {}).get("next")
        if not nxt:
            return out
        url, params = nxt, None


def vkey(v):
    parts = [int(p) if p.isdigit() else 0 for p in v.split(".")]
    while len(parts) < 3:
        parts.append(0)
    return tuple(parts)


def bump(v):
    parts = v.split(".")
    parts[-1] = str((int(parts[-1]) + 1) if parts[-1].isdigit() else 1)
    return ".".join(parts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--app", required=True)
    ap.add_argument("--platform", required=True, choices=["IOS", "MAC_OS", "all"])
    ap.add_argument("--requested", default="")
    args = ap.parse_args()

    vers = versions_for(args.app, args.platform)
    if not vers:
        chosen = (args.requested or "").strip() or "1.0"
        log(f"no existing {args.platform} versions; using {chosen}")
        print(chosen)
        return

    states = {v["attributes"]["versionString"]: v["attributes"].get("appStoreState")
              for v in vers}
    max_v = max(states, key=vkey)
    closed = [vs for vs, st in states.items() if st not in OPEN_STATES]
    max_closed = max(closed, key=vkey) if closed else None

    req = (args.requested or "").strip()
    if req:
        st = states.get(req)
        higher = (max_closed is None) or (vkey(req) > vkey(max_closed))
        if st in OPEN_STATES and higher:
            log(f"using requested {req}: staged version is open ({st})")
            print(req)
            return
        if st is None and higher:
            log(f"using requested {req}: new version above the highest "
                f"closed one ({max_closed})")
            print(req)
            return
        log(f"requested {req} is not usable (state={st}, highest closed="
            f"{max_closed}); falling back to the next free version")

    nxt = bump(max_v)
    log(f"highest {args.platform} version {max_v} -> next free {nxt}")
    print(nxt)


if __name__ == "__main__":
    main()
