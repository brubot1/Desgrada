const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

// Carregar stats
let stats = { visitas: 0, videosProcessados: 0, bytesProcessados: 0 };

if (fs.existsSync('stats.json')) {
  stats = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
}

// Salvar stats
const saveStats = () => {
  fs.writeFileSync('stats.json', JSON.stringify(stats, null, 2));
};
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 500 * 1024 * 1024 }
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  if (req.session.autenticado) {
    stats.visitas++;
    saveStats();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
app.post('/degrade', upload.single('video'), (req, res) => {
  console.log('📹 Recebido video:', req.file.filename);
  
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const quality = parseInt(req.body.quality) || 5;
  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `degraded-${Date.now()}.mp4`);

  // MEGA DEGRADAÇÃO
  const configs = {
    1: { 
      w: 80, h: 60, 
      scale: 'scale=80:60:flags=neighbor',
      bitrate: '16k', 
      fps: 3,
      filters: 'scale=80:60:flags=neighbor,eq=brightness=0.1:saturation=2,format=yuv420p'
    },
    2: { 
      w: 120, h: 90, 
      scale: 'scale=120:90:flags=neighbor',
      bitrate: '32k', 
      fps: 4,
      filters: 'scale=120:90:flags=neighbor,eq=saturation=3,format=yuv420p'
    },
    3: { 
      w: 160, h: 120, 
      bitrate: '48k', 
      fps: 5,
      filters: 'scale=160:120:flags=neighbor,eq=saturation=2.5,format=yuv420p'
    },
    4: { 
      w: 240, h: 180, 
      bitrate: '64k', 
      fps: 8,
      filters: 'scale=240:180:flags=neighbor,eq=saturation=2,format=yuv420p'
    },
    5: { 
      w: 320, h: 240, 
      bitrate: '96k', 
      fps: 10,
      filters: 'scale=320:240:flags=neighbor,eq=saturation=1.5,format=yuv420p'
    },
    6: { 
      w: 426, h: 320, 
      bitrate: '128k', 
      fps: 15,
      filters: 'scale=426:320:flags=neighbor,format=yuv420p'
    },
    7: { 
      w: 640, h: 480, 
      bitrate: '256k', 
      fps: 20,
      filters: 'scale=640:480:flags=neighbor,format=yuv420p'
    },
    8: { 
      w: 854, h: 640, 
      bitrate: '512k', 
      fps: 24,
      filters: 'scale=854:640:flags=neighbor,format=yuv420p'
    }
  };

  const config = configs[quality] || configs[5];

  console.log(`⚙️  Degradando extremamente com qualidade ${quality}...`);

  // FFmpeg com MÁXIMA degradação
  const ffmpeg = spawn('ffmpeg', [
    '-i', inputPath,
    '-vf', config.filters,
    '-b:v', config.bitrate,
    '-r', config.fps.toString(),
    '-crf', '51', // MÁXIMA COMPRESSÃO
    '-preset', 'ultrafast',
    '-an', // sem áudio
    '-pix_fmt', 'yuv420p',
    '-y',
    outputPath
  ]);

  let errorOutput = '';

  ffmpeg.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  ffmpeg.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Erro FFmpeg:', errorOutput);
      res.status(500).json({ error: 'Erro ao processar: ' + errorOutput.slice(0, 100) });
      fs.unlink(inputPath, () => {});
      return;
    }

    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
stats.videosProcessados++;
stats.bytesProcessados += stats.size;
saveStats();

    console.log(`✅ Vídeo DESTRUÍDO! Tamanho: ${sizeKB} KB`);
    res.json({ 
      success: true, 
      file: path.basename(outputPath),
      size: sizeKB
    });
    
    fs.unlink(inputPath, () => {});
  });

  ffmpeg.on('error', (err) => {
    console.error('❌ Erro FFmpeg:', err.message);
    res.status(500).json({ error: 'FFmpeg error: ' + err.message });
  });
});

app.get('/download/:file', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.file);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }

  res.download(filePath, () => {
    console.log('📥 Downloaded:', req.params.file);
    fs.unlink(filePath, () => {});
  });
});
// Rota de stats (SEM autenticação, pra mostrar no site)
app.get('/stats', (req, res) => {
  res.json({
    visitas: stats.visitas,
    videosProcessados: stats.videosProcessados,
    megabytesProcessados: (stats.bytesProcessados / (1024 * 1024)).toFixed(2)
  });
});
app.listen(PORT, () => {
  console.log(`\n✅ VIDEO MEME DESTROYER ATIVO!\n`);
  console.log(`📱 http://localhost:3000\n`);
});
