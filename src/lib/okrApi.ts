import { KeyResult, Task, Plan, OkrSuggestParams, OkrSuggestResponse, ApiTaskCreate, PlanCreatePayload } from '@/types';

// API response interfaces
interface ApiTask {
  id: string;
  task: string;
  priority: string;
  targetValue: number;
  actualValue: string;
  weight: string;
  status: string | null;
  keyResultId: string;
  keyResult: {
    id: string;
    title: string;
    objective: {
      id: string;
      title: string;
      userId: string;
    };
    progress: string;
  };
  plan: {
    id: string;
    createdAt: string;
    isValidated: boolean;
  };
  parentTask?: {
    id: string;
    task: string;
  };
}

// Example user map (optional, for showing owner names)
const userMap: Record<string, { name: string; role: string }> = {
  'e400323a-ea98-4a30-b5ff-5a2150ef326c': { name: 'Mikias A.', role: 'AI and Data Science' },
  'fa2f0459-fec7-4ed0-b709-9038b3787122': { name: 'Test User', role: 'Engineer' },
};

let authToken: string | null = null;
let tokenExpiry: number = 0;

// -------------------- Auth Token (Firebase login) --------------------
export async function getAuthToken(): Promise<string> {
  const now = Date.now();
  if (authToken && now < tokenExpiry) return authToken;

  const email = import.meta.env.VITE_EMAIL;
  const password = import.meta.env.VITE_PASSWORD;
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

  if (!email || !password || !apiKey) {
    throw new Error('Missing VITE_EMAIL, VITE_PASSWORD or VITE_FIREBASE_API_KEY');
  }

  try {
    const firebaseLoginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

    const resp = await fetch(firebaseLoginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    if (!resp.ok) {
      const errorBody = await resp.text().catch(() => 'No response body');
      throw new Error(`Auth failed (${resp.status}): ${errorBody}`);
    }

    const data = await resp.json();
    authToken = data.idToken;
    tokenExpiry = now + (parseInt(data.expiresIn) * 1000) - 60000; // refresh 1 min early
    console.log('Auth token refreshed');
    return authToken;
  } catch (err) {
    console.error('Auth error:', err instanceof Error ? err.message : String(err));
    throw err;
  }
}

// -------------------- Fetch Plans --------------------
export async function fetchPlans(planType: 'Daily' | 'Weekly'): Promise<{
  keyResults: KeyResult[];
  plans: Plan[];
}> {
  try {
    const token = await getAuthToken();
    const url = `${baseUrl}/api/plans/${planType}`;

    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Fetch failed (${resp.status}): ${text}`);
    }

    const tasks: ApiTask[] = await resp.json();
    if (!tasks.length) return { keyResults: [], plans: [] };

    const uniqueKeyResults = new Map<string, KeyResult>();
    const planTasks: Task[] = [];

    tasks.forEach((apiTask) => {
      const krId = apiTask.keyResultId;
      const objUserId = apiTask.keyResult.objective.userId;
      const userInfo = userMap[objUserId] || { name: 'Unknown', role: 'Unknown' };

      if (!uniqueKeyResults.has(krId)) {
        uniqueKeyResults.set(krId, {
          id: apiTask.keyResult.id,
          title: apiTask.keyResult.title,
          owner: { id: objUserId, name: userInfo.name, role: userInfo.role },
          objective: apiTask.keyResult.objective.title,
        });
      }

      const priority = apiTask.priority.charAt(0).toUpperCase() + apiTask.priority.slice(1).toLowerCase();
      planTasks.push({
        id: apiTask.id,
        title: apiTask.task,
        description: apiTask.parentTask ? `Linked to weekly: ${apiTask.parentTask.task}` : '',
        target: parseFloat(apiTask.targetValue.toString()) || 0,
        achieved: parseFloat(apiTask.actualValue) || 0,
        krProgress: parseFloat(apiTask.keyResult.progress) || 0,
        priority: priority as 'High' | 'Medium' | 'Low',
        weight: parseFloat(apiTask.weight) || 0,
        parentTaskId: apiTask.parentTask?.id,
        status: ''
      });
    });

    const planDate = new Date(tasks[0].plan.createdAt).toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    const planStatus = tasks[0].plan.isValidated ? 'Closed' : 'Open';
    const totalAchieved = planTasks.reduce((sum, t) => sum + t.achieved, 0);
    const totalWeight = planTasks.reduce((sum, t) => sum + t.weight, 0);

    const plan: Plan = {
      id: tasks[0].plan.id,
      keyResultId: tasks[0].keyResultId,
      date: planDate,
      status: planStatus,
      tasks: planTasks,
      achieved: totalAchieved,
      progress: totalWeight ? (totalAchieved / totalWeight) * 100 : 0,
    };

    return {
      keyResults: Array.from(uniqueKeyResults.values()),
      plans: [plan],
    };
  } catch (err) {
    console.error(`Error fetching ${planType} plans:`, err instanceof Error ? err.message : String(err));
    return { keyResults: [], plans: [] };
  }
}
// -------------------- Base URLs --------------------
const devUrl = "http://localhost:8082"; // development backend with Netlify functions
const apiUrl = import.meta.env.VITE_API_BASE_URL; // production OKR backend (fetch only)

// Use dev server for AI and CRUD operations, API for fetching existing data
const baseUrl = devUrl;

// -------------------- Auth Helper --------------------
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    tenantId: import.meta.env.VITE_TENANT_ID,
  };
}

// -------------------- CRUD Operations --------------------

// Create a plan with tasks
export async function createPlan(planPayload: PlanCreatePayload): Promise<{ success: boolean; planId?: string; message?: string }> {
  const url = `${baseUrl}/api/plans`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(planPayload),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Create plan error:', err instanceof Error ? err.message : String(err));
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Failed to create plan' 
    };
  }
}

// Update a task
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<{ success: boolean; message?: string }> {
  const url = `${baseUrl}/api/tasks/${taskId}`;
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Update task error:', err instanceof Error ? err.message : String(err));
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Failed to update task' 
    };
  }
}

// Delete a task
export async function deleteTask(taskId: string): Promise<{ success: boolean; message?: string }> {
  const url = `${baseUrl}/api/tasks/${taskId}`;
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Delete task error:', err instanceof Error ? err.message : String(err));
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Failed to delete task' 
    };
  }
}

// -------------------- AI Suggestion --------------------

export async function askOkrModel({ prompt, context, params }: OkrSuggestParams): Promise<OkrSuggestResponse> {
  const url = `${baseUrl}/api/okr-suggest`;

  // Add timeout and optimized parameters
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        prompt: prompt.trim(), 
        context, 
        params: {
          temperature: 0.1,
          maxOutputTokens: 500,
          topK: 1,
          topP: 0.8,
          ...params
        }
      }),
      signal: controller.signal
    });

    if (!resp.ok) {
      let errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
      try {
        const errorData = await resp.json();
        errorMessage = errorData?.error || errorMessage;
      } catch {
        // Error parsing response, use default message
      }
      return { error: errorMessage, suggestion: '' };
    }

    const text = await resp.text();
    if (!text.trim()) return { error: 'Empty response from API', suggestion: '' };

    try {
      return JSON.parse(text) as OkrSuggestResponse;
    } catch {
      return { error: 'Invalid JSON response from API', suggestion: '' };
    }
  } catch (networkError: unknown) {
    clearTimeout(timeoutId);
    let errorMessage = 'Network error occurred';
    
    if (networkError instanceof Error) {
      if (networkError.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else {
        errorMessage = networkError.message;
      }
    }
    
    return { error: errorMessage, suggestion: '' };
  } finally {
    clearTimeout(timeoutId);
  }
}
