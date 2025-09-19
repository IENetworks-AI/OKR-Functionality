import { KeyResult, Task, Plan } from '@/types';

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
  const planId = planType === 'Daily'
    ? import.meta.env.VITE_DAILY_PLAN_ID
    : import.meta.env.VITE_WEEKLY_PLAN_ID;

  const tenantId = import.meta.env.VITE_TENANT_ID;
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!planId || !tenantId || !baseUrl) throw new Error('Missing env variables for fetching plans');

  const token = await getAuthToken();
  const url = `${baseUrl}/plan-tasks/get-reported-plan-tasks/by-plan-id/${planId}`;

  try {
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        tenantId,
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

// -------------------- CRUD Operations --------------------

// Create a plan
export async function createPlan(plan: Plan): Promise<Plan> {
  const token = await getAuthToken();
  const url = `${import.meta.env.VITE_API_BASE_URL}/plans`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        tenantId: import.meta.env.VITE_TENANT_ID,
      },
      body: JSON.stringify(plan),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Create plan failed (${resp.status}): ${text}`);
    }

    return await resp.json();
  } catch (err) {
    console.error('Create plan error:', err instanceof Error ? err.message : String(err));
    throw err;
  }
}

// Update a task
export async function updateTask(planId: string, task: Task): Promise<Task> {
  const token = await getAuthToken();
  const url = `${import.meta.env.VITE_API_BASE_URL}/plans/${planId}/tasks/${task.id}`;

  try {
    const resp = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        tenantId: import.meta.env.VITE_TENANT_ID,
      },
      body: JSON.stringify(task),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Update task failed (${resp.status}): ${text}`);
    }

    return await resp.json();
  } catch (err) {
    console.error('Update task error:', err instanceof Error ? err.message : String(err));
    throw err;
  }
}

// Delete a task
export async function deleteTask(taskId: string): Promise<boolean> {
  const token = await getAuthToken();
  const url = `${import.meta.env.VITE_API_BASE_URL}/tasks/${taskId}`;

  try {
    const resp = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        tenantId: import.meta.env.VITE_TENANT_ID,
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Delete task failed (${resp.status}): ${text}`);
    }

    return true;
  } catch (err) {
    console.error('Delete task error:', err instanceof Error ? err.message : String(err));
    return false;
  }
}

// -------------------- AI Suggestion --------------------
export type OkrSuggestParams = {
  prompt: string;
  context?: any;
  params?: Record<string, any>;
};

export type OkrSuggestResponse = {
  suggestion: string | any;
  raw?: any;
  error?: string;
};

export async function askOkrModel({ prompt, context, params }: OkrSuggestParams): Promise<OkrSuggestResponse> {
  try {
    // Use relative URL in development to leverage Vite proxy
    const endpoint = '/api/okr-suggest';
    const baseUrl = import.meta.env.DEV ? "http://localhost:8082" : "";
    const url = import.meta.env.DEV ? endpoint : `${baseUrl}${endpoint}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context, params }),
    });

    if (!resp.ok) {
      let errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
      try {
        const errorData = await resp.json();
        errorMessage = errorData?.error || errorMessage;
      } catch {
        // Fallback to status text if JSON parsing fails
      }
      return { error: errorMessage, suggestion: '' };
    }

    const text = await resp.text();
    if (!text || text.trim() === '') {
      return { error: 'Empty response from API', suggestion: '' };
    }

    try {
      const data = JSON.parse(text);
      return data;
    } catch {
      return { error: 'Invalid JSON response from API', suggestion: '' };
    }
  } catch (networkError: any) {
    return {
      error: networkError?.message || 'Network error occurred',
      suggestion: '',
    };
  }
}