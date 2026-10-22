# Runs after `npx cap add android` / `cap sync`: version numbers, landscape screen, release signing.
import os, re, sys
from pathlib import Path

run = int(os.environ.get("BUILD_NUMBER", "1"))
version_name = os.environ.get("VERSION_NAME", "1.0")

# 1) version code / name (every Play upload needs a higher versionCode)
g = Path("android/app/build.gradle")
s = g.read_text()
s = re.sub(r"versionCode\s+\d+", f"versionCode {run}", s, count=1)
s = re.sub(r'versionName\s+"[^"]*"', f'versionName "{version_name}.{run}"', s, count=1)

# 2) release signing (only when the keystore env vars are present)
if os.environ.get("ANDROID_KEYSTORE_FILE"):
    signing = """
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_FILE"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD") ?: System.getenv("ANDROID_KEYSTORE_PASSWORD")
        }
    }
"""
    if "signingConfigs {" not in s:
        s = s.replace("    buildTypes {", signing + "    buildTypes {", 1)
    s, n = re.subn(r"(buildTypes\s*\{\s*release\s*\{)", r"\1\n            signingConfig signingConfigs.release", s, count=1)
    if n != 1:
        sys.exit("Could not configure release signing.")
g.write_text(s)

# 3) orientation: follow the phone (the in-game Settings can lock landscape or portrait)
m = Path("android/app/src/main/AndroidManifest.xml")
x = m.read_text()
x = re.sub(r'\s*android:screenOrientation="[^"]*"', '', x)
m.write_text(x)
# 4) Google Play Games Services: project id -> res/values/games-ids.xml + manifest meta-data (ids live in www/js/net/pgs-config.js)
cfg = Path("www/js/net/pgs-config.js").read_text()
mm = re.search(r"PGS_PROJECT_ID\s*=\s*'(\d+)'", cfg)
if mm:
    ids = Path("android/app/src/main/res/values/games-ids.xml")
    ids.write_text('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <string name="game_services_project_id" translatable="false">%s</string>\n</resources>\n' % mm.group(1))
    x = m.read_text()
    if "com.google.android.gms.games.APP_ID" not in x:
        x = re.sub(r"(<application\b[^>]*>)", r'\1\n        <meta-data android:name="com.google.android.gms.games.APP_ID" android:value="@string/game_services_project_id" />', x, count=1)
        m.write_text(x)
    print("Play Games project id set:", mm.group(1))
else:
    print("Play Games project id not set (PGS_PROJECT_ID empty) - sign-in will be unavailable in this build")
print(f"Patched: versionCode {run}, versionName {version_name}.{run}")
