FROM node:18-bullseye

# Instala o Python e o conversor de vídeo (ffmpeg)
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg

# Instala o motor de download do YouTube
RUN pip3 install yt-dlp

# Prepara a pasta do projeto
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Abre a porta para o site funcionar
EXPOSE 3000
CMD ["node", "server.js"]
