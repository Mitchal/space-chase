// Builds the Android app from the already-synced android/ project.
//   npm run android           → release/space-chase.apk, a debug build you can install directly (or push with adb)
//   npm run android:release   → release/space-chase.aab, the signed bundle Google Play wants (needs android/keystore.properties)
// Needs Android Studio: its bundled Java and the SDK in the default places (override with JAVA_HOME / ANDROID_HOME).
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), ANDROID = path.join(ROOT, 'android');
const win = process.platform === 'win32', release = process.argv.includes('--release');

const javaHome = process.env.JAVA_HOME || [
  'C:/Program Files/Android/Android Studio/jbr', '/Applications/Android Studio.app/Contents/jbr/Contents/Home', '/opt/android-studio/jbr',
].find(p => fs.existsSync(p));
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || [
  path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'), path.join(process.env.HOME || '', 'Library', 'Android', 'sdk'), path.join(process.env.HOME || '', 'Android', 'Sdk'),
].find(p => fs.existsSync(p));
if (!javaHome || !sdk) { console.error('Need Android Studio (Java) and the Android SDK; set JAVA_HOME and ANDROID_HOME.'); process.exit(1); }
if (release && !fs.existsSync(path.join(ANDROID, 'keystore.properties'))) {
  console.error('A release bundle must be signed: create your upload key and android/keystore.properties first (see PUBLISHING.md).');
  process.exit(1);
}

fs.writeFileSync(path.join(ANDROID, 'local.properties'), `sdk.dir=${sdk.split(path.sep).join('/')}\n`);
const gradlew = path.join(ANDROID, win ? 'gradlew.bat' : 'gradlew');
execSync(`"${gradlew}" ${release ? 'bundleRelease' : 'assembleDebug'} --console=plain`, { cwd: ANDROID, stdio: 'inherit', env: { ...process.env, JAVA_HOME: javaHome } });

const [from, to] = release
  ? [path.join(ANDROID, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab'), 'space-chase.aab']
  : [path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'), 'space-chase.apk'];
fs.mkdirSync(path.join(ROOT, 'release'), { recursive: true });
fs.copyFileSync(from, path.join(ROOT, 'release', to));
console.log(`release/${to} (${(fs.statSync(from).size / 1e6).toFixed(1)} MB)`);
