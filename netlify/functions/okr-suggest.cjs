export const handler = async (event) => {
  console.log('OKR Suggest function called with event:', event);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType?.includes('application/json')) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Content-Type must be application/json' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing or invalid "prompt"' }),
      };
    }

    const apiUrl = 'http://139.185.33.139/chat';
    const payload = { query: prompt };

    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    console.log('Raw OKR API response JSON:', data);

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data }),
      };
    }

    const keyResults = data?.answer?.["Key Results"];
    if (!keyResults || !Array.isArray(keyResults)) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No Key Results found in API response', raw: data }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyResults, raw: data }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
    };
  }
};
