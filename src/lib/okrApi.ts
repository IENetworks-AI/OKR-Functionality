import { KeyResult, Task, Plan, WeeklyPlan } from '@/types';

// Example user map
const userMap: Record<string, { name: string; role: string }> = {
  'e400323a-ea98-4a30-b5ff-5a2150ef326c': { name: 'Mikias A.', role: 'AI and Data Science' },
  'fa2f0459-fec7-4ed0-b709-9038b3787122': { name: 'Test User', role: 'Engineer' },
};

let authToken: string | null = null;
let tokenExpiry: number = 0;

// Auth Token (Firebase login)
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

// Fetch Plans
export async function fetchPlans(planType: 'Daily' | 'Weekly'): Promise<{
  keyResults: KeyResult[];
  plans: Plan[];
}> {
  const planId = planType === 'Daily'
    ? import.meta.env.VITE_DAILY_PLAN_ID
    : import.meta.env.VITE_WEEKLY_PLAN_ID;

  const tenantId = import.meta.env.VITE_TENANT_ID;
  const baseUrl = import.meta.env.VITE_API_BASE_URL; // Set to 'https://selamnew-api.example.com'

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
    console.log(`Raw API response for ${planType} plans:`, tasks);

    // Deduplicate tasks by id
    const uniqueTasks = Array.from(new Map(tasks.map((t) => [t.id, t])).values());
    if (tasks.length !== uniqueTasks.length) {
      console.warn(`Removed ${tasks.length - uniqueTasks.length} duplicate tasks in ${planType} plans`);
    }
    if (!uniqueTasks.length) return { keyResults: [], plans: [] };

    // Debug duplicate task IDs
    const taskIds = uniqueTasks.map((t) => t.id);
    const duplicateTaskIds = taskIds.filter((id, index) => taskIds.indexOf(id) !== index);
    if (duplicateTaskIds.length > 0) {
      console.warn(`Duplicate Task IDs in ${planType} plans:`, duplicateTaskIds);
    }

    const tasksByKR = new Map<string, Task[]>();
    const uniqueKeyResults = new Map<string, KeyResult>();
    const planInfo = uniqueTasks[0].plan;
    const planDate = new Date(planInfo.createdAt).toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    const planStatus = planInfo.isValidated ? 'Closed' : 'Open';

    uniqueTasks.forEach((apiTask, index) => {
      const krId = apiTask.keyResultId;
      const objUserId = apiTask.keyResult.objective.userId;
      const userInfo = userMap[objUserId] || { name: 'Unknown', role: 'Unknown' };

      // Use a composite key to ensure uniqueness across plans
      const uniqueKrId = `${krId}-${objUserId}-${planType}-${index}`;
      if (!uniqueKeyResults.has(uniqueKrId)) {
        uniqueKeyResults.set(uniqueKrId, {
          id: apiTask.keyResult.id || `kr-${planType}-${index}`, // Fallback ID
          title: apiTask.keyResult.title || 'Untitled Key Result',
          owner: { id: objUserId, name: userInfo.name, role: userInfo.role },
          objective: apiTask.keyResult.objective.title || 'Untitled Objective',
        });
      }

      const priority = apiTask.priority.charAt(0).toUpperCase() + apiTask.priority.slice(1).toLowerCase();
      const task: Task = {
        id: `${apiTask.id}-${planType}-${index}`,
        title: apiTask.task || 'Untitled Task',
        description: apiTask.parentTask ? `Linked to weekly: ${apiTask.parentTask.task}` : '',
        target: parseFloat(apiTask.targetValue.toString()) || 0,
        achieved: parseFloat(apiTask.actualValue) || 0,
        krProgress: parseFloat(apiTask.keyResult.progress) || 0,
        priority: priority as 'High' | 'Medium' | 'Low',
        weight: parseFloat(apiTask.weight) || 0,
        parentTaskId: apiTask.parentTask?.id,
        status: apiTask.status || '',
      };

      if (!tasksByKR.has(krId)) {
        tasksByKR.set(krId, []);
      }
      tasksByKR.get(krId)!.push(task);
    });

    // Debug duplicate Key Result IDs
    const krIds = Array.from(uniqueKeyResults.keys());
    const duplicateKrIds = krIds.filter((id, index) => krIds.indexOf(id) !== index);
    if (duplicateKrIds.length > 0) {
      console.warn(`Duplicate Key Result IDs in ${planType} plans:`, duplicateKrIds);
    }

    const plans: Plan[] = [];
    tasksByKR.forEach((groupTasks, krId) => {
      const totalAchieved = groupTasks.reduce((sum, t) => sum + t.achieved, 0);
      const totalWeight = groupTasks.reduce((sum, t) => sum + t.weight, 0);
      const plan: Plan = {
        id: `${planInfo.id}-${krId}-${planType}`,
        keyResultId: krId,
        date: planDate,
        status: planStatus,
        tasks: groupTasks,
        achieved: totalAchieved,
        progress: totalWeight ? (totalAchieved / totalWeight) * 100 : 0,
      };
      plans.push(plan);
    });

    return {
      keyResults: Array.from(uniqueKeyResults.values()),
      plans,
    };
  } catch (err) {
    console.error(`Error fetching ${planType} plans:`, err instanceof Error ? err.message : String(err));
    return { keyResults: [], plans: [] };
  }
}

// AI Suggestion
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
    const modelApiUrl =
      import.meta.env.MODEL_API_URL ||
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    const modelApiKey = import.meta.env.MODEL_API_KEY;

    if (!modelApiKey) {
      console.error('Missing MODEL_API_KEY');
      return { error: 'Missing MODEL_API_KEY', suggestion: '' };
    }

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            ...(context ? [{ text: `Context: ${JSON.stringify(context)}` }] : []),
          ],
        },
      ],
      generationConfig: {
        temperature: params?.temperature ?? 0.3,
        maxOutputTokens: params?.maxOutputTokens ?? 1000,
        response_mime_type: 'application/json', // Force JSON output
      },
    };

    console.log('Sending Gemini API request:', { prompt, context });

    const resp = await fetch(modelApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': modelApiKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    console.log('Gemini API raw response:', text);

    let data;
    const isJson = (resp.headers.get('content-type') || '').includes('application/json');
    if (isJson) {
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse Gemini API response:', parseError);
        return { error: 'Invalid JSON response from Model API', suggestion: '', raw: text };
      }
    } else {
      console.error('Non-JSON response from Gemini API:', text);
      return { error: 'Non-JSON response from Model API', suggestion: '', raw: text };
    }

    if (!resp.ok) {
      console.error('Gemini API error:', data?.error?.message || text);
      return {
        error: isJson ? data?.error?.message || text : `HTTP ${resp.status}: ${text || resp.statusText}`,
        suggestion: '',
        raw: data || text,
      };
    }

    const suggestion = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!suggestion) {
      console.error('No suggestion found in Gemini API response:', data);
      return { error: 'No suggestion found in API response', suggestion: '', raw: data };
    }

    return { suggestion, raw: data };
  } catch (networkError: any) {
    console.error('Gemini API network error:', networkError);
    return {
      error: networkError?.message || 'Network error occurred',
      suggestion: '',
      raw: networkError,
    };
  }
}

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