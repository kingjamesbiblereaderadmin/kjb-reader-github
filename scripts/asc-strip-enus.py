#!/usr/bin/env python3
"""Best-effort: remove 'en-US' localizations so the app is English (UK) only.

The KJB Reader apps are localized for en-GB only. The main app's ASC record
was created with both en-US and en-GB, and every new version clones its
predecessor's localizations -- so en-US keeps coming back. This script strips
it wherever ASC currently allows:

1. appStoreVersionLocalizations with locale en-US on versions in an EDITABLE
   state (PREPARE_FOR_SUBMISSION / DEVELOPER_REJECTED / REJECTED).
2. appInfoLocalizations with locale en-US on every appInfo (usually blocked
   with 409 STATE_ERROR while live versions or an in-review version use it).

Never fails the build: blocked deletions are reported on stderr and the
script exits 0. Run it on every build; the moment the app has no version
under review, the deletions go through and future runs are no-ops.

Env: ASC_KEY_P8 (PEM or base64), ASC_KEY_ID, ASC_ISSUER_ID.
"""
import base64
import os
import sys
import time

import jwt
import requests

EDITABLE_STATES = {"PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED"}
BASE = "https://api.appstoreconnect.apple.com"
APP = "6813352869"

KEY_P8 = os.environ.get("ASC_KEY_P8", "")
if KEY_P8 and not KEY_P8.lstrip().startswith("-----BEGIN"):
    KEY_P8 = base64.b64decode(KEY_P8).decode()
KEY_ID = os.environ["ASC_KEY_ID"]
ISSUER = os.environ["ASC_ISSUER_ID"]


def log(msg):
    print(f"[asc-strip-enus] {msg}", file=sys.stderr)


def token():
    now = int(time.time())
    return jwt.encode({"iss": ISSUER, "iat": now, "exp": now + 600,
                       "aud": "appstoreconnect-v1"}, KEY_P8,
                      algorithm="ES256", headers={"kid": KEY_ID})


def api(method, path):
    r = requests.request(method, BASE + path,
                         headers={"Authorization": "Bearer " + token()},
                         timeout=60)
    return r


def strip_versions():
    r = api("GET", f"/v1/apps/{APP}/appStoreVersions?limit=100")
    r.raise_for_status()
    stripped = 0
    for v in r.json().get("data", []):
        state = v["attributes"].get("appStoreState")
        if state not in EDITABLE_STATES:
            continue
        ver = v["attributes"]["versionString"]
        lr = api("GET", f"/v1/appStoreVersions/{v['id']}/appStoreVersionLocalizations?limit=50")
        lr.raise_for_status()
        for loc in lr.json().get("data", []):
            if loc["attributes"]["locale"] != "en-US":
                continue
            d = api("DELETE", f"/v1/appStoreVersionLocalizations/{loc['id']}")
            if d.status_code == 204:
                log(f"deleted en-US localization from editable version {ver}")
                stripped += 1
            else:
                log(f"could not delete en-US on version {ver}: HTTP {d.status_code} "
                    f"{d.text[:120]}")
    return stripped


def strip_app_info():
    r = api("GET", f"/v1/apps/{APP}/appInfos?limit=10")
    r.raise_for_status()
    stripped = 0
    for info in r.json().get("data", []):
        lr = api("GET", f"/v1/appInfos/{info['id']}/appInfoLocalizations?limit=50")
        lr.raise_for_status()
        for loc in lr.json().get("data", []):
            if loc["attributes"]["locale"] != "en-US":
                continue
            d = api("DELETE", f"/v1/appInfoLocalizations/{loc['id']}")
            if d.status_code == 204:
                log("deleted en-US app-info localization")
                stripped += 1
            else:
                log(f"app-info en-US not deletable yet: HTTP {d.status_code} "
                    f"{d.text[:120]}")
    return stripped


def main():
    try:
        n = strip_versions() + strip_app_info()
        log(f"done: {n} en-US localization(s) removed; "
            f"0 more than usual means everything was already UK-only or blocked")
    except Exception as exc:  # best-effort: never fail the build
        log(f"warning: strip attempt failed: {exc}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
