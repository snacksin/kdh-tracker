// Vercel Node.js Serverless Function that serves kdh-tracker.html AS IS.
//
// Why streaming (and not res.send / res.end with the whole buffer):
// kdh-tracker.html is ~11.8 MB (artwork is embedded as base64). A Vercel
// Node function has a 4.5 MB *buffered* response-body limit — returning the
// whole file at once fails with HTTP 500 FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE.
// Streaming the response bypasses that limit (per Vercel docs, streaming
// functions "don't have this limit"), so we pipe the file straight through.
//
// The file is bundled into this function via "functions.includeFiles" in
// vercel.json, and resolved relative to the project root at runtime.

const fs = require('fs');
const path = require('path');

const FILE = 'kdh-tracker.html';

// Vercel places includeFiles relative to the project root, which is also
// process.cwd() at runtime. The __dirname fallbacks keep this working when
// run locally or if the bundling layout ever shifts.
function resolveHtmlPath() {
  const candidates = [
    path.join(process.cwd(), FILE),
    path.join(__dirname, '..', FILE),
    path.join(__dirname, FILE),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (e) {
      /* keep trying */
    }
  }
  return null;
}

module.exports = (req, res) => {
  // Only a page fetch makes sense here.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Method Not Allowed');
    return;
  }

  const filePath = resolveHtmlPath();
  if (!filePath) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(FILE + ' was not found in the deployment bundle.');
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Cache at Vercel's edge so the big payload is served fast; a new
  // deployment busts this automatically, so updates to the HTML still ship.
  res.setHeader(
    'Cache-Control',
    'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400'
  );

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  // Stream the file (chunked) — this is what keeps us under the buffered limit.
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
    res.end('Failed to read ' + FILE);
  });
  stream.pipe(res);
};
