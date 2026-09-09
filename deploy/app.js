// Passenger entry point for cPanel's Node.js app manager.
//
// Passenger starts this file with PORT set and expects an HTTP server on it.
// Next runs in production mode from the build in .next.nosync (the distDir in
// next.config.ts), with next.config.ts and the content/ store beside it.
const http = require("http");
const path = require("path");
const next = require("next");

process.env.NODE_ENV = "production";
const dir = __dirname;
const port = Number(process.env.PORT) || 3000;
const app = next({ dev: false, dir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http.createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`swadsatkar.com ready on ${port} (${path.basename(dir)})`);
  });
}).catch((err) => { console.error(err); process.exit(1); });
