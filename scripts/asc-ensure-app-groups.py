#!/usr/bin/env python3
"""Ensure the App Group capability is enabled on both bundle IDs before export.

xcodebuild -exportArchive -allowProvisioningUpdates cannot CREATE app groups
(it dies with 'Authentication failed' when it needs one that isn't registered),
but an ASC API key CAN enable the APP_GROUPS capability on a bundle ID once the
group itself is registered in the Developer portal. This script:

  1. finds both bundle IDs in the portal,
  2. lists their current capabilities,
  3. enables APP_GROUPS on any that lack it (idempotent),
  4. generates a throwaway 'iOS App Store' profile for the main bundle ID and
     reports whether the app group entitlement actually made it into the
     profile — the ground truth for whether the export will succeed.

Exits 0 with a summary; individual failures are printed, not raised, so the
export step's own error remains the authoritative failure.
"""
import base64, os, sys, time
import jwt, requests

KEY_P8 = os.environ["ASC_KEY_P8"]
if not KEY_P8.lstrip().startswith("-----BEGIN"):
    KEY_P8 = base64.b64decode(KEY_P8).decode()
KEY_ID = os.environ["ASC_KEY_ID"]
ISSUER = os.environ["ASC_ISSUER_ID"]
GROUP = "group.com.kingjamesbiblereader.twa"
BUNDLE_IDS = ["com.kingjamesbiblereader.twa", "com.kingjamesbiblereader.twa.KJBShare"]
BASE = "https://api.appstoreconnect.apple.com"

def token():
    return jwt.encode(
        {"iss": ISSUER, "iat": int(time.time()), "exp": int(time.time()) + 1200,
         "aud": "appstoreconnect-v1"},
        KEY_P8, algorithm="ES256", headers={"kid": KEY_ID})

H = {"Authorization": f"Bearer {token()}"}

def get(url):
    return requests.get(BASE + url, headers=H)

def post(url, payload):
    return requests.post(BASE + url, headers=dict(H, **{"Content-Type": "application/json"}), json=payload)

found = {}
for bid in BUNDLE_IDS:
    r = get(f"/v1/bundleIds?filter[identifier]={bid}&limit=1")
    if r.status_code != 200:
        print(f"[asc-groups] lookup {bid}: HTTP {r.status_code} {r.text[:300]}")
        continue
    data = r.json().get("data", [])
    if not data:
        print(f"[asc-groups] bundle ID {bid} is NOT registered in the portal")
        continue
    found[bid] = data[0]["id"]
    caps = get(f"/v1/bundleIdCapabilities?filter[bundleId]={data[0]['id']}&limit=50")
    types = [c["attributes"]["capabilityType"] for c in caps.json().get("data", [])] if caps.ok else []
    print(f"[asc-groups] {bid}: capabilities = {types or '(none)'}")
    if "APP_GROUPS" not in types:
        pr = post("/v1/bundleIdCapabilities", {
            "data": {
                "type": "capabilities",
                "attributes": {"capabilityType": "APP_GROUPS"},
                "relationships": {"bundleId": {"data": {"type": "bundleIds", "id": data[0]["id"]}}},
            }})
        print(f"[asc-groups] enabling APP_GROUPS on {bid}: HTTP {pr.status_code}"
              + ("" if pr.ok else f" {pr.text[:400]}"))

if "com.kingjamesbiblereader.twa" in found:
    certs = get("/v1/certificates?filter[certificateType]=DISTRIBUTION&limit=5")
    cert_ids = [{"type": "certificates", "id": c["id"]}
               for c in certs.json().get("data", [])] if certs.ok else []
    pr = post("/v1/profiles", {"data": {
        "type": "profiles",
        "attributes": {"name": f"CI appgroup check {int(time.time())}",
                       "profileType": "IOS_APP_STORE"},
        "relationships": {
            "bundleId": {"data": {"type": "bundleIds",
                                  "id": found["com.kingjamesbiblereader.twa"]}},
            "certificates": {"data": cert_ids},
        },
    }})
    if pr.ok:
        content = pr.json()["data"]["attributes"].get("profileContent", "")
        if GROUP.encode() in base64.b64decode(content):
            print("[asc-groups] OK: App Group is registered and included in profiles")
        else:
            print("[asc-groups] PROBLEM: profile created but WITHOUT the app group —"
                  f" register {GROUP} in the Developer portal and attach it to the APP_GROUPS capability")
        pid = pr.json()["data"]["id"]
        requests.delete(BASE + f"/v1/profiles/{pid}", headers=H)
    else:
        print(f"[asc-groups] PROBLEM: profile creation failed: HTTP {pr.status_code} {pr.text[:500]}")
