import express from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

const app = express();
const port = process.env.PORT || 3000;

// Faz o servidor ler o seu index.html automaticamente
app.use(express.static("./"));

// Rota para pegar as informações do vídeo (Título e Capa)
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
    } catch (e) { 
      res.status(500).json({ error: "Erro ao processar dados" }); 
    }
  });
});

// Rota que faz o download real e ativa a barra azul do Safari
app.get("/api/download", (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send("URL ausente");
  
  // Cria um arquivo temporário no servidor para o iPhone reconhecer o tamanho
  const tmpPath = path.join(os.tmpdir(), `video_${Date.now()}.mp4`);
  
  const ytdlp = spawn("yt-dlp", [
    "-f", "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]",
    "-o", tmpPath,
    videoUrl
  ]);

  ytdlp.on("close", (code) => {
    if (code !== 0) return res.status(500).send("Erro no download");
    
    // Envia o arquivo final para o seu celular
    res.download(tmpPath, "video_lamonie.mp4", (err) => {
      // Apaga o arquivo do servidor depois que você baixar para não ocupar espaço
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    });
  });
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
