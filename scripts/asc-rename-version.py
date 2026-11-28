#!/usr/bin/env python3
"""Rename the editable App Store Connect version record(s) to a release name.

Used by the "Build Apple Apps" workflow's `rename_asc_version` dispatch input so
the ASC version record, the binary's CFBundleShortVersionString and the What's
New header all carry the same number (owner rule: the release is named after
the release run, 2.<run_number>).

Apple only lets you edit the version string while the version is editable, so
this picks the newest editable record per platform and PATCHes it. It is
deliberately best-effort and idempotent:

- a platform already named <target> is a no-op;
- a platform with no editable record (e.g. the version is WAITING_FOR_REVIEW)
  is skipped with a warning, because the upload creates/attaches the record;
- a target that is not higher than the highest closed version is skipped with
  a warning, because altool would reject that upload (error 90062).

Usage:
  asc-rename-version.py --app 6813352869 --platform all --to 2.430 [--dry-run]
                        [--force]

--platform all renames IOS and MAC_OS to the same name so both platforms keep
shipping the identical marketing version. Only a summary prints to stdout (the
workflow tees it into the job summary); details go to stderr.
"""
import argparse
import base64
import os
import sys
import time

import jwt
import requests

EDITABLE_STATES = {
    "PREPARE_FOR_SUBMISSION",
    "DEVELOPER_REJECTED",
    "REJECTED",
    "METADATA_REJECTED",
}
PLATFORMS = {"all": ["IOS", "MAC_OS"], "IOS": ["IOS"], "MAC_OS": ["MAC_OS"]}

BASE = "https://api.appstoreconnect.apple.com"
KEY_P8 = os.environ.get("ASC_KEY_P8", "")
if KEY_P8 and not KEY_P8.lstrip().startswith("-----BEGIN"):
    KEY_P8 = base64.b64decode(KEY_P8).decode()
KEY_ID = os.environ["ASC_KEY_ID"]
ISSUER = os.environ["ASC_ISSUER_ID"]


def log(msg):
    print(f"[asc-rename-version] {msg}", file=sys.stderr)


def token():
    now = int(time.time())
    return jwt.encode({"iss": ISSUER, "iat": now, "exp": now + 600,
                       "aud": "appstoreconnect-v1"}, KEY_P8,
                      algorithm="ES256", headers={"kid": KEY_ID})


def api(method, path, params=None, body=None):
    """ASC GET/PATCH with the same transient-retry behaviour as the other
    asc-*.py helpers (Apple returns sporadic 5xx/429)."""
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


def versions_for(app):
    out, url, params = [], f"/v1/apps/{app}/appStoreVersions", {"limit": 200}
    while True:
        r = api("GET", url, params=params)
        r.raise_for_status()
        d = r.json()
        out += d.get("data", [])
        nxt = (d.get("links") or {}).get("next")
        if not nxt:
            return out
        url, params = nxt.replace(BASE, ""), None


def vkey(v):
    parts = [int(p) if p.isdigit() else 0 for p in v.split(".")]
    while len(parts) < 3:
        parts.append(0)
    return tuple(parts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--app", required=True)
    ap.add_argument("--platform", required=True, choices=sorted(PLATFORMS))
    ap.add_argument("--to", required=True, help="version string, e.g. 2.430")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true",
                    help="rename even when the target is not above the highest closed version")
    args = ap.parse_args()

    target = args.to.strip()
    if not target:
        log("empty --to; nothing to do")
        print("ASC rename: skipped (no target version given)")
        return 0

    versions = versions_for(args.app)
    failures = 0

    # With --platform all both platforms must end up with the same name, so the
    # "is the target above every closed version" guard uses the union of their
    # closed versions. Otherwise one platform could rename and the other skip.
    scope = PLATFORMS[args.platform]
    closed_all = [v["attributes"]["versionString"] for v in versions
                  if v["attributes"].get("platform") in scope
                  and v["attributes"].get("appStoreState") not in EDITABLE_STATES]
    max_closed_all = max(closed_all, key=vkey) if closed_all else None

    for platform in PLATFORMS[args.platform]:
        mine = [v for v in versions
                if v["attributes"].get("platform") == platform]
        named = [v for v in mine if v["attributes"]["versionString"] == target]

        if named:
            state = named[0]["attributes"].get("appStoreState")
            log(f"{platform}: already named {target} ({state}); nothing to do")
            print(f"- {platform}: already {target} ({state})")
            continue

        max_closed = max_closed_all
        if max_closed and vkey(target) <= vkey(max_closed) and not args.force:
            msg = (f"{platform}: {target} is not above the highest closed version "
                   f"{max_closed}; altool would reject the upload (90062). Skipped.")
            log(msg)
            print(f"- {platform}: skipped, {target} <= highest closed {max_closed}")
            continue

        editable = [v for v in mine
                    if v["attributes"].get("appStoreState") in EDITABLE_STATES]
        if not editable:
            states = sorted({v["attributes"].get("appStoreState") for v in mine})
            msg = (f"{platform}: no editable version to rename (states: "
                   f"{', '.join(states) or 'none'}); the upload will create/attach it.")
            log(msg)
            print(f"- {platform}: no editable version (states: {', '.join(states) or 'none'})")
            continue

        ver = sorted(editable, key=lambda v: v["attributes"].get("createdDate", ""))[-1]
        old = ver["attributes"]["versionString"]
        state = ver["attributes"].get("appStoreState")

        if args.dry_run:
            log(f"{platform}: would rename {old} ({state}) -> {target}")
            print(f"- {platform}: would rename {old} ({state}) -> {target}")
            continue

        r = api("PATCH", f"/v1/appStoreVersions/{ver['id']}",
                body={"data": {"type": "appStoreVersions", "id": ver["id"],
                               "attributes": {"versionString": target}}})
        if r.status_code in (200, 201):
            log(f"{platform}: renamed {old} ({state}) -> {target}")
            print(f"- {platform}: renamed {old} ({state}) -> {target}")
        else:
            failures += 1
            log(f"{platform}: PATCH failed ({r.status_code}): {r.text[:400]}")
            print(f"- {platform}: rename failed ({r.status_code}) {r.text[:200]}")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
