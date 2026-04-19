const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const app = express();

app.use(cors());

// Esta é a rota que o seu site CnTube vai chamar
app.get('/download', async (req, res) => {
    const videoURL = req.query.url;

    if (!videoURL) {
        return res.status(400).send('URL do vídeo é obrigatória');
    }

    try {
        // 1. Configura o nome do arquivo para o iPhone reconhecer
        res.header('Content-Disposition', 'attachment; filename="video_cntube.mp4"');
        res.header('Content-Type', 'video/mp4');

        // 2. O PIPE: Faz a ponte direta entre YouTube -> Render -> Seu Celular
        // Sem salvar nada no disco do Render (evita o download falso de 0kb)
        ytdl(videoURL, {
            quality: 'highestvideo',
            filter: 'audioandvideo'
        }).pipe(res);

    } catch (error) {
        console.error('Erro ao processar:', error);
        res.status(500).send('Erro no servidor do Render.');
    }
});

// O Render define a porta automaticamente, por isso usamos process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
