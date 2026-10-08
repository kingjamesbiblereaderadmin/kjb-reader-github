#!/usr/bin/env python3
"""Revoke stale Mac Catalyst (Mac Software Development) certificates.

Every CI macOS build signs automatically on a brand-new runner keychain, so
Xcode mints a fresh Mac Catalyst development certificate each run. Those
certificates are useless after the run (the private key lives only on that
runner's keychain), but they accumulate on the Apple Developer account until
the certificate quota is hit - at which point xcodebuild fails with
"Choose a certificate to revoke. Your account has reached the maximum number
of certificates." and "No signing certificate 'Mac Development' found".

This script lists all MAC_SOFTWARE_DEVELOPMENT certificates and revokes them,
freeing the quota so the build can mint a fresh one. It never touches
distribution certificates (needed to ship) or iOS development certificates.
"""
import os
import sys
import time

import jwt
import requests

KEY_PATH = os.path.expanduser(
    "~/.appstoreconnect/private_keys/AuthKey_" + os.environ["ASC_KEY_ID"] + ".p8"
)


def token():
    key = open(KEY_PATH).read()
    return jwt.encode(
        {
            "iss": os.environ["ASC_ISSUER_ID"],
            "iat": int(time.time()),
            "exp": int(time.time()) + 900,
            "aud": "appstoreconnect-v1",
        },
        key,
        algorithm="ES256",
        headers={"kid": os.environ["ASC_KEY_ID"]},
    )


def get_all(headers, url):
    out = []
    while url:
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        data = r.json()
        out.extend(data.get("data", []))
        url = data.get("links", {}).get("next")
    return out


def main():
    headers = {"Authorization": "Bearer " + token()}
    certs = get_all(
        headers,
        "https://api.appstoreconnect.apple.com/v1/certificates"
        "?filter%5BcertificateType%5D=MAC_SOFTWARE_DEVELOPMENT&limit=200",
    )
    if not certs:
        print("No Mac Catalyst development certificates on the account. Nothing to revoke.")
        return
    print(f"Found {len(certs)} Mac Catalyst development certificate(s):")
    for c in certs:
        attrs = c.get("attributes", {})
        print(f"- {c['id']}: {attrs.get('displayName')} (created {attrs.get('createdDate')})")
    failures = 0
    for c in certs:
        r = requests.delete(
            f"https://api.appstoreconnect.apple.com/v1/certificates/{c['id']}", headers=headers
        )
        name = c.get("attributes", {}).get("displayName")
        if r.status_code in (200, 204):
            print(f"Revoked {c['id']} ({name})")
        elif r.status_code == 404:
            print(f"Already gone: {c['id']} ({name})")
        else:
            failures += 1
            print(
                f"Failed to revoke {c['id']} ({name}): HTTP {r.status_code}: {r.text[:200]}",
                file=sys.stderr,
            )
    if failures:
        print(f"{failures} certificate(s) could not be revoked", file=sys.stderr)
        sys.exit(1)
    print("Done - certificate quota slots freed.")


if __name__ == "__main__":
    main()
