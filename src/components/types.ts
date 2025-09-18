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