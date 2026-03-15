const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { spawn } = require('child_process');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const SENHA = '1234'; // ← MUDE AQUI

// ============================================
// CONFIGURAÇÃO INICIAL
// ============================================

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Carregar ou criar stats
let stats = { visitas: 0, videosProcessados: 0, bytesProcessados: 0 };
if (fs.existsSync('stats.json')) {
  try {
    stats = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
  } catch (e) {
    console.error('Erro ao carregar stats, usando padrão');
  }
}

const saveStats = () => {
  fs.writeFileSync('stats.json', JSON.stringify(stats, null, 2));
};

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas vídeos são permitidos'));
    }
  }
});

// ============================================
// MIDDLEWARE
// ============================================

app.use(session({
  secret: 'video-degrader-secret-2024',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    secure: false,
    httpOnly: true
  }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Middleware de autenticação
const checkAuth = (req, res, next) => {
  if (req.session.autenticado) {
    return next();
  }
  res.status(401).sendFile(path.join(__dirname, 'public', 'login.html'));
};

// ============================================
// ROTAS
// ============================================

// Login
app.post('/login', (req, res) => {
  const senha = req.body.senha;

  if (senha === SENHA) {
    req.session.autenticado = true;
    console.log('✅ Usuário logado');
    res.redirect('/');
  } else {
    console.log('❌ Tentativa de login com senha incorreta');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Erro de Login</title>
        <style>
          body {
            background: linear-gradient(135deg, #0f0f1e 0%, #1a0033 50%, #330011 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: monospace;
            color: #fff;
          }
          .error-box {
            background: rgba(0,0,0,0.7);
            border: 2px solid #ff0000;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
            max-width: 400px;
          }
          .error-box h1 { color: #ff0000; margin-bottom: 20px; }
          .error-box p { color: #888; margin-bottom: 30px; }
          .error-box a {
            display: inline-block;
            padding: 10px 20px;
            background: #ff00ff;
            color: black;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .error-box a:hover {
            box-shadow: 0 0 20px #ff00ff;
          }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>❌ Senha Incorreta</h1>
          <p>A senha que você digitou está errada.</p>
          <a href="/">← Tentar Novamente</a>
        </div>
      </body>
      </html>
    `);
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.autenticado = false;
  console.log('🔓 Usuário deslogado');
  res.redirect('/');
});

// Página principal
app.get('/', (req, res) => {
  if (req.session.autenticado) {
    stats.visitas++;
    saveStats();
    console.log(`📊 Visita #${stats.visitas}`);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

// Upload e processamento de vídeo
app.post('/degrade', checkAuth, upload.single('video'), (req, res) => {
  console.log('\n' + '='.repeat(50));
  console.log('📹 NOVO VÍDEO RECEBIDO');
  console.log('='.repeat(50));

  if (!req.file) {
    console.error('❌ Nenhum arquivo enviado');
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const quality = parseInt(req.body.quality) || 5;
  const inputPath = req.file.path;
  const fileName = req.file.originalname;
  const outputPath = path.join('uploads', `degraded-${Date.now()}.mp4`);

  console.log(`📄 Arquivo: ${fileName}`);
  console.log(`⚙️  Qualidade: ${quality}`);
  console.log(`📁 Input: ${inputPath}`);
  console.log(`📁 Output: ${outputPath}`);

  // Configurações por qualidade
  const configs = {
    1: {
      filters: 'scale=80:60:flags=neighbor,eq=brightness=0.1:saturation=2,format=yuv420p',
      bitrate: '16k',
      fps: 3,
      name: '🥔 POTATO'
    },
    2: {
      filters: 'scale=120:90:flags=neighbor,eq=saturation=3,format=yuv420p',
      bitrate: '32k',
      fps: 4,
      name: '🔊 CRISPY'
    },
    3: {
      filters: 'scale=160:120:flags=neighbor,eq=saturation=2.5,format=yuv420p',
      bitrate: '48k',
      fps: 5,
      name: '🌊 UNDERWATER'
    },
    4: {
      filters: 'scale=240:180:flags=neighbor,eq=saturation=2,format=yuv420p',
      bitrate: '64k',
      fps: 8,
      name: '📼 VHS'
    },
    5: {
      filters: 'scale=320:240:flags=neighbor,eq=saturation=1.5,format=yuv420p',
      bitrate: '96k',
      fps: 10,
      name: '⚡ CURSED'
    },
    6: {
      filters: 'scale=426:320:flags=neighbor,format=yuv420p',
      bitrate: '128k',
      fps: 15,
      name: '🤖 AI BARF'
    },
    7: {
      filters: 'scale=640:480:flags=neighbor,format=yuv420p',
      bitrate: '256k',
      fps: 20,
      name: '👾 EXTREME'
    },
    8: {
      filters: 'scale=854:640:flags=neighbor,format=yuv420p',
      bitrate: '512k',
      fps: 24,
      name: '🎆 APOCALYPSE'
    }
  };

  const config = configs[quality] || configs[5];

  console.log(`🎬 Modo: ${config.name}`);
  console.log('⏳ Iniciando processamento FFmpeg...\n');

  // Executar FFmpeg
  const ffmpeg = spawn('ffmpeg', [
    '-i', inputPath,
    '-vf', config.filters,
    '-b:v', config.bitrate,
    '-r', config.fps.toString(),
    '-crf', '51',
    '-preset', 'ultrafast',
    '-an',
    '-pix_fmt', 'yuv420p',
    '-y',
    outputPath
  ]);

  let errorOutput = '';
  let progress = 0;

  ffmpeg.stderr.on('data', (data) => {
    const output = data.toString();
    errorOutput += output;

    // Mostrar progresso
    if (output.includes('frame=')) {
      const match = output.match(/frame=\s*(\d+)/);
      if (match) {
        progress = match[1];
        process.stdout.write(`\r⏳ Processando... Frame: ${progress}`);
      }
    }
  });

  ffmpeg.on('close', (code) => {
    console.log('\n');

    if (code !== 0) {
      console.error('❌ FFmpeg retornou erro:', code);
      console.error('Detalhes:', errorOutput.slice(0, 200));
      res.status(500).json({ error: 'Erro ao processar vídeo' });
      fs.unlink(inputPath, () => {});
      return;
    }

    // Sucesso!
    const stats_file = fs.statSync(outputPath);
    const sizeBytes = stats_file.size;
    const sizeKB = (sizeBytes / 1024).toFixed(2);
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

    // Atualizar estatísticas
    stats.videosProcessados++;
    stats.bytesProcessados += sizeBytes;
    saveStats();

    console.log(`✅ SUCESSO!`);
    console.log(`💾 Tamanho final: ${sizeKB} KB (${sizeMB} MB)`);
    console.log(`📊 Total processado: ${(stats.bytesProcessados / (1024 * 1024)).toFixed(2)} MB`);
    console.log('='.repeat(50) + '\n');

    res.json({
      success: true,
      file: path.basename(outputPath),
      size: sizeKB
    });

    // Deletar arquivo original
    fs.unlink(inputPath, (err) => {
      if (err) console.error('Erro ao deletar arquivo original:', err);
    });
  });

  ffmpeg.on('error', (err) => {
    console.error('❌ Erro ao iniciar FFmpeg:', err.message);
    res.status(500).json({ error: 'FFmpeg não encontrado ou erro: ' + err.message });
    fs.unlink(inputPath, () => {});
  });
});

// Download
app.get('/download/:file', checkAuth, (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.file);

  if (!fs.existsSync(filePath)) {
    console.error('❌ Arquivo não encontrado:', req.params.file);
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }

  console.log(`📥 Download: ${req.params.file}`);

  res.download(filePath, () => {
    fs.unlink(filePath, (err) => {
      if (err) console.error('Erro ao deletar arquivo:', err);
    });
  });
});

// API de estatísticas (sem autenticação, pra mostrar no HTML)
app.get('/stats', (req, res) => {
  res.json({
    visitas: stats.visitas,
    videosProcessados: stats.videosProcessados,
    megabytesProcessados: (stats.bytesProcessados / (1024 * 1024)).toFixed(2)
  });
});

// ============================================
// LIMPEZA PERIÓDICA
// ============================================

// Deletar arquivos antigos a cada 1 hora
setInterval(() => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const maxAge = 1000 * 60 * 60; // 1 hora

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Erro ao limpar pasta:', err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      const age = Date.now() - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlink(filePath, (err) => {
          if (!err) {
            console.log(`🧹 Arquivo deletado (expirado): ${file}`);
          }
        });
      }
    });
  });
}, 1000 * 60 * 60); // A cada 1 hora

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 VIDEO DEGRADER INICIADO`);
  console.log(`${'='.repeat(50)}`);
  console.log(`\n📱 URL: http://localhost:${PORT}`);
  console.log(`🔑 Senha: ${SENHA}`);
  console.log(`💾 Uploads: ./uploads`);
  console.log(`📊 Stats: ${stats.visitas} visitas, ${stats.videosProcessados} vídeos\n`);
  console.log(`${'='.repeat(50)}\n`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erro não tratado:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
});
