import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';

const app = express();
app.use(cors());

app.get('/download', (req, res) => {
    const videoURL = req.query.url;

    if (!videoURL) {
        return res.status(400).send('URL faltando');
    }

    // Configura o cabeçalho para download real no iPhone
    res.setHeader('Content-Disposition', 'attachment; filename="video_cntube.mp4"');
    res.setHeader('Content-Type', 'video/mp4');

    // Usa o yt-dlp que você instalou no Docker para fazer o stream direto
    const ls = spawn('yt-dlp', [
        '-o', '-', 
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        videoURL
    ]);

    // Manda os dados do Python direto para o seu navegador (PIPE)
    ls.stdout.pipe(res);

    ls.stderr.on('data', (data) => {
        console.log(`Log: ${data}`);
    });

    ls.on('close', (code) => {
        if (code !== 0) console.log(`Processo terminou com erro: ${code}`);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CnTube Backend rodando na porta ${PORT}`));

