// src/types/index.ts

export interface KeyResult {
  id: string;
  title: string;
  owner: Employee;
  objective: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  target: number;
  achieved: number;
  krProgress: number;
  priority: 'High' | 'Medium' | 'Low';
  weight: number;
  parentTaskId?: string; // For daily tasks linked to weekly tasks
  status?: string;
}

// API Task format for backend integration
export interface ApiTaskCreate {
  task: string;
  priority: string;
  targetValue: number;
  weight: number;
  keyResultId: string;
  planId: string;
  parentTaskId?: string;
}

// Plan creation payload
export interface PlanCreatePayload {
  keyResultId: string;
  planType: 'Daily' | 'Weekly';
  tasks: ApiTaskCreate[];
}

export interface Plan {
  id: string;
  keyResultId: string;
  date: string;
  status: 'Active' | 'Closed' | 'Pending' | 'Open';
  tasks: Task[];
  achieved: number;
  progress: number;
}

export interface WeeklyTask {
  id: string;
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  weight: number;
}

export interface WeeklyPlan {
  id: string;
  keyResultId: string;
  date: string;
  status: 'Active' | 'Closed' | 'Pending' | 'Open';
  tasks: WeeklyTask[];
}

// OKR Modal Types
export interface OKRData {
  objective: string;
  alignment: string;
  deadline?: Date;
  keyResults: OKRKeyResult[];
}

export interface OKRKeyResult {
  id: string;
  text: string;
  progress: number;
  milestones: Milestone[];
  isAI?: boolean;
  weight: number;
  deadline?: Date;
}

export interface Milestone {
  id: string;
  text: string;
  completed: boolean;
}

// AI API Types
export interface AITask {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  target: number;
  weight: number;
}

export interface OkrSuggestParams {
  prompt: string;
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export interface OkrSuggestResponse {
  suggestion: string | unknown;
  raw?: unknown;
  error?: string;
}
