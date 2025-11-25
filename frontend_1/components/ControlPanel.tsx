import React, { useEffect } from 'react';
import type { Floorplan } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { SparklesIcon, MicrophoneIcon } from './icons.tsx';

interface ControlPanelProps {
  initialPrompt: string;
  setInitialPrompt: (prompt: string) => void;
  handleGenerate: () => void;
  editPrompt: string;
  setEditPrompt: (prompt: string) => void;
  handleEdit: () => void;
  history: Floorplan[];
  setCurrentFloorplan: (floorplan: Floorplan) => void;
  currentFloorplan: Floorplan | null;
  isLoading: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  initialPrompt,
  setInitialPrompt,
  handleGenerate,
  editPrompt,
  setEditPrompt,
  handleEdit,
  history,
  setCurrentFloorplan,
  currentFloorplan,
  isLoading,
}) => {
  const {
    isListening: isListeningInitial,
    transcript: transcriptInitial,
    startListening: startListeningInitial,
    stopListening: stopListeningInitial,
    isSupported: speechRecognitionSupported,
  } = useSpeechRecognition();

  const {
    isListening: isListeningEdit,
    transcript: transcriptEdit,
    startListening: startListeningEdit,
    stopListening: stopListeningEdit,
  } = useSpeechRecognition();


  useEffect(() => {
    if (transcriptInitial) {
      setInitialPrompt(transcriptInitial);
    }
  }, [transcriptInitial, setInitialPrompt]);

  useEffect(() => {
    if (transcriptEdit) {
      setEditPrompt(transcriptEdit);
    }
  }, [transcriptEdit, setEditPrompt]);

  const toggleListenInitial = () => {
    if (isListeningInitial) {
      stopListeningInitial();
    } else {
      startListeningInitial();
    }
  };
  
  const toggleListenEdit = () => {
    if (isListeningEdit) {
      stopListeningEdit();
    } else {
      startListeningEdit();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Initial Generation Form */}
      <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-3 text-cyan-300">Create New Floorplan</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
          <div className="relative">
            <textarea
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              placeholder="e.g., A 3-bedroom apartment with a large open-plan kitchen and a balcony"
              className="w-full h-28 p-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition resize-none"
              disabled={isLoading}
            />
            {speechRecognitionSupported && (
              <button
                type="button"
                onClick={toggleListenInitial}
                disabled={isLoading}
                className={`absolute top-3 right-3 p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                  isListeningInitial ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                }`}
                aria-label={isListeningInitial ? 'Stop recording' : 'Start recording'}
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !initialPrompt}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="w-5 h-5" />
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </div>

      {/* Edit Form - visible only when a floorplan is selected */}
      {currentFloorplan && (
        <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg font-semibold mb-3 text-amber-300">Edit Current Floorplan</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
             <div className="relative">
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g., Make the master bedroom 20% larger"
                  className="w-full h-24 p-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none transition resize-none"
                  disabled={isLoading}
                />
                 {speechRecognitionSupported && (
                  <button
                    type="button"
                    onClick={toggleListenEdit}
                    disabled={isLoading}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                      isListeningEdit ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                    }`}
                    aria-label={isListeningEdit ? 'Stop recording' : 'Start recording'}
                  >
                    <MicrophoneIcon className="w-5 h-5" />
                  </button>
                )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !editPrompt}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              <SparklesIcon className="w-5 h-5" />
              {isLoading ? 'Editing...' : 'Apply Edit'}
            </button>
          </form>
        </div>
      )}

      {/* History Panel */}
      <div className="flex-1 flex flex-col bg-slate-800/50 p-6 rounded-2xl overflow-hidden shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-slate-300">History</h2>
        {history.length === 0 ? (
          <p className="text-slate-500 text-center mt-4">Your generated floorplans will appear here.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => !isLoading && setCurrentFloorplan(item)}
                className={`relative rounded-lg overflow-hidden cursor-pointer group transition-transform transform hover:scale-105 ${currentFloorplan?.id === item.id ? 'ring-2 ring-cyan-400' : 'ring-1 ring-slate-700 hover:ring-slate-500'}`}
              >
                <img src={item.imageUrl} alt={item.prompt} className="aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                  <p className="text-white text-xs text-center line-clamp-3">{item.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};