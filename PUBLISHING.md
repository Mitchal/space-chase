# Getting Space Chase onto Google Play

The app is ready to package. Everything below is a step **you** take (accounts, keys, payment, publishing). The project
already has:
- the signed-bundle build;
- the store text (`store/listing.md`);
- the feature graphic and a screenshot (`store/`);
- the icon;
- a privacy policy page (`game/privacy.html`).

Rough timeline: **about an hour of setup, then at least 14 days of closed testing** (Google's rule for new personal
accounts), then review (usually a few days).

## 1. Create a Play Console developer account
1. Go to https://play.google.com/console and sign up with the Google account you want to own the app.
2. Choose **Personal** (just you) or **Organization** (a company: needs a D-U-N-S number).
3. Pay the **one-time $25** fee, verify your identity with ID, and verify a phone number and email.
4. Verification can take a few days. You can prepare everything else in the meantime.

## 2. Create your upload key (once, and keep it safe)
Google re-signs your app with its own key (Play App Signing); you sign uploads with an **upload key**. Run this in a
terminal, choose a password when it asks, and keep the file **outside this project**:

```bash
mkdir -p ~/keys && "/c/Program Files/Android/Android Studio/jbr/bin/keytool.exe" -genkeypair -v -keystore ~/keys/space-chase-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Then create `android/keystore.properties` (it's git-ignored, so it never gets committed):

```properties
storeFile=C:/Users/user/keys/space-chase-upload.jks
storePassword=YOUR_PASSWORD
keyAlias=upload
keyPassword=YOUR_PASSWORD
```

**Back up `space-chase-upload.jks` and the password** (e.g. in a password manager). If it's lost, Play support can reset the
upload key, but that takes days.

## 3. Build the bundle
```bash
npm run android:release
```
This builds the web version, copies it into the app, and writes **`release/space-chase.aab`**, signed with your upload key.
Every upload needs a higher version: bump `"version"` in `package.json` (e.g. 1.0.0 → 1.0.1) before building again.
The Android version code follows it automatically (1.0.1 → 10001).

## 4. Put the privacy policy online
Play requires a public URL for it.
1. Set up the forward for `spacechase@mikaelbrandt.com` (Porkbun → mikaelbrandt.com → Email Forwarding); the privacy page lists it.
2. Host the web build at **spacechase.mikaelbrandt.com** (see `HOSTING.md`).
3. The policy is then at `https://spacechase.mikaelbrandt.com/privacy.html`, and the game itself is playable at
   `https://spacechase.mikaelbrandt.com/`.

## 5. Create the app in Play Console
**Create app**, then fill in:
- App name **Space Chase**, default language, **Game**, **Free**;
- accept the declarations.

**Free is permanent:** a free app can't later become paid. In-app purchases (cosmetics) are still possible.

Then work through **Dashboard → Set up your app**:

| Section | Answer for Space Chase |
|---|---|
| Privacy policy | Your hosted `privacy.html` URL |
| App access | All functionality is available without special access |
| Ads | No ads |
| Content rating | Fill in the IARC questionnaire: Game, and you destroy abstract missiles. No blood, gore, real weapons, chat or user content. Expect "Everyone" / PEGI 3–7. |
| Target audience | **13+** is simplest: choosing under-13 brings the extra Families policy requirements |
| Data safety | **No data collected, no data shared.** (Scores stay on the device; nothing is sent.) |
| Government / financial / health / news apps | No |
| Store listing | Text from `store/listing.md`; icon `game/icons/icon-512.png`; feature graphic `store/feature-graphic.png`; 2+ screenshots from `store/` |

**More screenshots:** play on your phone, then run these two commands (the second crops each shot to Play's 2:1 limit).

```bash
adb exec-out screencap -p > shot.png
```

```bash
python tools/make-store-art.py shot1.png shot2.png
```

I can capture the screenshots from your phone over wireless debugging.

## 6. Test, then go live
1. **Internal testing** (Testing → Internal testing): upload `release/space-chase.aab` and add your own email as a tester. It's
   available in minutes. Install it from the Play link and check it.
2. **Closed testing** is required for new personal accounts:
   - at least **12 testers** must opt in and stay opted in for **14 days in a row**;
   - add them by email (or a Google Group) and send them the opt-in link;
   - testers must install the app from Play;
   - Google also asks about the testing when you apply for production, so actually collect some feedback.
3. **Apply for production access** (Dashboard): answer the questions about your closed test.
4. **Production:** create a release with the same (or a newer) bundle, pick countries, and send it for review. Reviews usually take from a few hours to a few days.

## Updating later
1. Bump the version in `package.json`.
2. Run `npm run android:release`.
3. Upload `release/space-chase.aab` as a new release in Play Console.

Updates to the web version are just `npm run build` plus re-uploading `dist/`.

## Worth knowing
- The app targets Android 16 (API 36), which meets Play's current target-API requirement. Google raises it about yearly, so expect to update Capacitor (`npm i @capacitor/*@latest`) about once a year.
- Before adding an online leaderboard, analytics, ads or purchases, update the privacy policy and the Data safety form first.
- The debug `release/space-chase.apk` is for sideloading and testing only; Play only accepts the signed `.aab`.
