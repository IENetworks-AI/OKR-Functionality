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

// Netlify function handler (DEV): route to backend 139.185.33.139 and extract tasks
app.post('/.netlify/functions/okr-suggest', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: "Missing or invalid 'prompt'" });
    }

    // Hit the same backend as production function
    const apiUrl = 'https://1a83c07684f3.ngrok-free.app/chat';
    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: prompt })
    });

    let data;
    try {
      data = await upstream.json();
    } catch (e) {
      console.error('Upstream non-JSON response:', e);
      return res.status(502).json({ error: 'Invalid JSON response from API' });
    }

    // If backend signaled an error, surface it directly
    if (data?.error && !data?.answer) {
      return res.status(502).json({ error: String(data.error) });
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data });
    }

    // Robust task extraction mirroring Netlify function
    const extractTasksFromAnswer = (ans) => {
      try {
        if (!ans) return [];
        if (Array.isArray(ans)) {
          if (ans.length > 0 && typeof ans[0] === 'object') return ans;
          return [];
        }
        if (typeof ans === 'object') {
          if (Array.isArray(ans.weekly_tasks)) return ans.weekly_tasks;
          if (Array.isArray(ans.daily_tasks)) return ans.daily_tasks;
          if (Array.isArray(ans.tasks)) return ans.tasks;
          ans = JSON.stringify(ans);
        }
        if (typeof ans !== 'string') return [];
        const cleaned = ans.replace(/```json/gi, '').replace(/```/g, '').trim();
        const weeklyMatch = cleaned.match(/"weekly_tasks"\s*:\s*(\[[\s\S]*?\])/i);
        if (weeklyMatch) {
          try { const arr = JSON.parse(weeklyMatch[1]); if (Array.isArray(arr)) return arr; } catch {}
        }
        const dailyMatch = cleaned.match(/"daily_tasks"\s*:\s*(\[[\s\S]*?\])/i);
        if (dailyMatch) {
          try { const arr = JSON.parse(dailyMatch[1]); if (Array.isArray(arr)) return arr; } catch {}
        }
        const tasksMatch = cleaned.match(/"tasks"\s*:\s*(\[[\s\S]*?\])/i);
        if (tasksMatch) {
          try { const arr = JSON.parse(tasksMatch[1]); if (Array.isArray(arr)) return arr; } catch {}
        }
        const arrays = cleaned.match(/\[[\s\S]*?\]/g) || [];
        for (const arrStr of arrays) {
          try {
            const arr = JSON.parse(arrStr);
            if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object') {
              const obj = arr[0] || {};
              const hasTaskFields = ('title' in obj) || ('description' in obj) || ('deadline' in obj) || ('priority' in obj) || ('target' in obj) || ('weight' in obj);
              const looksLikeKR = ('metric_type' in obj) || ('target_value' in obj) || ('baseline' in obj) || ('unit' in obj);
              if (hasTaskFields && !looksLikeKR) return arr;
            }
          } catch {}
        }
        for (const arrStr of arrays) {
          try { const arr = JSON.parse(arrStr); if (Array.isArray(arr)) return arr; } catch {}
        }
        return [];
      } catch {
        return [];
      }
    };

    const tasks = extractTasksFromAnswer(data?.answer);
    if (!tasks.length) {
      return res.status(502).json({ error: 'No valid JSON array found in API response', raw: data });
    }

    return res.json({ tasks });
  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({ error: error?.message || 'Unknown error' });
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