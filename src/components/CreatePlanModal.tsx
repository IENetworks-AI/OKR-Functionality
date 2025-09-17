import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Sparkles, Loader2 } from "lucide-react";
import { askOkrModel } from "@/lib/ai";

// --- Interfaces to match PlanningDashboard ---
interface KeyResult {
  id: string;
  title: string;
}

interface WeeklyTask {
  id: string;
  title: string;
  description?: string;
  priority: "High" | "Medium" | "Low";
  weight: number;
}

interface WeeklyPlan {
  id: string;
  keyResultId: string;
  date: string;
  status: "Active" | "Closed" | "Pending" | "Open";
  tasks: WeeklyTask[];
}

interface CreatePlanModalProps {
  open: boolean;
  onClose: () => void;
  planType: "Daily" | "Weekly";
  keyResults: KeyResult[];
  weeklyPlans?: WeeklyPlan[]; // Add weekly plans prop
}

interface Task {
  id: string; // Use string for unique ID
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  target: number;
  weight: number;
}

// --- AI Simulation ---
// This function simulates an AI generating tasks based on a Key Result title.
// In a real application, this would be an API call to a language model.
// For now, using dummy data as per request. Later, replace with model API call like:
// const prompt = `Generate tasks for ${planType} plan based on key result: ${krTitle}. Return JSON array of {title, description, priority, target, weight}`;
// const response = await askOkrModel(prompt);
// return parse JSON from response.
const generateAiTasksForKeyResult = (krTitle: string, planType: "Daily" | "Weekly"): Omit<Task, 'id'>[] => {
  const lowerCaseTitle = krTitle.toLowerCase();
  
  if (lowerCaseTitle.includes("data readiness")) {
    return [
      { title: "Validate and clean raw data sources for model training", description: "Run validation scripts on source data.", priority: "High", target: 100, weight: 40 },
      { title: "Align data schema with AI/ML engineer requirements", description: "Hold a sync meeting with the ML team to confirm schema.", priority: "High", target: 100, weight: 30 },
      { title: "Perform exploratory data analysis (EDA) to identify patterns", description: "Generate notebooks with key findings.", priority: "Medium", target: 100, weight: 30 },
    ];
  }
  if (lowerCaseTitle.includes("data ingestion")) {
    return [
      { title: "Set up data ingestion pipeline for 2 new features", description: "Configure Airflow DAGs for new data sources.", priority: "High", target: 100, weight: 60 },
      { title: "Implement data quality checks within the ingestion process", description: "Use Great Expectations for data validation.", priority: "Medium", target: 100, weight: 40 },
    ];
  }
  if (lowerCaseTitle.includes("deploy new ml model")) {
    return [
        { title: "Run pre-deployment tests on staging environment", description: "Execute integration and performance tests.", priority: "High", target: 100, weight: 50 },
        { title: "Configure production environment monitoring and alerts", description: "Set up Datadog dashboards for model drift and latency.", priority: "Medium", target: 100, weight: 30 },
        { title: "Complete final code review and merge to main branch", description: "Get sign-off from lead ML engineer.", priority: "Medium", target: 100, weight: 20 },
    ];
  }
  // Default fallback
  return [{ title: "", description: "", priority: "Medium", target: 100, weight: 100 }];
};

export function CreatePlanModal({ open, onClose, planType, keyResults, weeklyPlans = [] }: CreatePlanModalProps) {
  const [selectedKeyResultId, setSelectedKeyResultId] = useState("");
  const [selectedWeeklyTaskId, setSelectedWeeklyTaskId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isGeneratingFromWeekly, setIsGeneratingFromWeekly] = useState(false);

  // Get available weekly tasks for the selected key result
  const availableWeeklyTasks = selectedKeyResultId 
    ? weeklyPlans
        .filter(plan => plan.keyResultId === selectedKeyResultId)
        .flatMap(plan => plan.tasks)
    : [];

  // Function to generate daily tasks from weekly task using AI
  const generateDailyTasksFromWeekly = async (weeklyTask: WeeklyTask) => {
    if (!selectedKeyResultId) return;
    
    setIsGeneratingFromWeekly(true);
    try {
      const selectedKR = keyResults.find(kr => kr.id === selectedKeyResultId);
      const prompt = `Break down this weekly task into specific daily tasks for today. Return a JSON array of tasks with the format: [{"title": "task title", "description": "task description", "priority": "High|Medium|Low", "target": 100, "weight": number}].

Weekly Task: ${weeklyTask.title}
Description: ${weeklyTask.description || "No description"}
Key Result: ${selectedKR?.title}
Priority: ${weeklyTask.priority}

Generate 2-4 specific, actionable daily tasks that contribute to completing this weekly task. Each task should be measurable and achievable in one day. Make sure the weights add up to 100.`;

      const { suggestion, error } = await askOkrModel({
        prompt,
        context: {
          source: "daily-from-weekly",
          krId: selectedKeyResultId,
          weeklyTaskId: weeklyTask.id,
        },
        params: { temperature: 0.3 },
      });

      if (error) {
        console.error("AI Error:", error);
        // Fallback to manual task creation
        setTasks([{ 
          id: crypto.randomUUID(), 
          title: `Daily task for: ${weeklyTask.title}`, 
          description: weeklyTask.description || "", 
          priority: weeklyTask.priority, 
          target: 100, 
          weight: 100 
        }]);
        return;
      }

      // Try to parse the AI response as JSON
      try {
        // Clean the response to extract JSON (handle markdown code blocks)
        let jsonStr = suggestion;
        
        // Remove markdown code blocks if present
        jsonStr = jsonStr.replace(/```json\s*/, '').replace(/```\s*$/, '');
        
        // Extract JSON array
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        
        const aiTasks = JSON.parse(jsonStr);
        if (Array.isArray(aiTasks) && aiTasks.length > 0) {
          const tasksWithIds = aiTasks.map((task: any) => ({
            id: crypto.randomUUID(),
            title: task.title || "Untitled Task",
            description: task.description || "",
            priority: task.priority || "Medium",
            target: task.target || 100,
            weight: task.weight || 25,
          }));
          setTasks(tasksWithIds);
        } else {
          throw new Error("Invalid AI response format");
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        // Fallback: create tasks from AI text response
        const lines = suggestion.split('\n').filter(line => line.trim().startsWith('*') || line.trim().startsWith('-'));
        if (lines.length > 0) {
          const tasksFromText = lines.slice(0, 4).map((line, index) => ({
            id: crypto.randomUUID(),
            title: line.replace(/^[\*\-\s]+/, '').trim(),
            description: `Generated from weekly task: ${weeklyTask.title}`,
            priority: weeklyTask.priority,
            target: 100,
            weight: Math.round(100 / lines.length),
          }));
          setTasks(tasksFromText);
        } else {
          // Final fallback
          setTasks([{ 
            id: crypto.randomUUID(), 
            title: `Daily task for: ${weeklyTask.title}`, 
            description: weeklyTask.description || "", 
            priority: weeklyTask.priority, 
            target: 100, 
            weight: 100 
          }]);
        }
      }
    } catch (error) {
      console.error("Error generating daily tasks:", error);
      // Fallback task
      setTasks([{ 
        id: crypto.randomUUID(), 
        title: `Daily task for: ${weeklyTask.title}`, 
        description: weeklyTask.description || "", 
        priority: weeklyTask.priority, 
        target: 100, 
        weight: 100 
      }]);
    } finally {
      setIsGeneratingFromWeekly(false);
    }
  };

  // Handle weekly task selection
  const handleWeeklyTaskSelection = (taskId: string) => {
    setSelectedWeeklyTaskId(taskId);
    const selectedWeeklyTask = availableWeeklyTasks.find(task => task.id === taskId);
    if (selectedWeeklyTask) {
      generateDailyTasksFromWeekly(selectedWeeklyTask);
    }
  };

  // Effect to generate tasks when a Key Result is selected
  useEffect(() => {
    if (selectedKeyResultId) {
      const selectedKR = keyResults.find(kr => kr.id === selectedKeyResultId);
      if (selectedKR) {
        const aiSuggestedTasks = generateAiTasksForKeyResult(selectedKR.title, planType);
        // Add a unique ID to each task
        setTasks(aiSuggestedTasks.map(task => ({ ...task, id: crypto.randomUUID() })));
      }
    } else {
      setTasks([]); // Clear tasks if no KR is selected
    }
  }, [selectedKeyResultId, keyResults, planType]);

  const addTask = () => {
    setTasks([...tasks, { id: crypto.randomUUID(), title: "", description: "", priority: "Medium", target: 100, weight: 0 }]);
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const updateTask = (id: string, field: keyof Omit<Task, 'id'>, value: any) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, [field]: value } : task
    );
    setTasks(updatedTasks);
  };

  const handleSubmit = () => {
    console.log("Creating plan for Key Result:", { planType, selectedKeyResultId, tasks });
    onClose();
  };

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedKeyResultId("");
    setSelectedWeeklyTaskId("");
    setTasks([]);
    setIsGeneratingFromWeekly(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create {planType} Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-1">
          {/* Key Result Selection */}
          <div>
            <Label htmlFor="key-result">Select Key Result</Label>
            <Select value={selectedKeyResultId} onValueChange={setSelectedKeyResultId}>
              <SelectTrigger id="key-result">
                <SelectValue placeholder="Choose a Key Result to plan for" />
              </SelectTrigger>
              <SelectContent>
                {keyResults.map((kr) => (
                  <SelectItem key={kr.id} value={kr.id}>
                    {kr.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weekly Task Selection (only for Daily plans) */}
          {planType === "Daily" && selectedKeyResultId && availableWeeklyTasks.length > 0 && (
            <div>
              <Label htmlFor="weekly-task" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500"/>
                Generate from Weekly Task (Optional)
              </Label>
              <Select value={selectedWeeklyTaskId} onValueChange={handleWeeklyTaskSelection}>
                <SelectTrigger id="weekly-task" disabled={isGeneratingFromWeekly}>
                  <SelectValue placeholder="Choose a weekly task to break down into daily tasks" />
                </SelectTrigger>
                <SelectContent>
                  {availableWeeklyTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isGeneratingFromWeekly && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating daily tasks with AI...
                </div>
              )}
            </div>
          )}

          {/* Tasks Section */}
          {selectedKeyResultId && (
            <div>
              <div className="flex items-center justify-between mb-4">
                 <Label className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500"/>
                    {selectedWeeklyTaskId ? "Daily Tasks from Weekly Task (AI Generated)" : "AI Suggested Tasks (Editable)"}
                 </Label>
                <Button variant="outline" size="sm" onClick={addTask}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manual Task
                </Button>
              </div>

              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div key={task.id} className="border rounded-lg p-4 bg-card relative">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-medium text-sm">Task {index + 1}</h4>
                      <Button variant="ghost" size="icon" className="h-7 w-7 absolute top-2 right-2" onClick={() => removeTask(task.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label>Task Title</Label>
                            <Input
                                value={task.title}
                                onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                                placeholder="Enter task title"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label>Description</Label>
                            <Textarea
                                value={task.description}
                                onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                                placeholder="Task description (optional)"
                                rows={2}
                            />
                        </div>
                    
                        <div>
                            <Label>Priority</Label>
                            <Select value={task.priority} onValueChange={(value: "High" | "Medium" | "Low") => updateTask(task.id, 'priority', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Target (%)</Label>
                            <Input
                                type="number"
                                value={task.target}
                                onChange={(e) => updateTask(task.id, 'target', parseInt(e.target.value) || 0)}
                            />
                        </div>

                        <div>
                            <Label>Weight</Label>
                            <Input
                                type="number"
                                value={task.weight}
                                onChange={(e) => updateTask(task.id, 'weight', parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedKeyResultId || tasks.some(task => !task.title)}>
              Create {planType} Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}