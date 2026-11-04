# Hosting the web version at spacechase.mikaelbrandt.com

The web version is served by **GitHub Pages** from this repo (github.com/Mitchal/space-chase). Every push to `master`
builds `dist/` and publishes it (`.github/workflows/deploy-web.yml`). mikaelbrandt.com itself stays as it is (Porkbun
forwarding to your l.ink page); only the subdomain points at GitHub.

## DNS (once)
At **Porkbun → mikaelbrandt.com → DNS**, add one record and leave everything else alone:

| Type | Host | Answer | TTL |
|---|---|---|---|
| CNAME | `spacechase` | `mitchal.github.io` | 600 |

Then in the repo: **Settings → Pages**, wait for the DNS check to pass, and tick **Enforce HTTPS** (the certificate can
take up to about an hour).

**Recommended:** verify the domain in **GitHub → Settings (your profile) → Pages → Add a domain** (`mikaelbrandt.com`, one TXT
record at Porkbun). It stops anyone else's repo from claiming a subdomain of yours.

## Updating
Push to `master`. The Actions tab shows the deploy; players get the new version the next time they open the game.
Bump `version` in `package.json` for a release (the offline cache and the Android version code follow it).

## Addresses
- Game: https://spacechase.mikaelbrandt.com/
- Privacy policy (for Google Play): https://spacechase.mikaelbrandt.com/privacy.html
