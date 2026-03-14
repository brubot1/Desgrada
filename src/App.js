import React, { useState, useRef } from 'react';
import { Download, Zap, AlertCircle } from 'lucide-react';

export default function VideoDegrader() {
  const [video, setVideo] = useState(null);
  const [quality, setQuality] = useState(5);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const degradationModes = {
    1: { name: '🥔 POTATO', color: '#d4743e', desc: '34 KB Master' },
    2: { name: '🔊 CRISPY', color: '#ff6b6b', desc: 'Ear destroyer' },
    3: { name: '🌊 UNDERWATER', color: '#0066ff', desc: 'Aquarium vibes' },
    4: { name: '📼 VHS', color: '#8b0000', desc: '2000s nostalgia' },
    5: { name: '⚡ CURSED', color: '#ff00ff', desc: 'Digital chaos' },
    6: { name: '🤖 AI BARF', color: '#00ff00', desc: 'Matrix glitch' },
    7: { name: '👾 EXTREME', color: '#ffff00', desc: 'Seizure warning' },
    8: { name: '🎆 APOCALYPSE', color: '#ff69b4', desc: '8K meme' }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setVideo(event.target.result);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const degradeVideo = async () => {
    if (!video) return;
    
    setProcessing(true);
    
    // Simular processamento com animação
    await new Promise(resolve => setTimeout(resolve, 2000));

    const video_element = document.createElement('video');
    video_element.src = video;
    
    video_element.onloadedmetadata = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Definir dimensões baseado na qualidade
      const resolutions = {
        1: { w: 160, h: 120 },
        2: { w: 240, h: 180 },
        3: { w: 320, h: 240 },
        4: { w: 426, h: 320 },
        5: { w: 640, h: 480 },
        6: { w: 854, h: 640 },
        7: { w: 1280, h: 720 },
        8: { w: 1920, h: 1440 }
      };
      
      const res = resolutions[quality];
      canvas.width = res.w;
      canvas.height = res.h;
      
      // Pegar frame do meio do vídeo
      video_element.currentTime = video_element.duration / 2;
      
      await new Promise(resolve => {
        video_element.oncanplay = () => {
          ctx.drawImage(video_element, 0, 0, res.w, res.h);
          
          // Aplicar efeitos de degradação
          const imageData = ctx.getImageData(0, 0, res.w, res.h);
          const data = imageData.data;
          
          // Bit depth reduction (maior degradação = menos cores)
          const bitDepth = Math.max(1, 8 - quality);
          const mask = (0xff << bitDepth);
          
          for (let i = 0; i < data.length; i += 4) {
            data[i] = (data[i] & mask);     // R
            data[i + 1] = (data[i + 1] & mask); // G
            data[i + 2] = (data[i + 2] & mask); // B
            
            // Efeito glitch aleatório em qualidades altas
            if (quality >= 6 && Math.random() < 0.02) {
              data[i] = Math.random() * 255;
              data[i + 1] = Math.random() * 255;
              data[i + 2] = Math.random() * 255;
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          // Converter para blob e estimular download
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const size = (blob.size / 1024).toFixed(2);
            setResult({ url, size, mode: degradationModes[quality] });
            setProcessing(false);
            resolve();
          }, 'image/jpeg', 0.05);
        };
      });
    };
  };

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `degraded-video-${quality}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0033 50%, #330011 100%)',
      fontFamily: "'Courier New', monospace"
    }}>
      {/* Animated background glitch effect */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' result=\'noise\' /%3E%3CfeDisplacementMap in=\'SourceGraphic\' in2=\'noise\' scale=\'5\' /3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' fill=\'%23ff00ff\' filter=\'url(%23noise)\' /%3E%3C/svg%3E")',
          animation: 'pulse 3s infinite'
        }} />
      </div>

      <style>{`
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.1; }
        }

        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(10px); }
        }

        .glitch-text {
          animation: glitch 0.3s infinite;
          text-shadow: 
            2px 2px 0 #ff00ff,
            -2px -2px 0 #00ffff,
            -2px 0 0 #ff0000,
            2px 0 0 #00ff00;
        }

        .scanline {
          animation: scanlines 8s linear infinite;
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 0, 255, 0.15),
            rgba(255, 0, 255, 0.15) 1px,
            transparent 1px,
            transparent 2px
          );
          pointer-events: none;
        }

        .quality-slider {
          width: 100%;
          height: 8px;
          border-radius: 5px;
          background: linear-gradient(90deg, #d4743e, #ff6b6b, #0066ff, #8b0000, #ff00ff, #00ff00, #ffff00, #ff69b4);
          outline: none;
          -webkit-appearance: none;
        }

        .quality-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
          border: 2px solid #ff00ff;
        }

        .quality-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
          border: 2px solid #ff00ff;
        }

        .btn-degrade {
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }

        .btn-degrade:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 0 20px currentColor;
        }

        .btn-degrade:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .preview-frame {
          border: 3px solid;
          box-shadow: 0 0 30px;
          animation: glitch 0.2s infinite;
        }
      `}</style>

      <div className="scanline" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="glitch-text text-5xl font-black mb-2" style={{ color: '#ff00ff' }}>
              VIDEO DEGRADER
            </h1>
            <p className="text-lg" style={{ color: '#00ffff' }}>
              Transform your videos into beautiful garbage 🎬💔
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <Zap size={24} color="#ffff00" />
              <AlertCircle size={24} color="#ff0000" />
              <Zap size={24} color="#ffff00" />
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-black/50 border-2 border-cyan-500 rounded-lg p-8 mb-8 backdrop-blur">
            <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-magenta-500 rounded-lg p-8 hover:bg-magenta-500/10 transition">
              <Zap size={40} color="#ff00ff" className="mb-3" />
              <span style={{ color: '#ff00ff' }} className="font-bold text-lg">
                UPLOAD YOUR VIDEO
              </span>
              <span style={{ color: '#00ffff' }} className="text-sm mt-1">
                (Any format. Goodbye quality.)
              </span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>
            {video && (
              <p style={{ color: '#00ff00' }} className="mt-4 text-center font-bold">
                ✓ VIDEO LOADED
              </p>
            )}
          </div>

          {/* Quality Control */}
          {video && (
            <div className="bg-black/50 border-2 border-cyan-500 rounded-lg p-8 mb-8 backdrop-blur">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label style={{ color: '#ffff00' }} className="font-bold">
                    DEGRADATION LEVEL
                  </label>
                  <span style={{ color: degradationModes[quality].color }} className="text-lg font-bold">
                    {degradationModes[quality].name}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="quality-slider mb-2"
                  disabled={processing}
                />
                <p style={{ color: degradationModes[quality].color }} className="text-center text-sm italic">
                  {degradationModes[quality].desc}
                </p>
              </div>

              {/* Mode Info Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-6 opacity-70">
                <div style={{ color: '#00ff00' }}>
                  <strong>Size:</strong> ~{Math.max(34, Math.round(1000 - quality * 80))} KB
                </div>
                <div style={{ color: '#00ffff' }}>
                  <strong>Colors:</strong> {Math.max(2, 256 - quality * 30)} shades
                </div>
                <div style={{ color: '#ff69b4' }}>
                  <strong>Clarity:</strong> {((9 - quality) * 11).toFixed(0)}%
                </div>
                <div style={{ color: '#ffff00' }}>
                  <strong>Glitch:</strong> {(quality * 10).toFixed(0)}%
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={degradeVideo}
                  disabled={processing}
                  className="flex-1 btn-degrade px-6 py-3 rounded-lg font-bold text-black uppercase tracking-wide"
                  style={{
                    background: degradationModes[quality].color,
                    color: 'black'
                  }}
                >
                  {processing ? (
                    <span className="animate-spin inline-block">⚡</span>
                  ) : (
                    <>
                      <Zap className="inline mr-2" size={18} />
                      DEGRADE NOW
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="bg-black/50 border-2 rounded-lg p-8 backdrop-blur" style={{ borderColor: result.mode.color }}>
              <div className="text-center mb-6">
                <h2 style={{ color: result.mode.color }} className="text-2xl font-bold glitch-text">
                  {result.mode.name} SUCCESS!
                </h2>
                <p style={{ color: '#00ffff' }} className="text-sm mt-2">
                  Size: <strong>{result.size} KB</strong>
                </p>
              </div>

              <button
                onClick={downloadResult}
                className="w-full btn-degrade px-6 py-3 rounded-lg font-bold uppercase tracking-wide flex items-center justify-center gap-2"
                style={{
                  background: result.mode.color,
                  color: 'black'
                }}
              >
                <Download size={20} />
                DOWNLOAD GARBAGE
              </button>

              <p style={{ color: '#ff69b4' }} className="text-center text-xs mt-4 italic">
                "It's not a bug, it's a feature" - Someone, probably
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-12">
            <p style={{ color: '#666' }} className="text-xs">
              Destroy your videos responsibly™ | Made with chaos and poor decisions
            </p>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}