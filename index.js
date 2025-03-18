require("dotenv").config();
const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const PORT = process.env?.PORT;

app.use(cors());

const VIDEO_PATH = path.join(__dirname, "your_video_path");

app.get("/video", async (req, res) => {
  try {
    const stats = await fs.promises.stat(VIDEO_PATH);
    const fileSize = stats.size;
    const range = req.headers.range;

    if (!range) {
      // If no Range header, send the first chunk instead of full file
      const start = 0;
      const end = Math.min(2 * 1024 * 1024, fileSize - 1); // First 2MB

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": "video/mp4",
      });

      return fs.createReadStream(VIDEO_PATH, { start, end }).pipe(res);
    }

    // Extract range values
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
    const parts = range.match(/bytes=(\d*)-(\d*)?/);
    const start = parseInt(parts[1], 10) || 0;
    const end = parts[2]
      ? parseInt(parts[2], 10)
      : Math.min(start + CHUNK_SIZE, fileSize - 1);

    // Validate range
    if (start >= fileSize || start > end) {
      res.writeHead(416, {
        "Content-Range": `bytes */${fileSize}`,
      });
      return res.end();
    }

    // Stream the requested chunk
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type": "video/mp4",
    });

    fs.createReadStream(VIDEO_PATH, { start, end }).pipe(res);
  } catch (err) {
    console.error("Error reading video file:", err);
    res.status(500).send("Internal Server Error");
  }
});

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");
//   next();
// });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
