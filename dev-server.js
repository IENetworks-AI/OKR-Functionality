// Simple development server that serves both Vite and Netlify functions
import spawn from 'cross-spawn';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { readFileSync } from 'fs';

// Load environment variables
const envVars = {};
try {
  const envContent = readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  Object.assign(process.env, envVars);
} catch (error) {
  console.log('No .env.local file found, using system environment variables');
}

const app = express();
app.use(express.json());

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Netlify function handler
app.post('/.netlify/functions/okr-suggest', async (req, res) => {
  try {
    const { prompt, context, params } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Missing 'prompt'" });
    }

    const MODEL_API_URL = process.env.MODEL_API_URL;
    const MODEL_API_KEY = process.env.MODEL_API_KEY;

    if (!MODEL_API_URL || !MODEL_API_KEY) {
      return res.status(500).json({ error: "API configuration missing" });
    }

    const finalUrl = `${MODEL_API_URL}?key=${MODEL_API_KEY}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: params?.temperature || 0.1,
        maxOutputTokens: params?.maxOutputTokens || 500,
        topK: 1,
        topP: 0.8,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const response = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return res.status(response.status).json({ 
        error: `HTTP ${response.status}: ${errorText}` 
      });
    }

    const data = await response.json();
    const suggestion = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!suggestion) {
      return res.status(500).json({ error: "No suggestion found in API response" });
    }

    res.json({ suggestion, raw: data });
  } catch (error) {
    console.error('Function error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy all other requests to Vite
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5173',
  changeOrigin: true,
  ws: true,
}));

// Start Vite in the background
const vite = spawn('npm', ['run', 'dev:vite'], {
  stdio: 'inherit',
  env: process.env
});

// Start our proxy server
const PORT = 8082;
app.listen(PORT, () => {
  console.log(`🚀 Development server running on http://localhost:${PORT}`);
  console.log('📡 Netlify functions available at /.netlify/functions/*');
  console.log('🎯 Vite dev server proxied from http://localhost:5173');
});

// Cleanup on exit
process.on('SIGINT', () => {
  vite.kill();
  process.exit();
});