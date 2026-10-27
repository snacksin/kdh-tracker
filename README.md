# KPop Demon Hunters — Card Tracker (Vercel)

A self-contained collection tracker for the Kayou *KPop Demon Hunters* trading
cards (Series 1 Energy, Classic, Special Mini; Series 2 Energy, Classic; Laser
Tickets), served on Vercel.

The app is the single file [`kdh-tracker.html`](kdh-tracker.html) — HTML, CSS,
JS, and the Series 1 artwork (embedded as base64) in one ~15 MB file. It is
served **as-is**, byte for byte. Series 2 and ticket artwork lives in
[`img/`](img) as small WebP files that Vercel serves as plain static files, so
they only load when someone opens that series.

## How it's served

`kdh-tracker.html` is larger than Vercel's 4.5 MB *buffered* response limit, so a
plain `res.send(file)` would fail with `FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE`.
Instead, [`api/index.js`](api/index.js) is a Node.js serverless function that
**streams** the file (`fs.createReadStream().pipe(res)`), which bypasses that
limit. [`vercel.json`](vercel.json) bundles the HTML into the function via
`includeFiles` and rewrites `/` to the function.

## Deploy

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Or import this repo in the Vercel dashboard (framework preset: **Other**). No
build step is required.

## Local check

```bash
# from the repo root
node -e "const h=require('./api/index.js');const http=require('http');\
const s=http.createServer(h);s.listen(3000,()=>console.log('http://localhost:3000/api/index'))"
```

## Not affiliated

Fan-made tracker. Not official or affiliated in any way; characters and artwork
belong to the creators of *KPop Demon Hunters* and Kayou.
