import express from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("./"));

app.get("/api/info", (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).json({ error: "URL ausente" });
  
  const ytdlp = spawn("yt-dlp", ["--dump-json", "--no-playlist", videoUrl]);
  let raw = "";
  ytdlp.stdout.on("data", (d) => raw += d);
  ytdlp.on("close", (code) => {
    if (code !== 0) return res.status(500).json({ error: "Erro no link" });
    try {
      const info = JSON.parse(raw);
      res.json({
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration_string
      });
    } catch (e) { res.status(500).json({ error: "Erro ao processar" }); }
  });
});

app.get("/api/download", (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send("URL ausente");
  
  const tmpPath = path.join(os.tmpdir(), `video_${Date.now()}.mp4`);
  
  // VERSAO CORRIGIDA: Mais leve para o Render e iPhone
  const ytdlp = spawn("yt-dlp", [
    "-f", "best[ext=mp4]/best",
    "--no-check-certificate",
    "-o", tmpPath,
    videoUrl
  ]);

  ytdlp.on("close", (code) => {
    if (code !== 0) return res.status(500).send("Erro no download");
    res.download(tmpPath, "video_lamonie.mp4", (err) => {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    });
  });
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
