exports.handler = async (event) => {
  console.log('Auth function called with event:', event);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { email, password } = JSON.parse(event.body || '{}');
    const apiKey = process.env.FIREBASE_API_KEY;

    if (!email || !password || !apiKey) {
      console.error('Missing required env or payload:', { email, password, apiKey: !!apiKey });
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing email, password, or FIREBASE_API_KEY' }),
      };
    }

    const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const resp = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const text = await resp.text();
    console.log('Raw auth response text:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('Failed to parse Firebase Auth response as JSON:', err);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON response from Firebase Auth', raw: text }),
      };
    }

    if (!resp.ok) {
      console.error('Firebase Auth error:', data);
      return {
        statusCode: resp.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.error?.message || 'Auth failed', raw: data }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: data.idToken,
        expiresIn: data.expiresIn,
        refreshToken: data.refreshToken,
        raw: data,
      }),
    };
  } catch (error) {
    console.error('Auth function error:', error instanceof Error ? error.message : String(error));
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    };
  }
};
