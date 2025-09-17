exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    // Gemini API configuration
    const MODEL_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    const MODEL_API_KEY = process.env.MODEL_API_KEY; // Use .env.local for security

    const contentType = event.headers["content-type"] || event.headers["Content-Type"];
    if (!contentType?.includes("application/json")) {
      return { statusCode: 400, body: JSON.stringify({ error: "Content-Type must be application/json" }) };
    }

    const body = JSON.parse(event.body || "{}");
    const { prompt, params } = body;

    if (!prompt || typeof prompt !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing 'prompt'" }) };
    }

    // Construct payload for Gemini API
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: params?.temperature || 0.3,
        maxOutputTokens: params?.maxOutputTokens || 1000,
      },
    };

    // Correct header with API key
    const headers = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": MODEL_API_KEY,
    };

    const resp = await fetch(MODEL_API_URL, {
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
          error: isJson ? (JSON.parse(text)?.error || text) : `HTTP ${resp.status}: ${text || resp.statusText}`,
        }),
      };
    }

    if (!text || text.trim() === "") {
      console.error("Empty response from model API");
      return { statusCode: 500, body: JSON.stringify({ error: "Empty response from model API" }) };
    }

    // Parse JSON response
    if (isJson) {
      try {
        const data = JSON.parse(text);
        const suggestion = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!suggestion) {
          console.error("No suggestion found in response:", data);
          return { statusCode: 500, body: JSON.stringify({ error: "No suggestion found in API response" }) };
        }

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ suggestion, raw: data }),
        };
      } catch (jsonError) {
        console.error("Failed to parse JSON response from model API:", jsonError.message, text);
        return { statusCode: 500, body: JSON.stringify({ error: "Invalid JSON response from model API" }) };
      }
    }

    // Fallback: return raw text if not JSON
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suggestion: text, raw: text }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Unknown error" }) };
  }
};
