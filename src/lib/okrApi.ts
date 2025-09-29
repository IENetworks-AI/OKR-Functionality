import { KeyResult, Task, Plan } from '@/types';

// Example user map
const userMap: Record<string, { name: string; role: string }> = {
  'e400323a-ea98-4a30-b5ff-5a2150ef326c': { name: 'Mikias A.', role: 'AI and Data Science' },
  'fa2f0459-fec7-4ed0-b709-9038b3787122': { name: 'Test User', role: 'Engineer' },
};

let authToken: string | null = null;
let tokenExpiry: number = 0;

/* ========================= 🔐 AUTH ========================= */
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

/* ========================= 📊 PLANS ========================= */
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
    console.log(`Raw API response for ${planType} plans:`, tasks);

    // Deduplicate tasks
    const uniqueTasks = Array.from(new Map(tasks.map((t) => [t.id, t])).values());
    if (!uniqueTasks.length) return { keyResults: [], plans: [] };

    const tasksByKR = new Map<string, Task[]>();
    const uniqueKeyResults = new Map<string, KeyResult>();
    const planInfo = uniqueTasks[0].plan;
    const planDate = new Date(planInfo.createdAt).toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    const planStatus = planInfo.isValidated ? 'Closed' : 'Open';

    uniqueTasks.forEach((apiTask, index) => {
      const krId = apiTask.keyResultId;
      const objUserId = apiTask.keyResult.objective.userId;
      const userInfo = userMap[objUserId] || { name: 'Unknown', role: 'Unknown' };

      const uniqueKrId = `${krId}-${objUserId}-${planType}-${index}`;
      if (!uniqueKeyResults.has(uniqueKrId)) {
        uniqueKeyResults.set(uniqueKrId, {
          id: apiTask.keyResult.id || `kr-${planType}-${index}`,
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
      };

      if (!tasksByKR.has(krId)) tasksByKR.set(krId, []);
      tasksByKR.get(krId)!.push(task);
    });

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

/* ========================= 🤖 AI MODELS ========================= */
export type OkrSuggestParams = {
  prompt: string;
  context?: any;
  params?: Record<string, any>;
  provider?: 'backend';
};

export type OkrSuggestResponse = {
  suggestion: any;
  raw?: any;
  error?: string;
};

// 🚀 Backend API integration (forced to 139.185.33.139)
export async function generateKeyResults(objective: string): Promise<OkrSuggestResponse> {
  try {
    const resp = await fetch(`/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: objective }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Backend API failed (${resp.status}): ${text}`);
    }

    const data = await resp.json();
    return { suggestion: data.answer?.["Key Results"] || [], raw: data };
  } catch (err: any) {
    console.error('Backend API error:', err.message);
    return { error: err.message, suggestion: [] };
  }
}

// 🔄 Unified entry point (backend only)
export async function askOkrModel({ prompt, context, params }: OkrSuggestParams): Promise<OkrSuggestResponse> {
  try {
    const resp = await fetch(`/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: prompt, context, params }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return { error: `Backend API error (${resp.status}): ${text}`, suggestion: '' };
    }

    const data = await resp.json();
    return { suggestion: data?.answer ?? '', raw: data };
  } catch (err: any) {
    return { error: err.message || 'Backend API network error', suggestion: '' };
  }
}

// ✅ New helpers that call backend without free-form prompts
export async function generateWeeklyTasksFromKR(keyResultId: string) {
  const resp = await fetch(`/api/weekly-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Backend expects a string; we'll send the selected KR identifier directly
    body: JSON.stringify({ key_result: keyResultId }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Backend API failed (${resp.status}): ${text}`);
  }
  const data = await resp.json();
  return (data?.weekly_plan?.WeeklyTasks || []).map((t: any) => ({
    title: t.title,
    // backend priority may be lowercase; normalize to 'High' | 'Medium' | 'Low'
    priority: ((t.priority + '').charAt(0).toUpperCase() + (t.priority + '').slice(1).toLowerCase()) as 'High' | 'Medium' | 'Low',
    target: typeof t.target === 'number' ? t.target : (t.target ? parseFloat(t.target) : 100),
    weight: typeof t.weight === 'number' ? t.weight : (t.weight ? parseFloat(t.weight) : 0),
}));
}

export async function generateDailyTasksFromWeekly(weeklyPlanIdOrKR: string) {
  const resp = await fetch(`/api/daily-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Backend currently takes 'annual_key_result' string; we pass selected ID
    body: JSON.stringify({ annual_key_result: weeklyPlanIdOrKR }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Backend API failed (${resp.status}): ${text}`);
  }
  const data = await resp.json();
  return (data?.daily_plan?.DailyTasks || []).map((t: any) => ({
    title: t.title,
    priority: ((t.priority + '').charAt(0).toUpperCase() + (t.priority + '').slice(1).toLowerCase()) as 'High' | 'Medium' | 'Low',
    // daily items do not include target; default to 100 unless specified
    target: typeof t.target === 'number' ? t.target : (t.target ? parseFloat(t.target) : 100),
    weight: typeof t.weight === 'number' ? t.weight : (t.weight ? parseFloat(t.weight) : 0),
}));
}

/* ========================= 📦 API Types ========================= */
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
