import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Objective {
  id: string;
  title: string;
  alignment: string;
  deadline?: Date;
  keyResults: KeyResult[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'completed' | 'archived';
}

export interface KeyResult {
  id: string;
  title: string;
  metricType: "milestone" | "percentage" | "numeric" | "currency" | "achieved";
  targetValue: number;
  currentValue: number;
  weight: number;
  completed: boolean;
  description?: string;
  milestones?: Milestone[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  weight: number;
  completedAt?: Date;
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
  parentTaskId?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface Plan {
  id: string;
  keyResultId: string;
  date: string;
  status: 'Active' | 'Closed' | 'Pending' | 'Open';
  tasks: Task[];
  achieved: number;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

interface OKRState {
  // Data
  objectives: Objective[];
  plans: Plan[];
  selectedObjective: Objective | null;
  selectedPlan: Plan | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  activeTab: string;
  filters: {
    status: string[];
    metricType: string[];
    dateRange: { start: Date | null; end: Date | null };
  };
  
  // Actions
  setObjectives: (objectives: Objective[]) => void;
  addObjective: (objective: Objective) => void;
  updateObjective: (id: string, updates: Partial<Objective>) => void;
  deleteObjective: (id: string) => void;
  setSelectedObjective: (objective: Objective | null) => void;
  
  setPlans: (plans: Plan[]) => void;
  addPlan: (plan: Plan) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
  setSelectedPlan: (plan: Plan | null) => void;
  
  updateKeyResult: (objectiveId: string, keyResultId: string, updates: Partial<KeyResult>) => void;
  updateTask: (planId: string, taskId: string, updates: Partial<Task>) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: string) => void;
  updateFilters: (filters: Partial<OKRState['filters']>) => void;
  
  // Computed values
  getObjectiveProgress: (objectiveId: string) => number;
  getKeyResultProgress: (objectiveId: string, keyResultId: string) => number;
  getFilteredObjectives: () => Objective[];
  getFilteredPlans: () => Plan[];
  
  // Reset
  reset: () => void;
}

const initialState = {
  objectives: [],
  plans: [],
  selectedObjective: null,
  selectedPlan: null,
  isLoading: false,
  error: null,
  activeTab: 'My OKR',
  filters: {
    status: [],
    metricType: [],
    dateRange: { start: null, end: null },
  },
};

export const useOKRStore = create<OKRState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Objective actions
        setObjectives: (objectives) => set({ objectives }),
        
        addObjective: (objective) => set((state) => ({
          objectives: [...state.objectives, objective]
        })),
        
        updateObjective: (id, updates) => set((state) => ({
          objectives: state.objectives.map(obj => 
            obj.id === id 
              ? { ...obj, ...updates, updatedAt: new Date() }
              : obj
          )
        })),
        
        deleteObjective: (id) => set((state) => ({
          objectives: state.objectives.filter(obj => obj.id !== id),
          selectedObjective: state.selectedObjective?.id === id ? null : state.selectedObjective
        })),
        
        setSelectedObjective: (objective) => set({ selectedObjective: objective }),
        
        // Plan actions
        setPlans: (plans) => set({ plans }),
        
        addPlan: (plan) => set((state) => ({
          plans: [...state.plans, plan]
        })),
        
        updatePlan: (id, updates) => set((state) => ({
          plans: state.plans.map(plan => 
            plan.id === id 
              ? { ...plan, ...updates, updatedAt: new Date() }
              : plan
          )
        })),
        
        deletePlan: (id) => set((state) => ({
          plans: state.plans.filter(plan => plan.id !== id),
          selectedPlan: state.selectedPlan?.id === id ? null : state.selectedPlan
        })),
        
        setSelectedPlan: (plan) => set({ selectedPlan: plan }),
        
        // Key Result actions
        updateKeyResult: (objectiveId, keyResultId, updates) => set((state) => ({
          objectives: state.objectives.map(obj => 
            obj.id === objectiveId 
              ? {
                  ...obj,
                  keyResults: obj.keyResults.map(kr => 
                    kr.id === keyResultId 
                      ? { ...kr, ...updates, updatedAt: new Date() }
                      : kr
                  ),
                  updatedAt: new Date()
                }
              : obj
          )
        })),
        
        // Task actions
        updateTask: (planId, taskId, updates) => set((state) => ({
          plans: state.plans.map(plan => 
            plan.id === planId 
              ? {
                  ...plan,
                  tasks: plan.tasks.map(task => 
                    task.id === taskId 
                      ? { ...task, ...updates, updatedAt: new Date() }
                      : task
                  ),
                  updatedAt: new Date()
                }
              : plan
          )
        })),
        
        // UI actions
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        setActiveTab: (tab) => set({ activeTab: tab }),
        updateFilters: (newFilters) => set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),
        
        // Computed values
        getObjectiveProgress: (objectiveId) => {
          const state = get();
          const objective = state.objectives.find(obj => obj.id === objectiveId);
          if (!objective || !objective.keyResults.length) return 0;
          
          const totalWeight = objective.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
          if (totalWeight === 0) return 0;
          
          const weightedProgress = objective.keyResults.reduce((sum, kr) => {
            const progress = state.getKeyResultProgress(objectiveId, kr.id);
            return sum + (progress * kr.weight);
          }, 0);
          
          return Math.round(weightedProgress / totalWeight);
        },
        
        getKeyResultProgress: (objectiveId, keyResultId) => {
          const state = get();
          const objective = state.objectives.find(obj => obj.id === objectiveId);
          const keyResult = objective?.keyResults.find(kr => kr.id === keyResultId);
          
          if (!keyResult) return 0;
          
          if (keyResult.metricType === "milestone" || keyResult.metricType === "achieved") {
            return keyResult.completed ? 100 : 0;
          }
          
          if (keyResult.targetValue === 0) return 0;
          
          return Math.min(100, Math.round((keyResult.currentValue / keyResult.targetValue) * 100));
        },
        
        getFilteredObjectives: () => {
          const state = get();
          let filtered = state.objectives;
          
          if (state.filters.status.length > 0) {
            filtered = filtered.filter(obj => state.filters.status.includes(obj.status));
          }
          
          if (state.filters.metricType.length > 0) {
            filtered = filtered.filter(obj => 
              obj.keyResults.some(kr => state.filters.metricType.includes(kr.metricType))
            );
          }
          
          if (state.filters.dateRange.start || state.filters.dateRange.end) {
            filtered = filtered.filter(obj => {
              if (!obj.deadline) return true;
              const deadline = new Date(obj.deadline);
              const start = state.filters.dateRange.start;
              const end = state.filters.dateRange.end;
              
              if (start && deadline < start) return false;
              if (end && deadline > end) return false;
              return true;
            });
          }
          
          return filtered;
        },
        
        getFilteredPlans: () => {
          const state = get();
          let filtered = state.plans;
          
          if (state.filters.status.length > 0) {
            filtered = filtered.filter(plan => state.filters.status.includes(plan.status));
          }
          
          return filtered;
        },
        
        reset: () => set(initialState),
      }),
      {
        name: 'okr-store',
        partialize: (state) => ({
          objectives: state.objectives,
          plans: state.plans,
          filters: state.filters,
        }),
      }
    ),
    {
      name: 'okr-store',
    }
  )
);
