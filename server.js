const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const https = require('https');
const path = require('path'); // Necessário para carregar o index.html

const app = express();

app.use(cors());

// --- ADICIONE ISSO PARA O SITE APARECER ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para buscar informações do vídeo
app.get('/info', async (req, res) => {
    const videoURL = req.query.url;
    if (!videoURL) return res.status(400).send({ error: 'URL necessária' });

    try {
        const info = await ytdl.getInfo(videoURL);
        res.json({
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url
        });
    } catch (err) {
        res.status(500).send({ error: 'Erro ao buscar informações' });
    }
});

app.get('/download', async (req, res) => {
    const videoURL = req.query.url;
    if (!videoURL) return res.status(400).send('URL necessária');

    try {
        const info = await ytdl.getInfo(videoURL);
        let format = ytdl.chooseFormat(info.formats, {
            quality: 'highestvideo',
            filter: 'audioandvideo'
        });

        if (!format) format = ytdl.chooseFormat(info.formats, { filter: 'audioandvideo' });
        
        const safeTitle = info.videoDetails.title.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
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

        if (range) {
            const rangeParts = range.replace(/bytes=/, '').split('-');
            start = parseInt(rangeParts[0], 10) || 0;
            end = rangeParts[1] ? parseInt(rangeParts[1], 10) : (format.contentLength ? parseInt(format.contentLength) - 1 : end);
            
            statusCode = 206;
            contentLength = end - start + 1;
            headers['Content-Range'] = `bytes ${start}-${end}/${format.contentLength || '*'}`;
            headers['Content-Length'] = contentLength;
        } else if (contentLength) {
            headers['Content-Length'] = contentLength;
        }

        res.writeHead(statusCode, headers);

        const proxyHeaders = range ? { Range: range } : {};
        https.get(format.url, { headers: proxyHeaders }, (proxyRes) => {
            proxyRes.pipe(res);
        }).on('error', (err) => {
            console.error('Proxy error:', err);
            if (!res.headersSent) res.status(500).send('Erro no streaming');
        });

    } catch (err) {
        console.error(err);
        if (!res.headersSent) res.status(500).send('Erro ao processar download');
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`✅ Servidor rodando na porta ${process.env.PORT || 3000}`);
});
