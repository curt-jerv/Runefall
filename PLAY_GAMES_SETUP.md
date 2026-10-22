# Google Play Games setup (cloud save + leaderboard)

The game code is done; Google needs a few things set up once in Play Console. Paste the two ids into `www/js/net/pgs-config.js` afterwards.

1. **Play Console > your app > Grow users > Play Games Services > Setup and management > Configuration.**
   Choose "I don't use Google APIs in my game yet" → name it "Runefall" → Create. (Fill the short description/category if asked.)
2. **Credentials (still in Configuration):** add an **Android** credential for package `com.sol.Runefall`.
   Create/choose the OAuth client and give it the app signing SHA-1: Play Console > Test and release > Setup > **App signing** > "App signing key certificate" SHA-1. Add a second credential with the **Upload key** SHA-1 too (used for sideloaded builds).
3. **Saved games:** Configuration > Properties > turn on **Saved Games** (Play Games Services v2 needs this for cloud save).
4. **Leaderboard:** Play Games Services > **Leaderboards > Create**. Name `Runefall Rankings`, format **Integer**, order **Larger is better**, no limits. Save and copy its **Leaderboard ID** (starts with `Cgk`).
5. **Project id:** on the Configuration page copy the numeric **Project ID**.
6. **Testers:** Play Games Services > Testers: add your Google account (and your testers) until the Play Games config is published.
7. **Publish** the Play Games configuration (up to 2 hours before it reaches players).
8. Edit `www/js/net/pgs-config.js`: set `PGS_PROJECT_ID` and `PGS_LEADERBOARD_ID`, commit, run the AAB workflow.

How the score works: one number per player = Breach depth x 1000 + level (deepest Breach first, then highest level). Class and tree ride along in the score tag.
