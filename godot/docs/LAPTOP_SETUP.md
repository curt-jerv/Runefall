# Laptop Setup (do this when the laptop arrives)

About an hour, mostly downloads. Do the steps in order.

## 1. GitHub: the new repository
1. Sign in at github.com → top right **+** → **New repository**.
2. Name: `Runefall-Godot`. Private. Leave "Add a README" **unticked** (empty repo).
3. Click **Create repository**.
4. Give Claude access: open https://github.com/apps/claude/installations/select_target → your account → **Configure** → under "Repository access" add `Runefall-Godot` → **Save**.
5. Tell Claude "the repo is ready". Claude moves everything from the `godot/` folder of the Runefall repo into it.

## 2. Install
| What | Where | Notes |
|---|---|---|
| **Godot 4.7.2** (standard, not .NET) | godotengine.org/download | a single program, no installer; keep it in a folder like `C:\Godot` |
| **Git** | git-scm.com | default options |
| **Blender 4.5 LTS** | blender.org/download | for models and animations |
| **Android Studio** | developer.android.com/studio | gives the Android SDK; open it once and let it finish setup |
| **JDK 17** | adoptium.net (Temurin 17) | Godot's Android export needs it |
| **Claude desktop app** | claude.ai/download | so Claude can run Godot and test on the laptop |

## 3. Godot Android export (once)
1. Godot → **Editor → Editor Settings → Export → Android**: set the Java SDK path (JDK 17) and the Android SDK path (from Android Studio).
2. **Editor → Manage Export Templates → Download and Install**.
3. **Project → Export → Add… → Android**. Package name: **`com.sol.Runefall`**. Use the **same keystore** as the HTML game's release builds (the one in the GitHub secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`). Keep a copy of the keystore file somewhere safe and offline.
4. In the export preset → **Resources → Filters to export non-resource files**: add `data/*.json` (the game's data files).

## 4. Phone testing
1. On the phone: Settings → About → tap **Build number** 7 times → Developer options → turn on **USB debugging**.
2. Plug the phone in. In Godot the **Remote Debug / one-click deploy** button (top right) runs the game on the phone.

## 5. Open the project
`Runefall-Godot/project/project.godot` → Godot's project manager → **Import** → pick that file → **Edit**. Press **F5** to play the test ground (WASD or arrows to move, J to shoot, Space to roll, C for the tower cutscene).
