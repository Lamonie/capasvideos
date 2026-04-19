const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const https = require('https');   // ← nativo do Node, zero custo

const app = express();

app.use(cors());

app.get('/download', async (req, res) => {
    const videoURL = req.query.url;
    if (!videoURL) return res.status(400).send('URL necessária');

    try {
        const info = await ytdl.getInfo(videoURL);

        // Escolhe o melhor formato com áudio + vídeo
        let format = ytdl.chooseFormat(info.formats, {
            quality: 'highestvideo',
            filter: 'audioandvideo'
        });

        // Fallback seguro
        if (!format) {
            format = ytdl.chooseFormat(info.formats, { filter: 'audioandvideo' });
        }
        if (!format) {
            return res.status(500).send('Formato de vídeo não encontrado');
        }

        // Nome amigável do arquivo (com título do vídeo)
        const safeTitle = info.videoDetails.title
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .substring(0, 100);
        const filename = `${safeTitle}.mp4`;

        const range = req.headers.range;

        let start = 0;
        let end = format.contentLength ? parseInt(format.contentLength) - 1 : Infinity;
        let contentLength = format.contentLength ? parseInt(format.contentLength) : null;

        let statusCode = 200;
        const headers = {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Accept-Ranges': 'bytes',
            'Connection': 'keep-alive'
        };

        // === SUPORTE A RANGE REQUESTS (OBRIGATÓRIO PARA SAFARI) ===
        if (range) {
            const rangeParts = range.replace(/bytes=/, '').split('-');
            start = parseInt(rangeParts[0], 10) || 0;
            end = rangeParts[1] ? parseInt(rangeParts[1], 10) : end;
            if (end > contentLength - 1) end = contentLength - 1;

            statusCode = 206;
            contentLength = end - start + 1;

            headers['Content-Range'] = `bytes ${start}-${end}/${format.contentLength}`;
            headers['Content-Length'] = contentLength;
        } else if (contentLength) {
            headers['Content-Length'] = contentLength;
        }

        res.writeHead(statusCode, headers);

        // === PROXY STREAMING PARA O YOUTUBE (mínimo de RAM) ===
        const proxyHeaders = range ? { Range: range } : {};

        https.get(format.url, { headers: proxyHeaders }, (proxyRes) => {
            proxyRes.pipe(res);
        }).on('error', (err) => {
            console.error('Proxy error:', err);
            if (!res.headersSent) res.status(500).send('Erro no streaming');
        });

    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            res.status(500).send('Erro ao processar download');
        }
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`✅ CnTube Backend rodando na porta ${process.env.PORT || 3000}`);
});