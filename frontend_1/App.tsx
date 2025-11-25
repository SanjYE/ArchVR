import React, { useState, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { FloorplanDisplay } from './components/FloorplanDisplay';
import { generateFloorplan, editFloorplan } from './services/geminiService';
import type { Floorplan } from './types';

function App() {
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [currentFloorplan, setCurrentFloorplan] = useState<Floorplan | null>(null);
  const [history, setHistory] = useState<Floorplan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiResponse = useCallback((prompt: string, result: { imageUrl: string, mimeType: string }) => {
    const newFloorplan: Floorplan = {
      id: new Date().toISOString(),
      prompt,
      imageUrl: result.imageUrl,
      mimeType: result.mimeType,
    };
    setCurrentFloorplan(newFloorplan);
    setHistory(prev => [newFloorplan, ...prev]);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!initialPrompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await generateFloorplan(initialPrompt);
      handleApiResponse(initialPrompt, result);
      setInitialPrompt(''); // Clear prompt on success
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [initialPrompt, isLoading, handleApiResponse]);

  const handleEdit = useCallback(async () => {
    if (!editPrompt.trim() || !currentFloorplan || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      // Extract base64 data from the data URL
      const base64Data = currentFloorplan.imageUrl.split(',')[1];
      const result = await editFloorplan(base64Data, currentFloorplan.mimeType, editPrompt);
      
      const combinedPrompt = `${currentFloorplan.prompt} (edited: ${editPrompt})`;
      handleApiResponse(combinedPrompt, result);
      setEditPrompt(''); // Clear prompt on success
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [editPrompt, currentFloorplan, isLoading, handleApiResponse]);
  
  return (
    <main className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            ArchVR
          </h1>
          <p className="text-slate-400 mt-2">Design your space with the power of generative AI</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
             <ControlPanel
              initialPrompt={initialPrompt}
              setInitialPrompt={setInitialPrompt}
              handleGenerate={handleGenerate}
              editPrompt={editPrompt}
              setEditPrompt={setEditPrompt}
              handleEdit={handleEdit}
              history={history}
              setCurrentFloorplan={setCurrentFloorplan}
              currentFloorplan={currentFloorplan}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:col-span-2">
            <FloorplanDisplay 
              floorplan={currentFloorplan} 
              isLoading={isLoading} 
              error={error} 
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
