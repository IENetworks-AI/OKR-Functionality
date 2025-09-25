import { aiService } from "@/services/aiService";

export type GeneratedKR = {
  id: string;
  title: string;
  progress: number;
  metricType: "milestone" | "percentage" | "numeric" | "currency" | "achieved";
  targetValue: number;
  currentValue: number;
  weight: number;
  completed: boolean;
  description?: string;
  milestones?: {
    id: string;
    title: string;
    completed: boolean;
    weight: number;
  }[];
};

export async function generateAIObjectiveAndKeyResults(
  input: string,
  isAlignment: boolean = false,
  context?: {
    department?: string;
    role?: string;
    timeframe?: string;
    priority?: 'high' | 'medium' | 'low';
  }
): Promise<{ title: string; keyResults: GeneratedKR[]; confidence?: number }> {
  try {
    const request = {
      objective: input,
      context: {
        department: context?.department || 'general',
        role: context?.role || 'employee',
        timeframe: context?.timeframe || 'quarterly',
        priority: context?.priority || 'medium',
      },
      type: isAlignment ? 'objective' as const : 'key_results' as const,
    };

    const response = await aiService.generateOKR(request);

    if (!response.success) {
      console.error("AI Service Error:", response.error);
      return { title: input, keyResults: [], confidence: 0 };
    }

    const data = response.data;
    let title = input;
    let keyResults: GeneratedKR[] = [];

    // Extract title and key results from response
    if (isAlignment && data?.answer?.objective) {
      title = data.answer.objective;
    }

    // Extract key results from various possible response formats
    let aiKRs: any[] = [];
    
    if (data?.answer?.key_results) {
      aiKRs = data.answer.key_results;
    } else if (Array.isArray(data?.answer)) {
      aiKRs = data.answer;
    } else if (data?.answer?.["Key Results"]) {
      aiKRs = data.answer["Key Results"];
    } else if (Array.isArray(data?.suggestion)) {
      aiKRs = data.suggestion;
    }

    if (Array.isArray(aiKRs) && aiKRs.length > 0) {
      keyResults = aiKRs.map((kr: any, index: number) => {
        const baseKR: GeneratedKR = {
          id: `ai-${Date.now()}-${index}`,
          title: kr.title || `Key Result ${index + 1}`,
          progress: 0,
          metricType: kr.metric_type || kr.metricType || "numeric",
          targetValue: kr.target_value ?? kr.targetValue ?? 100,
          currentValue: kr.initial_value ?? kr.currentValue ?? 0,
          weight: kr.weight ?? Math.round(100 / aiKRs.length),
          completed: false,
          description: kr.description || kr.rationale,
        };

        // Handle milestone type
        if (baseKR.metricType === "milestone" && (kr.milestones || kr.sub_milestones)) {
          const milestones = kr.milestones || kr.sub_milestones || [];
          return {
            ...baseKR,
            milestones: milestones.map((m: any, mIndex: number) => ({
              id: `m-${Date.now()}-${index}-${mIndex}`,
              title: m.title || `Milestone ${mIndex + 1}`,
              completed: false,
              weight: m.weight || Math.round(baseKR.weight / milestones.length),
            })),
          };
        }

        return baseKR;
      });

      // Normalize weights to ensure they sum to 100
      const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
      if (totalWeight !== 100) {
        const factor = 100 / totalWeight;
        keyResults = keyResults.map(kr => ({
          ...kr,
          weight: Math.round(kr.weight * factor),
        }));
      }
    }

    return { 
      title, 
      keyResults, 
      confidence: response.confidence || 0.8 
    };
  } catch (error) {
    console.error("OKR Generation Error:", error);
    return { 
      title: input, 
      keyResults: [], 
      confidence: 0 
    };
  }
}

// Enhanced function for generating tasks
export async function generateAITasks(
  keyResult: string,
  planType: 'daily' | 'weekly',
  context?: {
    complexity?: 'simple' | 'medium' | 'complex';
    duration?: string;
    resources?: string[];
  }
): Promise<{ tasks: any[]; confidence?: number }> {
  try {
    const request = {
      keyResult,
      planType,
      context: {
        complexity: context?.complexity || 'medium',
        duration: context?.duration || (planType === 'daily' ? '1 day' : '1 week'),
        resources: context?.resources || [],
      },
    };

    const response = await aiService.generateTasks(request);

    if (!response.success) {
      console.error("Task Generation Error:", response.error);
      return { tasks: [], confidence: 0 };
    }

    const data = response.data;
    let tasks: any[] = [];

    // Extract tasks from various possible response formats
    if (data?.answer?.[`${planType}_tasks`]) {
      tasks = data.answer[`${planType}_tasks`];
    } else if (data?.answer?.tasks) {
      tasks = data.answer.tasks;
    } else if (Array.isArray(data?.answer)) {
      tasks = data.answer;
    } else if (Array.isArray(data?.suggestion)) {
      tasks = data.suggestion;
    }

    // Normalize task structure
    const normalizedTasks = tasks.map((task: any, index: number) => ({
      id: `task-${Date.now()}-${index}`,
      title: task.title || `Task ${index + 1}`,
      priority: task.priority || 'Medium',
      target: task.target || 100,
      weight: task.weight || Math.round(100 / tasks.length),
      description: task.description || '',
      estimatedDuration: task.estimated_duration || task.duration,
    }));

    return { 
      tasks: normalizedTasks, 
      confidence: response.confidence || 0.8 
    };
  } catch (error) {
    console.error("Task Generation Error:", error);
    return { 
      tasks: [], 
      confidence: 0 
    };
  }
}