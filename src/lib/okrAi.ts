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
      console.error("Response data:", response.data);
      return { title: input, keyResults: [], confidence: 0 };
    }

    const data = response.data;
    let title = input;
    let keyResults: GeneratedKR[] = [];

    console.log("Processing AI response data:", data);

    // Extract title and key results from response
    if (isAlignment && data?.answer?.objective) {
      title = data.answer.objective;
    }

    // Extract key results from backend response format
    // Expected format from /okr endpoint: {"answer": {"Key Results": [...]}}
    let aiKRs: any[] = [];
    
    // Handle the SelamNew AI API response format
    if (data?.answer?.["Key Results"]) {
      aiKRs = data.answer["Key Results"];
    } else if (data?.["Key Results"]) {
      // Direct format without answer wrapper
      aiKRs = data["Key Results"];
    } else if (data?.answer?.key_results) {
      aiKRs = data.answer.key_results;
    } else if (Array.isArray(data?.answer)) {
      aiKRs = data.answer;
    } else if (data?.key_results) {
      aiKRs = data.key_results;
    } else if (Array.isArray(data?.suggestion)) {
      aiKRs = data.suggestion;
    } else if (data?.answer && typeof data.answer === 'object') {
      // Fallback: look for any array property in the answer
      const possibleArrays = Object.values(data.answer).filter(Array.isArray);
      if (possibleArrays.length > 0) {
        aiKRs = possibleArrays[0] as any[];
      }
    }

    console.log("✅ Extracted key results array:", aiKRs);
    console.log("📊 Number of key results:", aiKRs.length);

    if (Array.isArray(aiKRs) && aiKRs.length > 0) {
      console.log("🔍 Processing key results from backend...");
      keyResults = aiKRs.map((kr: any, index: number) => {
        // Normalize metric type from API
        let metricType = kr.metric_type || kr.metricType || "numeric";
        
        // Map common variations to our standard types
        const metricTypeMap: { [key: string]: string } = {
          "achieved": "achieved",
          "milestone": "milestone", 
          "percentage": "percentage",
          "percent": "percentage",
          "numeric": "numeric",
          "number": "numeric",
          "currency": "currency",
          "money": "currency"
        };
        
        metricType = metricTypeMap[metricType.toLowerCase()] || "numeric";
        
        // Convert weight from decimal to percentage if needed (e.g., 0.3 -> 30)
        let weight = kr.weight ?? Math.round(100 / aiKRs.length);
        if (weight > 0 && weight < 1) {
          weight = Math.round(weight * 100);
        }
        
        const baseKR: GeneratedKR = {
          id: `ai-${Date.now()}-${index}`,
          title: kr.title || `Key Result ${index + 1}`,
          progress: 0,
          metricType: metricType as "milestone" | "percentage" | "numeric" | "currency" | "achieved",
          targetValue: kr.target_value ?? kr.targetValue ?? 100,
          currentValue: kr.initial_value ?? kr.currentValue ?? 0,
          weight: weight,
          completed: false,
          description: kr.description || kr.rationale,
        };

        console.log(`📝 KR ${index + 1}:`, {
          title: baseKR.title,
          metricType: baseKR.metricType,
          weight: baseKR.weight,
          currentValue: baseKR.currentValue,
          targetValue: baseKR.targetValue,
          raw: kr
        });

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
      console.log(`⚖️  Total weight before normalization: ${totalWeight}%`);
      
      if (totalWeight !== 100 && totalWeight > 0) {
        console.log(`🔄 Normalizing weights to sum to 100%...`);
        const factor = 100 / totalWeight;
        keyResults = keyResults.map((kr, idx) => ({
          ...kr,
          weight: idx === keyResults.length - 1 
            ? 100 - keyResults.slice(0, -1).reduce((sum, k) => sum + Math.round(k.weight * factor), 0)
            : Math.round(kr.weight * factor),
        }));
        
        const finalTotal = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
        console.log(`✅ Total weight after normalization: ${finalTotal}%`);
      }
      
      console.log("🎯 Final key results:", keyResults.map(kr => ({
        title: kr.title,
        metricType: kr.metricType,
        weight: kr.weight + '%',
        currentValue: kr.currentValue,
        targetValue: kr.targetValue
      })));
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

    // Extract tasks from backend response format
    // Expected format from /weekly-plan: {'weekly_plan': {'WeeklyTasks': [...]}}
    // Expected format from /daily-plan: {'daily_plan': {'DailyTasks': [...]}}
    const planKey = `${planType}_plan`;
    const tasksKey = planType === 'weekly' ? 'WeeklyTasks' : 'DailyTasks';
    
    if (data?.[planKey]?.[tasksKey]) {
      tasks = data[planKey][tasksKey];
    } else if (data?.answer?.[planKey]?.[tasksKey]) {
      tasks = data.answer[planKey][tasksKey];
    } else if (data?.[tasksKey]) {
      // Direct format without nested structure
      tasks = data[tasksKey];
    } else if (data?.answer?.[`${planType}_tasks`]) {
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