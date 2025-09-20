export const handler = async (event) => {
  console.log("OKR Suggest function called with event:", event);

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const contentType = event.headers["content-type"] || event.headers["Content-Type"];
    if (!contentType?.includes("application/json")) {
      return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Content-Type must be application/json" }) };
    }

    const { prompt } = JSON.parse(event.body || "{}");
    if (!prompt || typeof prompt !== "string") {
      return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: 'Missing or invalid "prompt"' }) };
    }

    const apiUrl = "http://139.185.33.139/chat";
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: prompt }),
    });

    let data;
    try {
      data = await resp.json();
    } catch (err) {
      console.error("Failed to parse API JSON:", err);
      return { statusCode: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Invalid JSON response from API" }) };
    }

    console.log("Raw OKR API response JSON:", data);

    if (!resp.ok) return { statusCode: resp.status, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: data }) };

    const extractFirstJsonArray = (raw) => {
      if (!raw || typeof raw !== "string") return [];
      const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      const match = cleaned.match(/\[[\s\S]*?\]/);
      if (!match) return [];
      try {
        const parsed = JSON.parse(match[0]);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error("JSON parse failed", err, "raw:", cleaned);
        return [];
      }
    };

    const tasks = extractFirstJsonArray(data?.answer);

    if (!tasks.length) {
      return { statusCode: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "No valid JSON array found in API response", raw: data }) };
    }

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tasks }) };
  } catch (error) {
    console.error("OKR Suggest function error:", error);
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }) };
  }
};
