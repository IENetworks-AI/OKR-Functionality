// Netlify function to proxy requests to the backend server
export const handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const { httpMethod, path, body, headers } = event;
    
    // Extract the endpoint from the path (remove /backend-proxy prefix)
    const endpoint = path.replace('/.netlify/functions/backend-proxy', '');
    
    // Backend server URL
    const backendUrl = 'https://selamnew-ai.ienetworks.co/';
    const targetUrl = `${backendUrl}${endpoint}`;
    
    console.log(`Proxying ${httpMethod} request to: ${targetUrl}`);
    
    // Prepare headers for the backend request
    const backendHeaders = {
      'Content-Type': 'application/json',
    };
    
    // Forward the request to the backend
    const response = await fetch(targetUrl, {
      method: httpMethod,
      headers: backendHeaders,
      body: httpMethod !== 'GET' ? body : undefined,
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { error: 'Invalid JSON response', raw: responseText };
    }
    
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
    };
    
  } catch (error) {
    console.error('Backend proxy error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Backend proxy error',
        message: error.message,
      }),
    };
  }
};
