
import React, { useState, useEffect } from 'react';
import { CameraState, GenerationStatus } from './types';
import CameraVisualizer from './components/CameraVisualizer';
import SliderControl from './components/SliderControl';
import { generateImage, generatePromptFromState } from './services/geminiService';

const DEFAULT_STATE: CameraState = {
  azimuth: 22,
  elevation: 16,
  distance: 1.0,
};

const API_KEY_STORAGE_KEY = 'gemini_api_key_override';

const App: React.FC = () => {
  const [cameraState, setCameraState] = useState<CameraState>(DEFAULT_STATE);
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '');

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    }
  }, [apiKey]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImage(reader.result as string);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!inputImage) {
      setErrorMsg("Please upload an input image.");
      return;
    }

    setStatus(GenerationStatus.LOADING);
    setErrorMsg(null);

    try {
      const result = await generateImage(inputImage, cameraState, apiKey);
      setGeneratedImage(result);
      setStatus(GenerationStatus.SUCCESS);
    } catch (err: any) {
      console.error("Generate Error:", err);
      setErrorMsg(err.message || "Generation failed.");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const promptPreview = generatePromptFromState(cameraState);

  return (
    <div className="min-h-screen bg-white text-[#1F2937] px-8 py-6">
      <div className="max-w-[1400px] mx-auto">
        
        <h1 className="text-6xl font-black tracking-tight mb-8 leading-[1.1]">
          The Easiest Way To Control<br />Camera Views
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Input Source Section */}
            <div className="flex justify-between items-start gap-10">
              <div className="flex-grow space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Input Source</h2>
                  <p className="text-xs text-gray-400">Upload a character or object.</p>
                </div>

                {/* API Key Input Section */}
                <div className="space-y-2 max-w-sm">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Gemini API Key</label>
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key here..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                  />
                  <p className="text-[10px] text-gray-400 font-medium">Your key is used locally and never stored.</p>
                </div>
              </div>

              {/* Upload Box */}
              <div className="shrink-0 pt-2">
                <input type="file" id="upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                <label 
                  htmlFor="upload" 
                  className={`w-48 h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all gap-2 relative overflow-hidden group/upload
                    ${inputImage ? 'border-blue-400 bg-blue-50/10' : 'border-gray-200 hover:border-blue-300 bg-white shadow-soft'}`}
                >
                  {inputImage ? (
                    <>
                      <img src={inputImage} className="w-full h-full object-contain p-2" alt="Uploaded" />
                      <div className="absolute inset-0 bg-white/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                         <span className="text-[10px] font-bold text-blue-600 bg-white px-3 py-1 rounded-full shadow-md">Click to change</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="text-gray-300 text-3xl font-light mb-1">+</div>
                      <span className="text-[10px] font-bold text-gray-500">Upload</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Camera Control Visualizer */}
            <div className="relative">
              <CameraVisualizer state={cameraState} onChange={setCameraState} inputImage={inputImage} />
            </div>

            {/* Parameters Section */}
            <div className="space-y-4 pt-2">
              <div>
                <h3 className="text-xl font-bold">Parameters</h3>
                <p className="text-[10px] text-gray-400 font-medium">Fine-tune the camera angle.</p>
              </div>
              
              <div className="grid grid-cols-3 gap-8">
                <SliderControl label="Azimuth" value={cameraState.azimuth} min={0} max={360} unit="°" onChange={(val) => setCameraState(prev => ({...prev, azimuth: val}))} onReset={() => setCameraState(prev => ({...prev, azimuth: DEFAULT_STATE.azimuth}))} />
                <SliderControl label="Elevation" value={cameraState.elevation} min={-30} max={60} unit="°" onChange={(val) => setCameraState(prev => ({...prev, elevation: val}))} onReset={() => setCameraState(prev => ({...prev, elevation: DEFAULT_STATE.elevation}))} />
                <SliderControl label="Distance" value={cameraState.distance} min={0.6} max={1.4} step={0.1} unit="x" onChange={(val) => setCameraState(prev => ({...prev, distance: val}))} onReset={() => setCameraState(prev => ({...prev, distance: DEFAULT_STATE.distance}))} />
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
               <button
                  onClick={handleGenerate}
                  disabled={status === GenerationStatus.LOADING || !inputImage}
                  className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-md
                    ${status === GenerationStatus.LOADING || !inputImage
                        ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-900 hover:shadow-xl active:scale-[0.98]'
                    }`}
               >
                  {status === GenerationStatus.LOADING ? 'Generating...' : 'Generate New View'}
               </button>
               {errorMsg && <p className="mt-3 text-xs text-red-500 text-center font-bold bg-red-50 py-3 rounded-xl border border-red-100">{errorMsg}</p>}
            </div>

          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 flex flex-col pt-2">
            <div className="space-y-1 mb-4">
              <h2 className="text-2xl font-bold">Generated Result</h2>
              <p className="text-xs text-gray-400">High-fidelity output based on your camera angle.</p>
            </div>

            {/* Prompt Preview Area */}
            <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-4 mb-5 text-[10px] font-mono text-gray-500 flex gap-4 items-center shadow-sm">
              <span className="text-blue-600 font-black uppercase tracking-widest whitespace-nowrap bg-blue-50 px-2 py-1 rounded">Prompt</span>
              <span className="truncate opacity-80 italic">{promptPreview}</span>
            </div>

            {/* Main Result Area */}
            <div className="flex-grow min-h-[580px] border border-gray-100 rounded-[3rem] bg-white flex flex-col items-center justify-center relative overflow-hidden shadow-soft group">
               {status === GenerationStatus.LOADING ? (
                 <div className="flex flex-col items-center gap-6">
                    <div className="w-14 h-14 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Rendering...</p>
                 </div>
               ) : generatedImage ? (
                 <div className="w-full h-full p-6 animate-in fade-in zoom-in duration-700 flex flex-col items-center justify-center">
                    <img 
                      src={generatedImage} 
                      className="w-full h-full object-contain cursor-zoom-in transition-transform duration-500 hover:scale-[1.02]" 
                      alt="Generated" 
                      onClick={() => setIsPreviewOpen(true)}
                    />
                    
                    <div className="absolute bottom-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <button 
                        onClick={() => setIsPreviewOpen(true)}
                        className="bg-white/95 backdrop-blur text-black border border-gray-200 px-6 py-3 rounded-2xl text-[10px] font-bold shadow-xl hover:bg-white transition-all"
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = generatedImage;
                          link.download = 'camera-view.png';
                          link.click();
                        }}
                        className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-bold shadow-xl hover:bg-gray-800 transition-all"
                      >
                        Download PNG
                      </button>
                    </div>
                 </div>
               ) : (
                 <div className="text-center p-12">
                    <div className="text-6xl mb-8 opacity-20 filter grayscale">✨</div>
                    <p className="text-[10px] font-black text-gray-300 tracking-[0.4em] uppercase leading-loose">
                      Select camera parameters<br />to start rendering
                    </p>
                 </div>
               )}
            </div>
          </div>

        </div>
      </div>

      {/* Fullscreen Image Preview Modal */}
      {isPreviewOpen && generatedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-8 animate-in fade-in duration-300 cursor-zoom-out"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            <img 
              src={generatedImage} 
              className="max-w-full max-h-[85vh] object-contain rounded-[2rem] shadow-2xl border border-white/5" 
              alt="Full Preview"
            />
            <div className="absolute top-6 right-6 text-white text-[10px] font-bold bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/20 uppercase tracking-widest">
              Close Preview
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
