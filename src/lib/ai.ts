// Simple client helper to call our Netlify function for OKR suggestions
import { OkrSuggestParams, OkrSuggestResponse } from '@/types';

export async function askOkrModel({ prompt, context, params }: OkrSuggestParams): Promise<OkrSuggestResponse> {
  try {
    // Use the correct URL based on environment
    const baseUrl = import.meta.env.DEV ? "http://localhost:8082" : "";
    const resp = await fetch(`${baseUrl}/.netlify/functions/okr-suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, context, params }),
    });

    // Check if response is ok first
    if (!resp.ok) {
      // Try to get error message from response
      let errorMessage = "Model API error";
      try {
        const errorData = await resp.json();
        errorMessage = errorData?.error || `HTTP ${resp.status}: ${resp.statusText}`;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
      }
      return { error: errorMessage, suggestion: "" };
    }

    // Check if response has content
    const text = await resp.text();
    if (!text || text.trim() === "") {
      return { error: "Empty response from API", suggestion: "" };
    }

    // Try to parse JSON
    try {
      const data = JSON.parse(text) as OkrSuggestResponse;
      return data;
    } catch (jsonError) {
      return { error: "Invalid JSON response from API", suggestion: "" };
    }
  } catch (networkError: unknown) {
    const errorMessage = networkError instanceof Error ? networkError.message : "Network error occurred";
    return { 
      error: errorMessage, 
      suggestion: "" 
    };
  }
}