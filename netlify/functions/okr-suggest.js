exports.handler = async (event) => {
  console.log('OKR Suggest function called with event:', event);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const modelApiUrl = process.env.MODEL_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const modelApiKey = process.env.MODEL_API_KEY;

    if (!modelApiKey) {
      console.error('Missing MODEL_API_KEY');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing MODEL_API_KEY' }),
      };
    }

    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType?.includes('application/json')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Content-Type must be application/json' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { prompt, params } = body;

    if (!prompt || typeof prompt !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing or invalid "prompt"' }),
      };
    }

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: params?.temperature || 0.3,
        maxOutputTokens: params?.maxOutputTokens || 1000,
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': modelApiKey,
    };

    const resp = await fetch(modelApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    console.log('Raw model API response text:', text);

    let data;
    const isJson = (resp.headers.get('content-type') || '').includes('application/json');
    if (isJson) {
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('Failed to parse model API response as JSON:', err);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Invalid JSON response from Model API', raw: text }),
        };
      }
    }

    if (!resp.ok) {
      console.error(`Model API error: ${resp.status} ${resp.statusText}`, data || text);
      return {
        statusCode: resp.status,
        body: JSON.stringify({
          error: isJson ? data?.error?.message || text : `HTTP ${resp.status}: ${text || resp.statusText}`,
          raw: data || text,
        }),
      };
    }

    const suggestion = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!suggestion) {
      console.error('No suggestion found in API response:', data);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No suggestion found in API response', raw: data }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestion, raw: data }),
    };
  } catch (error) {
    console.error('OKR Suggest function error:', error instanceof Error ? error.message : String(error));
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
    };
  }
};
