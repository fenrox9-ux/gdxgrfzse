const http = require("http");
const fs = require("fs");
const path = require("path");
const PORT = process.env.PORT || 3000;
const TYPES = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json",".svg":"image/svg+xml",".png":"image/png",".ico":"image/x-icon"};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const file = path.join(__dirname, path.normalize(p));
  if (!file.startsWith(__dirname)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Topilmadi"); }
    res.writeHead(200, {"Content-Type": TYPES[path.extname(file)] || "application/octet-stream"});
    res.end(data);
  });
}).listen(PORT, () => console.log(`Sayt ishga tushdi: http://localhost:${PORT}`));
