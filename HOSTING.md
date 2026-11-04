# Hosting the web version at spacechase.mikaelbrandt.com

mikaelbrandt.com stays exactly as it is (Porkbun forwarding to your l.ink page). Only the new subdomain points at the
game. Netlify hosts it for free, without a public repo: you upload the built `dist/` folder.

## First time (about 10 minutes)
1. Build the player version:
   ```bash
   npm run build
   ```
2. Go to https://app.netlify.com/drop, sign in (or sign up), and drag the **`dist`** folder onto the page.
   You get a random address like `https://shiny-otter-1234.netlify.app`. Open it and check that the game runs.
3. In that Netlify site: **Site configuration → Change site name** to `spacechase` (so it's `spacechase.netlify.app`).
4. **Domain management → Add a domain** → `spacechase.mikaelbrandt.com`. Netlify says it's an external domain and
   shows the record to add.
5. At **Porkbun → mikaelbrandt.com → DNS**, add one record:

   | Type | Host | Answer | TTL |
   |---|---|---|---|
   | CNAME | `spacechase` | `spacechase.netlify.app` | 600 |

   Leave the existing records and the URL forwarding alone.
6. Back in Netlify, wait for the domain to verify, then **HTTPS → Verify DNS / Provision certificate**. It usually
   takes minutes, at most about an hour.

## Updating
```bash
npm run build
```
Then, in the Netlify site: **Deploys → drag the `dist` folder** onto the deploy area. Players get the new version the
next time they open the game (the offline cache is keyed by the version in `package.json`, so bump it for a release).

## What is public
Only what's in `dist/`: the game itself and `privacy.html`. The source history, taste logs, vision, critic, Android
project and tools are never uploaded.
