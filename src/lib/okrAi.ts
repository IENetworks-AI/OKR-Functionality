import { askOkrModel } from "@/lib/ai";

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

    const { suggestion, error } = await askOkrModel({
      prompt,
      params: { temperature: 0.3 },
    });

    if (error) {
      console.error("AI Error:", error);
      return { title: input, keyResults: [] };
    }

    // Extract JSON from potential markdown fencing
    let jsonStr = String(suggestion).replace(/```json\s*/, '').replace(/```\s*$/, '');
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const response = JSON.parse(jsonStr);
    const title = isAlignment ? (response.objective || input) : input;
    const aiKRs = (response.key_results) || [];

    if (!Array.isArray(aiKRs)) return { title, keyResults: [] };

    const keyResults: GeneratedKR[] = aiKRs.map((kr: any, index: number) => {
      const baseKR: GeneratedKR = {
        id: `ai-${Date.now()}-${index}`,
        title: kr.title || "Untitled",
        progress: 0,
        metricType: kr.metric_type || "numeric",
        targetValue: kr.target_value || 100,
        currentValue: 0,
        weight: kr.weight || Math.round(100 / (aiKRs.length || 1)),
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