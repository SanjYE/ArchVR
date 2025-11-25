import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/models', express.static('output_models'));

// Ensure directories exist
await fs.mkdir('uploads', { recursive: true });
await fs.mkdir('output_models', { recursive: true });

/**
 * Executes a Python script and returns a promise
 */
function runPythonScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [scriptPath, ...args]);
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`Python stdout: ${data}`);
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`Python stderr: ${data}`);
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}\n${stderr}`));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * POST /api/generate-3d
 * Accepts base64 image, converts to DXF then to STL
 */
app.post('/api/generate-3d', upload.none(), async (req, res) => {
  const timestamp = Date.now();
  const imagePath = path.join(__dirname, 'uploads', `image_${timestamp}.png`);
  const dxfPath = path.join(__dirname, 'uploads', `output_${timestamp}.dxf`);
  const stlPath = path.join(__dirname, 'output_models', `model_${timestamp}.stl`);
  
  try {
    // 1. Decode base64 image and save
    const { imageData } = req.body;
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    
    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    await fs.writeFile(imagePath, imageBuffer);
    
    console.log(`Image saved: ${imagePath}`);
    
    // 2. Run Python script 1: Image → DXF
    console.log('Running img_dxf2.py...');
    await runPythonScript(
      path.join(__dirname, 'python_scripts', 'img_dxf2.py'),
      [imagePath, dxfPath]
    );
    
    console.log(`DXF created: ${dxfPath}`);
    
    // 3. Run Python script 2: DXF → STL
    console.log('Running dxf_3d.py...');
    await runPythonScript(
      path.join(__dirname, 'python_scripts', 'dxf_3d.py'),
      [dxfPath, stlPath]
    );
    
    console.log(`STL created: ${stlPath}`);
    
    // 4. Clean up temporary files
    await fs.unlink(imagePath);
    await fs.unlink(dxfPath);
    
    // 5. Return the STL file URL
    const modelUrl = `/models/model_${timestamp}.stl`;
    res.json({ 
      success: true, 
      modelUrl,
      message: '3D model generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating 3D model:', error);
    
    // Clean up on error
    try {
      await fs.unlink(imagePath).catch(() => {});
      await fs.unlink(dxfPath).catch(() => {});
      await fs.unlink(stlPath).catch(() => {});
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    res.status(500).json({ 
      error: 'Failed to generate 3D model',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Models will be served from: http://localhost:${PORT}/models`);
});