#!/usr/bin/env python3
"""PATCH the App Review 'Notes' field in App Store Connect for the editable
1.74 (or latest editable) version. Run from GitHub Actions with ASC_* env."""
import base64, json, os, sys, time
import jwt, requests

KEY_P8 = os.environ["ASC_KEY_P8"]
if not KEY_P8.lstrip().startswith("-----BEGIN"):
    KEY_P8 = base64.b64decode(KEY_P8).decode()
KEY_ID = os.environ["ASC_KEY_ID"]
ISSUER = os.environ["ASC_ISSUER_ID"]
NOTES = open("fastlane/metadata/review_information/notes.txt").read()
BASE = "https://api.appstoreconnect.apple.com"

token = jwt.encode(
    {"iss": ISSUER, "iat": int(time.time()), "exp": int(time.time()) + 1200, "aud": "appstoreconnect-v1"},
    KEY_P8, algorithm="ES256", headers={"kid": KEY_ID})
H = {"Authorization": f"Bearer {token}"}

r = requests.get(f"{BASE}/v1/apps?filter[bundleId]=com.kingjamesbiblereader.twa&limit=1", headers=H)
r.raise_for_status()
app_id = r.json()["data"][0]["id"]

r = requests.get(f"{BASE}/v1/apps/{app_id}/appStoreVersions?filter[platform]=IOS&limit=10", headers=H)
r.raise_for_status()
editable = {"PREPARE_FOR_SUBMISSION", "WAITING_FOR_REVIEW", "METADATA_REJECTED", "REJECTED", "DEVELOPER_REJECTED", "INVALID_BINARY"}
cands = [v for v in r.json()["data"] if v["attributes"]["versionString"] == "1.74"]
if not cands:
    cands = [v for v in r.json()["data"] if v["attributes"]["appStoreState"] in editable]
ver = sorted(cands, key=lambda v: v["attributes"]["createdDate"])[-1]
print("version:", ver["attributes"]["versionString"], ver["attributes"]["appStoreState"])

rel = f"{BASE}/v1/appStoreVersions/{ver['id']}/appReviewDetail"
r = requests.get(rel, headers=H)
if r.status_code == 200 and r.json().get("data"):
    detail_id = r.json()["data"]["id"]
    req = requests.patch(f"{BASE}/v1/appReviewDetails/{detail_id}",
        headers={**H, "Content-Type": "application/json"},
        json={"data": {"type": "appReviewDetails", "id": detail_id, "attributes": {"notes": NOTES}}})
else:
    req = requests.post(f"{BASE}/v1/appReviewDetails",
        headers={**H, "Content-Type": "application/json"},
        json={"data": {"type": "appReviewDetails", "attributes": {"notes": NOTES},
                       "relationships": {"appStoreVersion": {"data": {"type": "appStoreVersions", "id": ver["id"]}}}}})
print("PATCH status:", req.status_code)
if req.status_code not in (200, 201):
    print(req.text[:500]); sys.exit(1)
print("App Review notes updated.")
