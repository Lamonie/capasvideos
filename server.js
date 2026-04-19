import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';

const app = express();
app.use(cors());

app.get('/download', (req, res) => {
    const videoURL = req.query.url;

    if (!videoURL) return res.status(400).send('URL faltando');

    // Headers mais simples para o Safari não "engasgar"
    res.setHeader('Content-Disposition', 'attachment; filename="video_cntube.mp4"');
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked'); // Diz para o Safari que o arquivo vem aos poucos

    // Comando mais leve para o Render Grátis não cortar a CPU
    const yt = spawn('yt-dlp', [
        '-f', 'mp4',        // Pega o melhor MP4 pronto (mais rápido que converter)
        '--no-playlist',    // Garante que não tente baixar uma lista inteira
        '-o', '-',          // Manda para a saída padrão
        videoURL
    ]);

    yt.stdout.pipe(res);

    yt.stderr.on('data', (data) => {
        console.log(`Log: ${data}`);
    });

    yt.on('error', (err) => {
        console.error('Erro ao iniciar yt-dlp:', err);
    });

    // Se o processo fechar com erro, avisa no log
    yt.on('close', (code) => {
        if (code !== 0) console.log(`Erro no download. Código: ${code}`);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
