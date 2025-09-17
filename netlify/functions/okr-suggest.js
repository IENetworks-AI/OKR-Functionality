// Netlify Function: okr-suggest
// Proxies a prompt to your custom Model API securely via env vars.
// Env vars expected:
// - MODEL_API_URL (e.g., https://api.yourmodel.com/v1/generate)
// - MODEL_API_KEY (optional if your API requires it)
// - MODEL_NAME (optional)

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const MODEL_API_URL = process.env.MODEL_API_URL;
    const MODEL_API_KEY = process.env.MODEL_API_KEY;
    const MODEL_NAME = process.env.MODEL_NAME;

    if (!MODEL_API_URL) {
      return { statusCode: 500, body: JSON.stringify({ error: "MODEL_API_URL is not configured" }) };
    }

    const contentType = event.headers["content-type"] || event.headers["Content-Type"]; 
    if (!contentType?.includes("application/json")) {
      return { statusCode: 400, body: JSON.stringify({ error: "Content-Type must be application/json" }) };
    }

    const body = JSON.parse(event.body || "{}");
    const { prompt, context, params } = body;

    if (!prompt || typeof prompt !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing 'prompt'" }) };
    }

    // Construct payload based on the API provider
    let payload;
    let headers = {
      "Content-Type": "application/json",
    };

    // Check if this is a Gemini API URL
    if (MODEL_API_URL.includes('generativelanguage.googleapis.com')) {
      // Gemini API format
      payload = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: params?.temperature || 0.3,
          maxOutputTokens: params?.maxOutputTokens || 1000,
        }
      };
      // Gemini uses API key as query parameter
      // We'll append it to the URL later
    } else {
      // Generic/OpenAI format
      payload = {
        prompt,
        model: MODEL_NAME,
        context,
        ...params,
      };
      if (MODEL_API_KEY) headers["Authorization"] = `Bearer ${MODEL_API_KEY}`;
    }

    // Construct the final URL (add API key for Gemini)
    let finalUrl = MODEL_API_URL;
    if (MODEL_API_URL.includes('generativelanguage.googleapis.com') && MODEL_API_KEY) {
      finalUrl = `${MODEL_API_URL}?key=${MODEL_API_KEY}`;
    }

    const resp = await fetch(finalUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    const isJson = (resp.headers.get("content-type") || "").includes("application/json");

    if (!resp.ok) {
      console.error(`Model API error: ${resp.status} ${resp.statusText}`, text);
      return { 
        statusCode: resp.status, 
        body: JSON.stringify({ 
          error: isJson ? (JSON.parse(text)?.error || text) : `HTTP ${resp.status}: ${text || resp.statusText}` 
        }) 
      };
    }

    // Check if response is empty
    if (!text || text.trim() === "") {
      console.error("Empty response from model API");
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "Empty response from model API" }) 
      };
    }

    // Try to normalize a response shape
    if (isJson) {
      try {
        const data = JSON.parse(text);
        
        // Extract suggestion based on API provider
        let suggestion;
        
        if (MODEL_API_URL.includes('generativelanguage.googleapis.com')) {
          // Gemini API response format
          suggestion = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        } else {
          // Common fields for other providers
          suggestion =
            data?.suggestion ||
            data?.output ||
            data?.choices?.[0]?.text ||
            data?.choices?.[0]?.message?.content ||
            data?.message ||
            data;
        }

        if (!suggestion) {
          console.error("No suggestion found in response:", data);
          return {
            statusCode: 500,
            body: JSON.stringify({ error: "No suggestion found in API response" }),
          };
        }

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ suggestion, raw: data }),
        };
      } catch (jsonError) {
        console.error("Failed to parse JSON response from model API:", jsonError.message, text);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Invalid JSON response from model API" }),
        };
      }
    }

    // Non-JSON: return raw text
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestion: text, raw: text }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || "Unknown error" }),
    };
  }
};