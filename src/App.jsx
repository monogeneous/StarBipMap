import React, { useState, useMemo, useCallback } from 'react';
import StarMap from './components/StarMap';
import InputSection from './components/InputSection';
import { processMnemonic, generateMnemonic } from './utils/bip39';
import { toPng } from 'html-to-image';

function App() {
  const [mnemonic, setMnemonic] = useState('');
  const [settings, setSettings] = useState({
    showGrid: true,
    rotation: 0,
    zoom: 1,
    starColor: '#67e8f9',
    starSize: 3,
    gridMode: 'simple', // 'simple' or 'full'
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerate = useCallback((length) => {
    const newMnemonic = generateMnemonic(length);
    setMnemonic(newMnemonic);
  }, []);

  const processedData = useMemo(() => {
    const words = mnemonic.trim().split(/\s+/).filter(Boolean);
    return processMnemonic(words);
  }, [mnemonic]);

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const handleWheel = useCallback((e) => {
    const delta = e.deltaY * -0.001;
    setSettings(prev => {
      const newZoom = Math.max(0.5, Math.min(3, (prev.zoom || 1) + delta));
      return { ...prev, zoom: newZoom };
    });
  }, []);

  const handleDownload = useCallback(async () => {
    const node = document.getElementById('star-map-export-container');
    if (!node) return;

    setIsExporting(true);
    const originalZoom = settings.zoom;
    updateSettings({ zoom: 1 });

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const width = node.offsetWidth;
      const targetSize = 2024;
      const scale = targetSize / width;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: scale,
        backgroundColor: '#0b0d17',
        style: {
          transform: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
        }
      });

      const link = document.createElement('a');
      link.download = `bip39-starmap-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      updateSettings({ zoom: originalZoom });
      setIsExporting(false);
    }
  }, [settings.zoom, updateSettings]);

  return (
    <div className="min-h-screen bg-[#050510] text-white overflow-x-hidden selection:bg-cyan-500/30 font-sans relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1c2035_0%,_#0b0d17_50%,_#020205_100%)]"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">

        {/* Top Branding (Logo) */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <h1 className="text-xl font-black tracking-widest uppercase whitespace-nowrap drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-baseline">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Star</span>
            <span className="text-white/50 font-medium lowercase tracking-normal text-sm px-1.5 relative -top-0.5">(bip)</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">Map</span>
          </h1>
        </div>

        <div className="relative w-full h-[calc(100vh-100px)] flex flex-col items-center justify-center overflow-hidden animate-fade-in">
          {/* CENTER STAGE: The Map */}
          <div
            className="relative w-[75vh] sm:w-[80vh] aspect-square max-w-[90vw] flex items-center justify-center transition-all duration-300 -translate-y-16 sm:-translate-y-12 lg:-translate-y-16"
            onWheel={handleWheel}
          >
            {isExporting && <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center rounded-2xl backdrop-blur-sm">Processing...</div>}
            <StarMap data={processedData.data} settings={settings} isExporting={isExporting} />
          </div>

          {/* HUD CONTROLS CONTAINER: Aligned with Dock */}
          <div className="absolute bottom-6 w-[95%] max-w-5xl flex flex-col gap-3 pointer-events-none">

            {/* Top Row: 3 Floating Panels (Grid, Rotation, Save) */}
            <div className="flex flex-row justify-between items-stretch w-full gap-2 px-1">

              {/* 1. Grid Panel (Left) */}
              <div className="flex-1 max-w-[140px] sm:max-w-[180px] p-2 sm:p-3 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col justify-center pointer-events-auto animate-slide-in-left">
                <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => updateSettings({ showGrid: false })}
                    className={`flex-1 py-1 text-[9px] sm:text-[10px] rounded transition-all ${!settings.showGrid ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >Off</button>
                  <button
                    onClick={() => updateSettings({ showGrid: true, gridMode: 'simple' })}
                    className={`flex-1 py-1 text-[9px] sm:text-[10px] rounded transition-all ${settings.showGrid && settings.gridMode === 'simple' ? 'bg-cyan-600/50 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >Simple</button>
                  <button
                    onClick={() => updateSettings({ showGrid: true, gridMode: 'full' })}
                    className={`flex-1 py-1 text-[9px] sm:text-[10px] rounded transition-all ${settings.showGrid && settings.gridMode === 'full' ? 'bg-cyan-600/50 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >Full</button>
                </div>
              </div>

              {/* 2. Rotation Panel (Center) */}
              <div className="flex-1 max-w-[160px] sm:max-w-[200px] p-2 sm:p-3 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col justify-center gap-1 pointer-events-auto animate-fade-in">
                <div className="flex justify-between text-[8px] sm:text-[9px] text-gray-500 uppercase tracking-tighter px-1">
                  <span>Rotation</span>
                  <span>{settings.rotation}°</span>
                </div>
                <input
                  type="range" min="0" max="360" step="30" value={settings.rotation}
                  onChange={(e) => updateSettings({ rotation: parseInt(e.target.value) })}
                  className="w-full h-1 accent-cyan-400 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>

              {/* 3. Save Panel (Right) */}
              <div className="flex-1 max-w-[100px] sm:max-w-[140px] p-2 sm:p-3 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col justify-center pointer-events-auto animate-slide-in-right">
                <button
                  onClick={handleDownload}
                  className="w-full py-1.5 sm:py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold text-[9px] sm:text-[10px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-cyan-900/20"
                >
                  Save
                </button>
              </div>

            </div>

            {/* Bottom Row: Seed Input Dock */}
            <div className="w-full p-3 px-4 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/10 shadow-2xl flex items-center gap-3 pointer-events-auto animate-slide-up">
              <div className="grow">
                <InputSection
                  rawMnemonic={mnemonic}
                  onMnemonicChange={setMnemonic}
                  validationResults={processedData}
                  onGenerate={handleGenerate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
