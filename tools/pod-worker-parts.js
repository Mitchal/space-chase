// A pod can add to the game's service worker with a service-worker.js in its folder (e.g. the daily reminder shows
// its push notification there). This lists them as one importScripts line, for the built service worker
// (build-web.js) and the dev server's (serve.js). Delete the pod and its part isn't loaded.
const fs = require('fs'), path = require('path');

module.exports = function podWorkerParts(podsDir) {
  const pods = fs.existsSync(podsDir) ? fs.readdirSync(podsDir).sort() : [];
  const parts = pods.filter(n => fs.existsSync(path.join(podsDir, n, 'pod.js')) && fs.existsSync(path.join(podsDir, n, 'service-worker.js')))
    .map(n => JSON.stringify(`pods/${n}/service-worker.js`));
  return parts.length ? `importScripts(${parts.join(', ')});\n` : '';
};
