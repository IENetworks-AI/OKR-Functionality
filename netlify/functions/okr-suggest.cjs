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

    // If backend signaled an error, surface it directly
    if (data?.error && !data?.answer) {
      return { statusCode: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: String(data.error) }) };
    }

    if (!resp.ok) return { statusCode: resp.status, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: data }) };

    const extractTasksFromAnswer = (ans) => {
      try {
        if (!ans) return [];

        // 0) If the answer is already an object/array, handle directly
        if (Array.isArray(ans)) {
          if (ans.length > 0 && typeof ans[0] === 'object') return ans;
          return [];
        }
        if (typeof ans === 'object') {
          if (Array.isArray(ans.weekly_tasks)) return ans.weekly_tasks;
          if (Array.isArray(ans.daily_tasks)) return ans.daily_tasks;
          if (Array.isArray(ans.tasks)) return ans.tasks;
          // Fallback: stringify object and continue
          ans = JSON.stringify(ans);
        }

        if (typeof ans !== 'string') return [];

        const cleaned = ans.replace(/```json/gi, "").replace(/```/g, "").trim();

        // 1) Prefer explicit weekly_tasks array inside an object
        const weeklyMatch = cleaned.match(/"weekly_tasks"\s*:\s*(\[[\s\S]*?\])/i);
        if (weeklyMatch) {
          try {
            const arr = JSON.parse(weeklyMatch[1]);
            if (Array.isArray(arr)) return arr;
          } catch (err) {
            console.error("Failed parsing weekly_tasks array:", err);
          }
        }

        // 1b) Try daily_tasks explicitly
        const dailyMatch = cleaned.match(/"daily_tasks"\s*:\s*(\[[\s\S]*?\])/i);
        if (dailyMatch) {
          try {
            const arr = JSON.parse(dailyMatch[1]);
            if (Array.isArray(arr)) return arr;
          } catch {}
        }

        // 1c) Try generic tasks array
        const tasksMatch = cleaned.match(/"tasks"\s*:\s*(\[[\s\S]*?\])/i);
        if (tasksMatch) {
          try {
            const arr = JSON.parse(tasksMatch[1]);
            if (Array.isArray(arr)) return arr;
          } catch {}
        }

        // 2) Scan all arrays and pick the one that looks like tasks (has task-like fields)
        const arrays = cleaned.match(/\[[\s\S]*?\]/g) || [];
        for (const arrStr of arrays) {
          try {
            const arr = JSON.parse(arrStr);
            if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object') {
              const obj = arr[0] || {};
              const hasTaskFields = (
                ('title' in obj) || ('description' in obj) || ('deadline' in obj) || ('priority' in obj) || ('target' in obj) || ('weight' in obj)
              );
              const looksLikeKR = ('metric_type' in obj) || ('target_value' in obj) || ('baseline' in obj) || ('unit' in obj);
              if (hasTaskFields && !looksLikeKR) return arr;
            }
          } catch (err) {
            // continue scanning
          }
        }

        // 3) Fallback: return first JSON array if any
        for (const arrStr of arrays) {
          try {
            const arr = JSON.parse(arrStr);
            if (Array.isArray(arr)) return arr;
          } catch {}
        }
        return [];
      } catch {
        return [];
      }
    };

    const tasks = extractTasksFromAnswer(data?.answer);

    if (!tasks.length) {
      return { statusCode: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "No valid JSON array found in API response", raw: data }) };
    }

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tasks }) };
  } catch (error) {
    console.error("OKR Suggest function error:", error);
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }) };
  }
};
