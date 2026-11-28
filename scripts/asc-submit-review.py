#!/usr/bin/env python3
"""Attach an uploaded build and submit the App Store version for review.

Used by the "Build Apple Apps" workflow's `submit_for_review` dispatch input --
the App Store equivalent of the Play `play_status: completed` upload. The upload
step only puts the binary in App Store Connect (`fastlane deliver
--skip_app_version_update`), so the build sits unattached and the version record
stays in PREPARE_FOR_SUBMISSION until someone clicks Submit. This script does
that click through the API:

1. resolve the version record for the platform (the one named after the release,
   e.g. 2.500) and confirm it is still editable;
2. wait for the build this run uploaded to finish processing (PROCESSING ->
   VALID) and attach it to that record;
3. open a review submission (or reuse an existing ready one), add the version,
   then PATCH submitted=true, which is what hands it to App Review.

Everything is reported on stdout for the workflow job summary; detail goes to
stderr. Nothing is submitted with --dry-run, and --verify creates the review
submission and deletes it again without submitting (it proves the endpoint shape
without starting a review).

Usage:
  asc-submit-review.py --app 6813352869 --platform IOS --version 2.500 --build 500
                       [--wait-minutes 45] [--dry-run] [--verify]
"""
import argparse
import base64
import re
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
ALREADY_SUBMITTED = {"WAITING_FOR_REVIEW", "IN_REVIEW", "PENDING_DEVELOPER_RELEASE",
                     "PROCESSING_FOR_DISTRIBUTION", "PENDING_APPLE_RELEASE"}
PLATFORMS = {"all": ["IOS", "MAC_OS"], "IOS": ["IOS"], "MAC_OS": ["MAC_OS"]}

KEY_P8 = os.environ.get("ASC_KEY_P8", "")
if KEY_P8 and not KEY_P8.lstrip().startswith("-----BEGIN"):
    KEY_P8 = base64.b64decode(KEY_P8).decode()
KEY_ID = os.environ["ASC_KEY_ID"]
ISSUER = os.environ["ASC_ISSUER_ID"]


def log(msg):
    print(f"[asc-submit-review] {msg}", file=sys.stderr)


def token():
    now = int(time.time())
    return jwt.encode({"iss": ISSUER, "iat": now, "exp": now + 600,
                       "aud": "appstoreconnect-v1"}, KEY_P8,
                      algorithm="ES256", headers={"kid": KEY_ID})


def api(method, path, params=None, body=None):
    """ASC call with the same transient-retry behaviour as the other asc-*.py
    helpers (Apple returns sporadic 5xx/429)."""
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


def paged(path, params):
    out, url, p = [], path, params
    while True:
        r = api("GET", url, params=p)
        r.raise_for_status()
        d = r.json()
        out += d.get("data", [])
        nxt = (d.get("links") or {}).get("next")
        if not nxt:
            return out
        url, p = nxt.replace(BASE, ""), None


def versions_for(app, platform):
    return paged(f"/v1/apps/{app}/appStoreVersions",
                 {"filter[platform]": platform, "limit": 200})


def find_version(versions, target):
    """Return (version, note). version is the record to submit, or None."""
    named = [v for v in versions if v["attributes"]["versionString"] == target]
    if not named:
        return None, "no version record named " + target
    for v in sorted(named, key=lambda x: x["attributes"].get("createdDate", ""), reverse=True):
        state = v["attributes"].get("appStoreState")
        if state in EDITABLE_STATES:
            return v, f"{target} ({state})"
        if state in ALREADY_SUBMITTED:
            return None, f"{target} is already {state} -- already submitted"
    states = sorted({v["attributes"].get("appStoreState") for v in named})
    return None, f"{target} is not editable (states: {', '.join(states)})"


def builds_for(app, build_no):
    return paged("/v1/builds", {"filter[app]": app, "filter[version]": build_no,
                                "include": "preReleaseVersion", "limit": 200})


def pick_build(app, build_no, platform, wait_minutes):
    """Wait for this run's build to finish processing and return it."""
    deadline = time.time() + wait_minutes * 60
    last = None
    while True:
        r = api("GET", "/v1/builds",
                params={"filter[app]": app, "filter[version]": build_no,
                        "include": "preReleaseVersion", "limit": 200})
        r.raise_for_status()
        d = r.json()
        pre = {i["id"]: i["attributes"] for i in d.get("included", [])
               if i["type"] == "preReleaseVersions"}
        for b in d.get("data", []):
            rel = ((b.get("relationships") or {}).get("preReleaseVersion") or {}).get("data") or {}
            pv = pre.get(rel.get("id")) or {}
            if platform and pv.get("platform") and pv["platform"] != platform:
                continue
            state = b["attributes"].get("processingState")
            if state == "VALID":
                log(f"build {build_no} ({platform}) is VALID "
                    f"(preReleaseVersion {pv.get('version')})")
                b = dict(b)
                b["attributes"] = dict(b["attributes"])
                b["attributes"]["_pre_version"] = pv.get("version")
                return b
            last = state
        if time.time() > deadline:
            return None
        log(f"build {build_no} ({platform}) is {last or 'not visible yet'}; "
            f"waiting 60s (up to {wait_minutes}m)")
        time.sleep(60)


def attach_build(version_id, build_id):
    return api("PATCH", f"/v1/appStoreVersions/{version_id}/relationships/build",
               body={"data": {"type": "builds", "id": build_id}})


VERSION_IN_NOTES = re.compile(r"(app\s+version\s*:?\s*)(\d+(?:\.\d+)+)", re.I)


def sync_whats_new(version_id, target, dry_run):
    """Make the What's New header carry the version being submitted.

    A version record can be renamed (2.419 -> 2.427) while the notes still name
    the old release, and App Review would then see a store page whose What's New
    header disagrees with the version. This rewrites just the version token in
    the header (keeping the bullets), or adds the header line when the notes do
    not carry one at all. Returns a list of (locale, old_header, new_header).
    """
    r = api("GET", f"/v1/appStoreVersions/{version_id}/appStoreVersionLocalizations",
            params={"limit": 50})
    if not r.ok:
        return []
    changed = []
    for loc in r.json().get("data", []):
        attrs = loc["attributes"]
        text = (attrs.get("whatsNew") or "").strip()
        if not text:
            log(f"localization {attrs.get('locale')}: no What's New text to sync")
            continue
        first, _, rest = text.partition("\n")
        m = VERSION_IN_NOTES.search(first)
        if m and m.group(2) == target:
            continue
        if m:
            new_first = first[:m.start(2)] + target + first[m.end(2):]
            new_text = new_first + ("\n" + rest if rest else "")
        else:
            new_text = f"iOS/MacOS App Version: {target}\n\n{text}"
        changed.append((attrs.get("locale"), first, new_text.split("\n")[0]))
        if dry_run:
            continue
        patch = api("PATCH", f"/v1/appStoreVersionLocalizations/{loc['id']}",
                    body={"data": {"type": "appStoreVersionLocalizations", "id": loc["id"],
                                   "attributes": {"whatsNew": new_text}}})
        if patch.status_code not in (200, 201):
            log(f"localization {attrs.get('locale')}: What's New PATCH failed "
                f"({patch.status_code}): {patch.text[:300]}")
        else:
            log(f"localization {attrs.get('locale')}: What's New header -> {target}")
    return changed


def whats_new_state(version_id):
    r = api("GET", f"/v1/appStoreVersions/{version_id}/appStoreVersionLocalizations",
            params={"limit": 50})
    if not r.ok:
        return "unknown"
    locs = r.json().get("data", [])
    with_notes = [l["attributes"].get("locale") for l in locs
                  if (l["attributes"].get("whatsNew") or "").strip()]
    return "set (" + ", ".join(with_notes) + ")" if with_notes else "missing"


def open_submission(app, platform):
    r = api("GET", "/v1/reviewSubmissions",
            params={"filter[app]": app, "filter[platform]": platform,
                    "filter[state]": "READY_FOR_REVIEW", "limit": 10})
    if not r.ok:
        log(f"could not list open review submissions ({r.status_code}): {r.text[:200]}")
        return None
    items = r.json().get("data", [])
    return items[0]["id"] if items else None


def create_submission(app, platform):
    r = api("POST", "/v1/reviewSubmissions",
            body={"data": {"type": "reviewSubmissions",
                           "attributes": {"platform": platform},
                           "relationships": {"app": {"data": {"type": "apps", "id": app}}}}})
    if r.status_code not in (200, 201):
        return None, r
    return r.json()["data"]["id"], r


def add_item(submission_id, version_id):
    return api("POST", "/v1/reviewSubmissionItems",
               body={"data": {"type": "reviewSubmissionItems",
                              "relationships": {
                                  "reviewSubmission": {"data": {"type": "reviewSubmissions",
                                                                "id": submission_id}},
                                  "appStoreVersion": {"data": {"type": "appStoreVersions",
                                                               "id": version_id}}}}})


def submit_submission(submission_id):
    return api("PATCH", f"/v1/reviewSubmissions/{submission_id}",
               body={"data": {"type": "reviewSubmissions", "id": submission_id,
                              "attributes": {"submitted": True}}})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--app", required=True)
    ap.add_argument("--platform", required=True, choices=sorted(PLATFORMS))
    ap.add_argument("--version", required=True, help="version string, e.g. 2.500")
    ap.add_argument("--build", required=True, help="build number uploaded by this run")
    ap.add_argument("--wait-minutes", type=int, default=45,
                    help="how long to wait for the build to finish processing")
    ap.add_argument("--dry-run", action="store_true",
                    help="report what would happen; change nothing")
    ap.add_argument("--allow-build-version-mismatch", action="store_true",
                    help="submit even when the build's own version differs from the record")
    ap.add_argument("--verify", action="store_true",
                    help="create the review submission and delete it again without submitting")
    args = ap.parse_args()

    target, build_no = args.version.strip(), args.build.strip()
    if not target or not build_no:
        log("empty --version/--build; nothing to do")
        print("ASC submit: skipped (no version/build given)")
        return 0

    failures = 0
    for platform in PLATFORMS[args.platform]:
        version, note = find_version(versions_for(args.app, platform), target)
        if version is None:
            if "already submitted" in note:
                log(f"{platform}: {note}")
                print(f"- {platform}: {note}")
            else:
                log(f"{platform}: cannot submit -- {note}")
                print(f"- {platform}: not submitted, {note}")
                failures += 1
            continue

        state = version["attributes"].get("appStoreState")
        notes = whats_new_state(version["id"])
        log(f"{platform}: version {target} ({state}), What's New {notes}")

        # A dry run reports what it can see now instead of blocking on Apple.
        build = pick_build(args.app, build_no, platform,
                           0 if args.dry_run else args.wait_minutes)
        if build is None:
            if args.dry_run:
                log(f"{platform}: build {build_no} is not VALID yet")
                print(f"- {platform}: would submit {target}, but build {build_no} "
                      f"is not VALID yet")
                continue
            log(f"{platform}: build {build_no} never reached VALID within "
                f"{args.wait_minutes}m")
            print(f"- {platform}: not submitted, build {build_no} not VALID yet")
            failures += 1
            continue

        # The record and the binary must name the same release, otherwise the
        # store page says 2.427 while the shipped app reports its own version.
        binary_version = build["attributes"].get("_pre_version")
        if binary_version and binary_version != target and not args.allow_build_version_mismatch:
            log(f"{platform}: build {build_no} is version {binary_version}, record is "
                f"{target}; refusing to submit a mismatched pair")
            print(f"- {platform}: not submitted, build {build_no} is {binary_version} "
                  f"but the record is {target}")
            failures += 1
            continue

        synced = sync_whats_new(version["id"], target, args.dry_run)
        for locale, old_head, new_head in synced:
            print(f"- {platform}: What's New header {old_head!r} -> {new_head!r} ({locale})")

        if args.dry_run:
            log(f"{platform}: would attach build {build_no} ({build['id']}) and submit")
            print(f"- {platform}: would attach build {build_no} and submit {target} "
                  f"(What's New {notes})")
            continue

        r = attach_build(version["id"], build["id"])
        if r.status_code not in (200, 204):
            log(f"{platform}: attaching build {build_no} failed ({r.status_code}): {r.text[:300]}")
            print(f"- {platform}: not submitted, could not attach build {build_no} "
                  f"({r.status_code})")
            failures += 1
            continue
        log(f"{platform}: build {build_no} attached to {target}")

        sub_id = open_submission(args.app, platform)
        created = False
        if sub_id:
            log(f"{platform}: reusing open review submission {sub_id}")
        else:
            sub_id, resp = create_submission(args.app, platform)
            if sub_id is None:
                log(f"{platform}: creating a review submission failed "
                    f"({resp.status_code}): {resp.text[:300]}")
                print(f"- {platform}: not submitted, review submission failed "
                      f"({resp.status_code})")
                failures += 1
                continue
            created = True

        item = add_item(sub_id, version["id"])
        if item.status_code not in (200, 201):
            log(f"{platform}: adding the version failed ({item.status_code}): {item.text[:300]}")
            print(f"- {platform}: not submitted, adding the version failed ({item.status_code})")
            failures += 1
            continue

        if args.verify:
            d = api("DELETE", f"/v1/reviewSubmissions/{sub_id}")
            log(f"{platform}: verify mode, deleted review submission {sub_id} ({d.status_code})")
            print(f"- {platform}: verified (submission {sub_id} created and deleted, "
                  f"build {build_no} attached, What's New {notes})")
            continue

        done = submit_submission(sub_id)
        if done.status_code in (200, 201):
            log(f"{platform}: submitted {target} for review (submission {sub_id})")
            print(f"- {platform}: submitted {target} (build {build_no}) for review")
        elif done.status_code == 409 and "already" in done.text.lower():
            print(f"- {platform}: already submitted for review")
        else:
            log(f"{platform}: submit failed ({done.status_code}): {done.text[:400]}")
            print(f"- {platform}: submit failed ({done.status_code}) {done.text[:200]}")
            if created:
                api("DELETE", f"/v1/reviewSubmissions/{sub_id}")
            failures += 1

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
