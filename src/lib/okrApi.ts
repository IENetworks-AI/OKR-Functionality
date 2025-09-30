import { KeyResult, Task, Plan } from '@/types';

// Dynamic user cache
const userCache: Record<string, { name: string; role: string; email?: string }> = {};

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

/* ========================= 👥 USER & KEY RESULTS ========================= */

/**
 * Fetch user information by user ID
 */
export async function fetchUserInfo(userId: string): Promise<{ id: string; name: string; role: string; email?: string }> {
  // Check cache first
  if (userCache[userId]) {
    return { id: userId, ...userCache[userId] };
  }

  const tenantId = import.meta.env.VITE_TENANT_ID;
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const token = await getAuthToken();

  try {
    const url = `${baseUrl}/users/${userId}`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        tenantId,
      },
    });

    if (resp.ok) {
      const userData = await resp.json();
      const userInfo = {
        name: userData.name || userData.fullName || userData.displayName || 'Unknown User',
        role: userData.role || userData.position || userData.title || 'Unknown Role',
        email: userData.email,
      };
      userCache[userId] = userInfo;
      return { id: userId, ...userInfo };
    } else if (resp.status === 404) {
      // User endpoint doesn't exist or user not found - use fallback
      console.warn(`User ${userId} not found, using fallback`);
    }
  } catch (err) {
    console.warn(`Failed to fetch user info for ${userId}:`, err);
  }

  // Fallback - use a generic name based on the supervisor status
  const isSupervisor = userId === import.meta.env.VITE_SUPERVISOR_USER_ID;
  const fallbackInfo = {
    name: isSupervisor ? 'Supervisor' : 'Team Member',
    role: isSupervisor ? 'Manager' : 'Employee',
  };
  
  userCache[userId] = fallbackInfo;
  return { id: userId, ...fallbackInfo };
}

/**
 * Fetch user's key results
 * Endpoint: /key-results?userId={user_id}
 */
export async function fetchUserKeyResults(userId: string): Promise<KeyResult[]> {
  const tenantId = import.meta.env.VITE_TENANT_ID;
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!userId || !tenantId || !baseUrl) {
    throw new Error('Missing userId, tenantId, or baseUrl');
  }

  const token = await getAuthToken();
  const url = `${baseUrl}/key-results?userId=${userId}`;

  try {
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        tenantId,
        userId,
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Fetch user KRs failed (${resp.status}): ${text}`);
    }

    const data = await resp.json();
    console.log('User Key Results:', data);

    // Handle different response structures
    let keyResultsArray: any[] = [];
    
    if (Array.isArray(data)) {
      keyResultsArray = data;
    } else if (data.keyResults?.items && Array.isArray(data.keyResults.items)) {
      keyResultsArray = data.keyResults.items;
    } else if (data.keyResults && Array.isArray(data.keyResults)) {
      keyResultsArray = data.keyResults;
    } else if (data.items && Array.isArray(data.items)) {
      keyResultsArray = data.items;
    } else {
      keyResultsArray = [];
    }

    // Map to our KeyResult interface
    const keyResults: KeyResult[] = await Promise.all(
      keyResultsArray.map(async (kr: any) => {
        const ownerId = kr.userId || kr.objective?.userId || userId;
        const ownerInfo = await fetchUserInfo(ownerId);

        return {
          id: kr.id || kr.keyResultId,
          title: kr.title || kr.keyResult || 'Untitled Key Result',
          owner: ownerInfo,
          objective: kr.objective?.title || kr.objectiveTitle || 'Untitled Objective',
        };
      })
    );

    return keyResults;
  } catch (err) {
    console.error('Error fetching user key results:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Fetch supervisor's key results
 * Endpoint: /key-results/user/{supervisor_user_id}
 */
export async function fetchSupervisorKeyResults(supervisorUserId: string): Promise<KeyResult[]> {
  const tenantId = import.meta.env.VITE_TENANT_ID;
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!supervisorUserId || !tenantId || !baseUrl) {
    console.warn('Missing supervisorUserId, tenantId, or baseUrl');
    return [];
  }

  const token = await getAuthToken();
  const url = `${baseUrl}/key-results/user/${supervisorUserId}`;

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
      throw new Error(`Fetch supervisor KRs failed (${resp.status}): ${text}`);
    }

    const data = await resp.json();
    console.log('🔍 Raw Supervisor Key Results Response:', JSON.stringify(data, null, 2));

    // Handle different response structures
    let keyResultsArray: any[] = [];
    
    if (Array.isArray(data)) {
      keyResultsArray = data;
    } else if (data.keyResults?.items && Array.isArray(data.keyResults.items)) {
      // Response structure: { keyResults: { items: [...] } }
      keyResultsArray = data.keyResults.items;
    } else if (data.keyResults && Array.isArray(data.keyResults)) {
      keyResultsArray = data.keyResults;
    } else if (data.items && Array.isArray(data.items)) {
      keyResultsArray = data.items;
    } else if (data.data && Array.isArray(data.data)) {
      keyResultsArray = data.data;
    } else if (typeof data === 'object') {
      // Maybe it's a single object, wrap it in an array
      keyResultsArray = [data];
    }

    console.log('📊 Parsed key results array:', keyResultsArray.length, 'items');

    if (keyResultsArray.length === 0) {
      console.warn('⚠️ No key results found in response');
      return [];
    }

    // Map to our KeyResult interface
    const keyResults: KeyResult[] = await Promise.all(
      keyResultsArray.map(async (kr: any, index: number) => {
        console.log(`Processing KR ${index + 1}:`, kr);
        
        const ownerInfo = await fetchUserInfo(supervisorUserId);

        // Try multiple field names for the key result title
        const title = kr.title || kr.keyResult || kr.name || kr.description || `Key Result ${index + 1}`;
        const id = kr.id || kr.keyResultId || kr._id || `kr-${supervisorUserId}-${index}`;
        const objective = kr.objective?.title || kr.objectiveTitle || kr.objective || 'Untitled Objective';

        return {
          id,
          title,
          owner: ownerInfo,
          objective,
        };
      })
    );

    console.log('✅ Final processed key results:', keyResults.length, 'items');
    console.log('Titles:', keyResults.map(kr => kr.title));

    return keyResults;
  } catch (err) {
    console.error('❌ Error fetching supervisor key results:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Fetch user's weekly plans
 * Endpoint: /weekly-plans?userId={user_id}
 */
export async function fetchWeeklyPlans(userId: string): Promise<any[]> {
  const tenantId = import.meta.env.VITE_TENANT_ID;
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!userId || !tenantId || !baseUrl) {
    throw new Error('Missing userId, tenantId, or baseUrl');
  }

  const token = await getAuthToken();
  const url = `${baseUrl}/weekly-plans?userId=${userId}`;

  try {
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        tenantId,
        userId,
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Fetch weekly plans failed (${resp.status}): ${text}`);
    }

    const data = await resp.json();
    console.log('Weekly Plans:', data);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching weekly plans:', err instanceof Error ? err.message : String(err));
    return [];
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

    // Pre-fetch all unique user IDs
    const uniqueUserIds = [...new Set(uniqueTasks.map(t => t.keyResult.objective.userId))];
    await Promise.all(uniqueUserIds.map(id => fetchUserInfo(id)));

    uniqueTasks.forEach((apiTask, index) => {
      const krId = apiTask.keyResultId;
      const objUserId = apiTask.keyResult.objective.userId;
      const userInfo = userCache[objUserId] || { name: 'Unknown', role: 'Unknown' };

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

// 🚀 Backend API integration using /okr endpoint
export async function generateKeyResults(objective: string): Promise<OkrSuggestResponse> {
  try {
    const resp = await fetch(`/api/backend/okr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objective }),
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

// 🔄 Unified entry point using /copilot endpoint
export async function askOkrModel({ prompt, context, params }: OkrSuggestParams): Promise<OkrSuggestResponse> {
  try {
    const resp = await fetch(`/api/backend/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: prompt }),
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

// ✅ Generate weekly tasks from Key Result using /weekly-plan endpoint
export async function generateWeeklyTasksFromKR(keyResultId: string) {
  const resp = await fetch(`/api/backend/weekly-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

// ✅ Generate daily tasks from Weekly Plan using /daily-plan endpoint
export async function generateDailyTasksFromWeekly(weeklyPlanIdOrKR: string) {
  const resp = await fetch(`/api/backend/daily-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weekly_plan: weeklyPlanIdOrKR }),
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
