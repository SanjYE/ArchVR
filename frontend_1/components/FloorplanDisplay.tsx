import React, { useState } from 'react';
import type { Floorplan } from '../types';
import { ModelViewer3D } from './ModelViewer3D';

interface FloorplanDisplayProps {
  floorplan: Floorplan | null;
  isLoading: boolean;
  error: string | null;
}

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
);

const CubeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const Spinner: React.FC = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
  </div>
);

const API_BASE_URL = 'http://localhost:3001';

export const FloorplanDisplay: React.FC<FloorplanDisplayProps> = ({ floorplan, isLoading, error }) => {
  const [is3DGenerating, setIs3DGenerating] = useState(false);
  const [generate3DError, setGenerate3DError] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  const handleGenerate3D = async () => {
    if (!floorplan) return;

    setIs3DGenerating(true);
    setGenerate3DError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-3d`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: floorplan.imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate 3D model');
      }

      const data = await response.json();
      setModelUrl(`${API_BASE_URL}${data.modelUrl}`);
      setShowViewer(true);
    } catch (err) {
      console.error('3D generation error:', err);
      setGenerate3DError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIs3DGenerating(false);
    }
  };

  return (
    <>
      <div className="bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center p-4 md:p-8 aspect-square relative overflow-hidden shadow-inner-lg">
        {isLoading && <Spinner />}
        
        {!isLoading && error && (
          <div className="text-center text-red-400">
            <p className="font-semibold">Generation Failed</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!isLoading && !error && !floorplan && (
          <div className="text-center text-slate-500 flex flex-col items-center gap-4">
            <ImageIcon className="w-16 h-16"/>
            <h2 className="text-xl font-bold text-slate-300">AI Architect</h2>
            <p>Describe your ideal floorplan to begin.</p>
          </div>
        )}

        {!isLoading && floorplan && (
          <>
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={handleGenerate3D}
                disabled={is3DGenerating}
                className="bg-purple-600/80 text-white hover:bg-purple-500 p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-600 disabled:cursor-not-allowed"
                aria-label="Generate 3D model"
                title="Generate 3D Model"
              >
                {is3DGenerating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <CubeIcon className="w-5 h-5" />
                )}
              </button>
              <a
                href={floorplan.imageUrl}
                download={`floorplan-${floorplan.id}.png`}
                className="bg-slate-700/80 text-slate-200 hover:bg-cyan-500 hover:text-white p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                aria-label="Download floorplan"
              >
                <DownloadIcon className="w-5 h-5" />
              </a>
            </div>

            {generate3DError && (
              <div className="absolute top-20 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm max-w-xs">
                {generate3DError}
              </div>
            )}

            <div className="w-full h-full flex items-center justify-center">
              <img
                key={floorplan.id}
                src={floorplan.imageUrl}
                alt={floorplan.prompt}
                className="max-w-full max-h-full object-contain rounded-lg animate-fade-in"
              />
            </div>
            <style>{`
              @keyframes fade-in {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
              .animate-fade-in {
                animation: fade-in 0.5s ease-out forwards;
              }
            `}</style>
          </>
        )}
      </div>

      {showViewer && modelUrl && (
        <ModelViewer3D 
          modelUrl={modelUrl} 
          onClose={() => setShowViewer(false)} 
        />
      )}
    </>
  );
};