import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function extractImageFromGemini(response: any): string | null {
  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        return `data:${mime};base64,${part.inlineData.data}`;
      }
    }
  }
  return null;
}

function parseBase64Image(image: string): { base64Data: string; mimeType: string } {
  const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64Data: match[2] };
  }
  return { mimeType: 'image/png', base64Data: image };
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  // Increase payload limits for image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // ============================================
  // GEMINI SERVER ENDPOINTS (NO CLIENT API KEYS NEEDED)
  // ============================================

  // 1. Gemini Background Removal
  app.post('/api/gemini/remove-bg', async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'No image provided. Please upload a photo first.' });
      }

      const { base64Data, mimeType } = parseBase64Image(image);

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
            {
              text: 'Isolate and extract the main foreground subject completely. Remove all background scenery, objects, and textures completely so that only the clean subject cutout remains on a clean transparent background.',
            },
          ],
        },
      });

      const resultImage = extractImageFromGemini(response);
      if (!resultImage) {
        throw new Error('Gemini processed the request but did not return an image part. Please try again.');
      }

      return res.json({
        success: true,
        resultImage,
        format: 'png',
      });
    } catch (err: unknown) {
      console.error('Error in /api/gemini/remove-bg:', err);
      const message = err instanceof Error ? err.message : 'Error processing image with Gemini';
      return res.status(500).json({ error: message });
    }
  });

  // 2. Gemini Artistic Style Transfer
  app.post('/api/gemini/style', async (req, res) => {
    try {
      const { image, prompt } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'No image provided. Please upload a photo first.' });
      }
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ error: 'Style prompt is required (e.g., "cartoon", "oil painting", "anime").' });
      }

      const { base64Data, mimeType } = parseBase64Image(image);

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
            {
              text: `Recreate and transform this image in the style of ${prompt.trim()}. Faithfully preserve the identity, pose, and composition of the subject while applying rich textures, lighting, and medium of this artistic style.`,
            },
          ],
        },
      });

      const resultImage = extractImageFromGemini(response);
      if (!resultImage) {
        throw new Error('Gemini processed the style request but did not return an image part. Please try again.');
      }

      return res.json({
        success: true,
        resultImage,
        prompt: prompt.trim(),
        format: 'png',
      });
    } catch (err: unknown) {
      console.error('Error in /api/gemini/style:', err);
      const message = err instanceof Error ? err.message : 'Error processing style with Gemini';
      return res.status(500).json({ error: message });
    }
  });

  // 3. Gemini Resolution Upscale & Detail Enhancement
  app.post('/api/gemini/upscale', async (req, res) => {
    try {
      const { image, resolution = '1080p', prompt = 'ultra sharp details, 4k texture, high quality' } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'No image provided to upscale.' });
      }

      const { base64Data, mimeType } = parseBase64Image(image);

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
            {
              text: `Perform high-definition resolution upscaling and detail enhancement on this image for ${resolution} target display. Eliminate blur, sharpen fine edges, refine micro-textures, and dramatically improve clarity: ${prompt}`,
            },
          ],
        },
      });

      const resultImage = extractImageFromGemini(response);
      if (!resultImage) {
        throw new Error('Gemini did not return an upscaled image. Please try again.');
      }

      return res.json({
        success: true,
        resultImage,
        resolution,
        format: 'png',
      });
    } catch (err: unknown) {
      console.error('Error in /api/gemini/upscale:', err);
      const message = err instanceof Error ? err.message : 'Error upscaling with Gemini';
      return res.status(500).json({ error: message });
    }
  });

  // 4. Remove.bg API Proxy (Legacy fallback)
  app.post('/api/remove-bg', async (req, res) => {
    try {
      const { image, apiKey, size = 'auto' } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: 'remove.bg API key is required. Please paste your API key at the top.' });
      }
      if (!image) {
        return res.status(400).json({ error: 'No image provided. Please upload a photo first.' });
      }

      // Extract base64 and mime type
      const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      let base64Data = image;
      let mimeType = 'image/png';
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }

      const imageBuffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([imageBuffer], { type: mimeType });

      const formData = new FormData();
      formData.append('image_file', blob, 'input-image.png');
      formData.append('size', size);
      formData.append('format', 'png');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey.trim(),
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `remove.bg API error (status ${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson?.errors && Array.isArray(errJson.errors) && errJson.errors.length > 0) {
            errorMessage = errJson.errors.map((e: { title?: string; detail?: string }) => e.title || e.detail).join(' - ');
          }
        } catch {
          const text = await response.text();
          if (text) errorMessage = text;
        }

        if (response.status === 401 || response.status === 403) {
          errorMessage = 'Invalid or unauthorized remove.bg API key. Please check your key at the top.';
        } else if (response.status === 402) {
          errorMessage = 'Insufficient credits on your remove.bg account.';
        }

        return res.status(response.status).json({ error: errorMessage });
      }

      const arrayBuffer = await response.arrayBuffer();
      const outputBase64 = Buffer.from(arrayBuffer).toString('base64');
      const resultDataUrl = `data:image/png;base64,${outputBase64}`;

      return res.json({
        success: true,
        resultImage: resultDataUrl,
        format: 'png',
      });
    } catch (err: unknown) {
      console.error('Error in /api/remove-bg:', err);
      const message = err instanceof Error ? err.message : 'Internal server error while processing image with remove.bg';
      return res.status(500).json({ error: message });
    }
  });

  // 2. Stability AI Style Transfer Proxy
  app.post('/api/stability-style', async (req, res) => {
    try {
      const { image, apiKey, prompt, fidelity = 0.5, output_format = 'png' } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: 'Stability AI API key is required. Please paste your API key at the top.' });
      }
      if (!image) {
        return res.status(400).json({ error: 'No image provided. Please upload a photo first.' });
      }
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ error: 'Style prompt is required (e.g., "cartoon", "oil painting", "anime").' });
      }

      // Extract base64 and mime type
      const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      let base64Data = image;
      let mimeType = 'image/png';
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }

      const imageBuffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([imageBuffer], { type: mimeType });

      const formData = new FormData();
      formData.append('image', blob, 'input-image.png');
      formData.append('prompt', prompt.trim());
      formData.append('output_format', output_format);
      if (fidelity !== undefined && fidelity !== null) {
        formData.append('fidelity', String(fidelity));
      }

      const response = await fetch('https://api.stability.ai/v2beta/stable-image/control/style', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Accept': 'image/*',
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Stability AI error (status ${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson?.errors && Array.isArray(errJson.errors)) {
            errorMessage = errJson.errors.join('; ');
          } else if (errJson?.message) {
            errorMessage = errJson.message;
          } else if (errJson?.name) {
            errorMessage = `${errJson.name}: ${errJson.message || 'API request failed'}`;
          }
        } catch {
          const text = await response.text();
          if (text) errorMessage = text;
        }

        if (response.status === 401 || response.status === 403) {
          errorMessage = 'Invalid or unauthorized Stability AI API key. Please check your key at the top.';
        } else if (response.status === 402) {
          errorMessage = 'Insufficient credits on your Stability AI account.';
        }

        return res.status(response.status).json({ error: errorMessage });
      }

      const arrayBuffer = await response.arrayBuffer();
      const outputBase64 = Buffer.from(arrayBuffer).toString('base64');
      const contentType = response.headers.get('content-type') || `image/${output_format}`;
      const resultDataUrl = `data:${contentType};base64,${outputBase64}`;

      return res.json({
        success: true,
        resultImage: resultDataUrl,
        prompt: prompt.trim(),
        format: output_format,
      });
    } catch (err: unknown) {
      console.error('Error in /api/stability-style:', err);
      const message = err instanceof Error ? err.message : 'Internal server error while processing image with Stability AI';
      return res.status(500).json({ error: message });
    }
  });

  // 3. Stability AI Creative Upscale (Start Job)
  app.post('/api/upscale-start', async (req, res) => {
    try {
      const { image, apiKey, prompt = 'ultra high quality, crystal clear, sharp details, masterwork', creativity = 0.3 } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: 'Stability AI API key is required. Please paste your API key at the top.' });
      }
      if (!image) {
        return res.status(400).json({ error: 'No image provided to upscale.' });
      }

      // Extract base64 and mime type
      const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      let base64Data = image;
      let mimeType = 'image/png';
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }

      const imageBuffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([imageBuffer], { type: mimeType });

      const formData = new FormData();
      formData.append('image', blob, 'upscale-input.png');
      formData.append('prompt', prompt.trim());
      formData.append('output_format', 'png');
      formData.append('creativity', String(creativity));

      const response = await fetch('https://api.stability.ai/v2beta/stable-image/upscale/creative', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Stability AI Creative Upscale error (status ${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson?.errors && Array.isArray(errJson.errors)) {
            errorMessage = errJson.errors.join('; ');
          } else if (errJson?.message) {
            errorMessage = errJson.message;
          } else if (errJson?.name) {
            errorMessage = `${errJson.name}: ${errJson.message || 'Upscale failed'}`;
          }
        } catch {
          const text = await response.text();
          if (text) errorMessage = text;
        }

        if (response.status === 401 || response.status === 403) {
          errorMessage = 'Invalid or unauthorized Stability AI API key. Please check your key at the top.';
        } else if (response.status === 402) {
          errorMessage = 'Insufficient credits on your Stability AI account for Creative Upscale.';
        }

        return res.status(response.status).json({ error: errorMessage });
      }

      const data = await response.json();
      return res.json({ success: true, id: data.id });
    } catch (err: unknown) {
      console.error('Error starting Creative Upscale:', err);
      const message = err instanceof Error ? err.message : 'Internal server error during Creative Upscale';
      return res.status(500).json({ error: message });
    }
  });

  // 4. Stability AI Creative Upscale (Poll Status / Result)
  app.post('/api/upscale-poll', async (req, res) => {
    try {
      const { id, apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: 'Stability AI API key is required.' });
      }
      if (!id) {
        return res.status(400).json({ error: 'Generation Task ID is required.' });
      }

      const response = await fetch(`https://api.stability.ai/v2beta/stable-image/upscale/creative/result/${id}`, {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Accept': 'image/*',
        },
      });

      if (response.status === 202) {
        // Still processing
        return res.json({ status: 'in-progress' });
      }

      if (response.status === 200) {
        // Completed successfully
        const arrayBuffer = await response.arrayBuffer();
        const outputBase64 = Buffer.from(arrayBuffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/png';
        const resultDataUrl = `data:${contentType};base64,${outputBase64}`;

        return res.json({
          status: 'complete',
          success: true,
          resultImage: resultDataUrl,
        });
      }

      // Any other status code is an error
      let errorMessage = `Stability AI Creative Upscale failed with status ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.errors && Array.isArray(errJson.errors)) {
          errorMessage = errJson.errors.join('; ');
        } else if (errJson?.message) {
          errorMessage = errJson.message;
        }
      } catch {
        const text = await response.text();
        if (text) errorMessage = text;
      }

      return res.status(response.status).json({ status: 'error', error: errorMessage });
    } catch (err: unknown) {
      console.error('Error polling Creative Upscale result:', err);
      const message = err instanceof Error ? err.message : 'Error polling upscale result';
      return res.status(500).json({ error: message });
    }
  });

  // 5. All-in-one /api/upscale endpoint with server-side polling
  app.post('/api/upscale', async (req, res) => {
    try {
      const { image, apiKey, prompt = 'ultra high quality, crystal clear, sharp details, masterwork', creativity = 0.3 } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: 'Stability AI API key is required. Please paste your API key at the top.' });
      }
      if (!image) {
        return res.status(400).json({ error: 'No image provided to upscale.' });
      }

      // Step 1: Start upscale
      const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      let base64Data = image;
      let mimeType = 'image/png';
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }

      const imageBuffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([imageBuffer], { type: mimeType });

      const formData = new FormData();
      formData.append('image', blob, 'upscale-input.png');
      formData.append('prompt', prompt.trim());
      formData.append('output_format', 'png');
      formData.append('creativity', String(creativity));

      const startRes = await fetch('https://api.stability.ai/v2beta/stable-image/upscale/creative', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!startRes.ok) {
        let errorMessage = `Stability AI Creative Upscale error (status ${startRes.status})`;
        try {
          const errJson = await startRes.json();
          if (errJson?.errors && Array.isArray(errJson.errors)) {
            errorMessage = errJson.errors.join('; ');
          } else if (errJson?.message) {
            errorMessage = errJson.message;
          }
        } catch {
          const text = await startRes.text();
          if (text) errorMessage = text;
        }

        if (startRes.status === 401 || startRes.status === 403) {
          errorMessage = 'Invalid or unauthorized Stability AI API key.';
        } else if (startRes.status === 402) {
          errorMessage = 'Insufficient credits on your Stability AI account for Creative Upscale.';
        }

        return res.status(startRes.status).json({ error: errorMessage });
      }

      const startData = await startRes.json();
      const taskId = startData.id;

      // Step 2: Poll for completion (up to ~80 seconds)
      const maxAttempts = 28;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const pollRes = await fetch(`https://api.stability.ai/v2beta/stable-image/upscale/creative/result/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Accept': 'image/*',
          },
        });

        if (pollRes.status === 200) {
          const arrayBuffer = await pollRes.arrayBuffer();
          const outputBase64 = Buffer.from(arrayBuffer).toString('base64');
          const contentType = pollRes.headers.get('content-type') || 'image/png';
          const resultDataUrl = `data:${contentType};base64,${outputBase64}`;

          return res.json({
            success: true,
            resultImage: resultDataUrl,
            id: taskId,
          });
        }

        if (pollRes.status !== 202) {
          let errText = `Upscale failed (status ${pollRes.status})`;
          try {
            const errJson = await pollRes.json();
            if (errJson?.message) errText = errJson.message;
          } catch {
            // ignore
          }
          return res.status(pollRes.status).json({ error: errText });
        }
      }

      return res.status(504).json({ error: 'Creative Upscale request timed out. Please try again or use a smaller image.' });
    } catch (err: unknown) {
      console.error('Error in /api/upscale:', err);
      const message = err instanceof Error ? err.message : 'Internal error processing upscale';
      return res.status(500).json({ error: message });
    }
  });

  // Vite development middleware or static production serve
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Edit Photo server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
