// Builds the Android app (a debug APK you can install directly) from the already-synced android/ project.
// Usage: npm run android   (builds the web version, copies it into the app, then runs this)
// Needs Android Studio: its bundled Java and the SDK in the default places (override with JAVA_HOME / ANDROID_HOME).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), ANDROID = path.join(ROOT, 'android');
const win = process.platform === 'win32';

const javaHome = process.env.JAVA_HOME || [
  'C:/Program Files/Android/Android Studio/jbr','/Applications/Android Studio.app/Contents/jbr/Contents/Home', '/opt/android-studio/jbr',
].find(p => fs.existsSync(p));
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || [
  path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'), path.join(process.env.HOME || '', 'Library', 'Android', 'sdk'), path.join(process.env.HOME || '', 'Android', 'Sdk'),
].find(p => fs.existsSync(p));
if (!javaHome || !sdk) { console.error('Need Android Studio (Java) and the Android SDK; set JAVA_HOME and ANDROID_HOME.'); process.exit(1); }

fs.writeFileSync(path.join(ANDROID, 'local.properties'), `sdk.dir=${sdk.split(path.sep).join('/')}\n`);
execFileSync(path.join(ANDROID, win ? 'gradlew.bat' : 'gradlew'),['assembleDebug', '--console=plain'], {
  cwd: ANDROID, stdio: 'inherit', shell: win, env: { ...process.env, JAVA_HOME: javaHome },
});

const apk = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
fs.mkdirSync(path.join(ROOT, 'release'), { recursive: true });
fs.copyFileSync(apk, path.join(ROOT, 'release', 'lure.apk'));
console.log(`release/lure.apk (${(fs.statSync(apk).size / 1e6).toFixed(1)} MB)`);
