import base64, os, time, json
import jwt, requests

KEY_P8 = os.environ["ASC_KEY_P8"]
if not KEY_P8.lstrip().startswith("-----BEGIN"):
    KEY_P8 = base64.b64decode(KEY_P8).decode()
KEY_ID = os.environ["ASC_KEY_ID"]
ISSUER = os.environ["ASC_ISSUER_ID"]
BASE = "https://api.appstoreconnect.apple.com"

token = jwt.encode(
    {"iss": ISSUER, "iat": int(time.time()), "exp": int(time.time()) + 1200, "aud": "appstoreconnect-v1"},
    KEY_P8, algorithm="ES256", headers={"kid": KEY_ID})
H = {"Authorization": f"Bearer {token}"}

r = requests.get(f"{BASE}/v1/apps?filter[bundleId]=com.kingjamesbiblereader.twa&limit=1", headers=H)
r.raise_for_status()
app_id = r.json()["data"][0]["id"]

r = requests.get(f"{BASE}/v1/builds?filter[app]={app_id}&sort=-uploadedDate&limit=20&fields[builds]=version,processingState,uploadedDate,expired", headers=H)
r.raise_for_status()
for b in r.json()["data"]:
    a = b["attributes"]
    print(b["id"], "| version:", a.get("version"), "| state:", a.get("processingState"), "| uploaded:", a.get("uploadedDate"), "| expired:", a.get("expired"))
