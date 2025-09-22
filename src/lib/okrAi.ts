import { generateKeyResults } from "@/lib/okrApi";

export type GeneratedKR = {
  id: string;
  title: string;
  progress: number;
  metricType: "milestone" | "percentage" | "numeric" | "currency" | "achieved";
  targetValue: number;
  currentValue: number;
  weight: number;
  completed: boolean;
  milestones?: {
    id: string;
    title: string;
    completed: boolean;
    weight: number;
  }[];
};

export async function generateAIObjectiveAndKeyResults(
  input: string,
  isAlignment: boolean = false
): Promise<{ title: string; keyResults: GeneratedKR[] }> {
  try {
    let prompt: string;
    if (isAlignment) {
      prompt = `Generate an objective title and 3-4 key results for an employee that contribute to the supervisor's key result: "${input}". 
For each key result, provide:
1. A title
2. A weight (sum of all weights should be 100)
3. A metric type (milestone, percentage, numeric, currency, achieved)
4. If numeric/percentage/currency: target_value (initial_value is 0)
5. If milestone: list of milestones with their titles and weights (sum to key result weight)

Return a JSON object with this structure:
{
  "objective": "Objective title",
  "key_results": [
    {
      "title": "Key result title",
      "weight": 25,
      "metric_type": "milestone",
      "milestones": [
        {"title": "Milestone 1", "weight": 10},
        {"title": "Milestone 2", "weight": 15}
      ]
    },
    {
      "title": "Key result title",
      "weight": 35,
      "metric_type": "numeric",
      "target_value": 100
    },
    {
      "title": "Key result title",
      "weight": 40,
      "metric_type": "percentage",
      "target_value": 90
    }
  ]
}`;
    } else {
      prompt = `Generate 3-4 key results for the objective: "${input}". 
For each key result, provide:
1. A title
2. A weight (sum of all weights should be 100)
3. A metric type (milestone, percentage, numeric, currency, achieved)
4. If numeric/percentage/currency: target_value (initial_value is 0)
5. If milestone: list of milestones with their titles and weights (sum to key result weight)

Return a JSON object with this structure:
{
  "key_results": [
    {
      "title": "Key result title",
      "weight": 25,
      "metric_type": "milestone",
      "milestones": [
        {"title": "Milestone 1", "weight": 10},
        {"title": "Milestone 2", "weight": 15}
      ]
    },
    {
      "title": "Key result title",
      "weight": 35,
      "metric_type": "numeric",
      "target_value": 100
    },
    {
      "title": "Key result title",
      "weight": 40,
      "metric_type": "percentage",
      "target_value": 90
    }
  ]
}`;
    }

    const { suggestion, error, raw } = await generateKeyResults(input);

    if (error) {
      console.error("Backend API Error:", error);
      return { title: input, keyResults: [] };
    }

    const title = input;

    // The backend sometimes wraps the JSON in fenced code blocks; extract the first JSON array if needed
    const extractFirstJsonArray = (rawAnswer: any): any[] => {
      if (Array.isArray(rawAnswer)) return rawAnswer;
      if (typeof rawAnswer !== 'string') return [];
      const cleaned = rawAnswer.replace(/```json/gi, '').replace(/```/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*?\]/);
      if (!match) return [];
      try {
        const parsed = JSON.parse(match[0]);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    // Prefer structured array under answer["Key Results"], else parse from answer string
    let aiKRs: any[] = [];
    if (Array.isArray((raw as any)?.answer?.["Key Results"])) {
      aiKRs = (raw as any).answer["Key Results"];
    } else if (Array.isArray(suggestion)) {
      aiKRs = suggestion;
    } else {
      aiKRs = extractFirstJsonArray((raw as any)?.answer ?? suggestion);
    }

    if (!Array.isArray(aiKRs)) return { title, keyResults: [] };

    const keyResults: GeneratedKR[] = aiKRs.map((kr: any, index: number) => {
      const baseKR: GeneratedKR = {
        id: `ai-${Date.now()}-${index}`,
        title: kr.title || "Untitled",
        progress: 0,
        metricType: kr.metric_type || "numeric",
        targetValue: kr.target_value ?? 100,
        currentValue: kr.initial_value ?? 0,
        weight: kr.weight ?? Math.round(100 / (aiKRs.length || 1)),
        completed: false,
      };

      if (kr.metric_type === "milestone" && Array.isArray(kr.milestones)) {
        return {
          ...baseKR,
          metricType: "milestone",
          milestones: kr.milestones.map((m: any, mIndex: number) => ({
            id: `m-${Date.now()}-${index}-${mIndex}`,
            title: m.title || `Milestone ${mIndex + 1}`,
            completed: false,
            weight: m.weight || Math.round(baseKR.weight / (kr.milestones.length || 1)),
          })),
        };
      }

      return baseKR;
    });

    return { title, keyResults };
  } catch (parseError) {
    console.error("Parse error:", parseError);
    return { title: input, keyResults: [] };
  }
}