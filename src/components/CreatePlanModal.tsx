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
  onSave: (planType: "Daily" | "Weekly", keyResultId: string, tasks: Task[]) => void;
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

export function CreatePlanModal({ open, onClose, onSave, planType, keyResults, weeklyPlans = [] }: CreatePlanModalProps) {
  const [selectedKeyResultId, setSelectedKeyResultId] = useState("");
  const [selectedWeeklyTaskId, setSelectedWeeklyTaskId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingFromWeekly, setIsGeneratingFromWeekly] = useState(false);

  // Get available weekly tasks for the selected key result
  const availableWeeklyTasks = selectedKeyResultId 
    ? weeklyPlans
        .filter(plan => plan.keyResultId === selectedKeyResultId)
        .flatMap(plan => plan.tasks)
    : [];

  // Function to generate tasks using AI
  const generateAiTasks = async () => {
    if (!selectedKeyResultId) return;
    
    setIsGenerating(true);
    try {
      const selectedKR = keyResults.find(kr => kr.id === selectedKeyResultId);
      const prompt = `Generate a short list of 2-4 actionable tasks for a ${planType} plan based on this Key Result. Each task should be measurable with full metrics. Return a JSON array of tasks with format: [{"title": "short title", "description": "brief description", "priority": "High|Medium|Low", "target": 100, "weight": number}]. Ensure weights add up to 100.

Key Result: ${selectedKR?.title}`;

      const { suggestion, error } = await askOkrModel({
        prompt,
        context: {
          source: `${planType.toLowerCase()}-plan`,
          krId: selectedKeyResultId,
        },
        params: { temperature: 0.3 },
      });

      if (error) {
        console.error("AI Error:", error);
        // Fallback to empty
        setTasks([]);
        return;
      }

      // Parse AI response
      try {
        let jsonStr = suggestion.replace(/```json\s*/, '').replace(/```\s*$/, '');
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) jsonStr = jsonMatch[0];
        const aiTasks = JSON.parse(jsonStr);
        if (Array.isArray(aiTasks) && aiTasks.length > 0) {
          const tasksWithIds = aiTasks.map((task: any) => ({
            id: crypto.randomUUID(),
            title: task.title || "Untitled Task",
            description: task.description || "",
            priority: task.priority || "Medium",
            target: task.target || 100,
            weight: task.weight || Math.round(100 / aiTasks.length),
          }));
          setTasks(tasksWithIds);
        }
      } catch (parseError) {
        console.error("Parse error:", parseError);
        setTasks([]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to generate daily tasks from weekly task using AI
  const generateDailyTasksFromWeekly = async (weeklyTask: WeeklyTask) => {
    if (!selectedKeyResultId) return;
    
    setIsGeneratingFromWeekly(true);
    try {
      const selectedKR = keyResults.find(kr => kr.id === selectedKeyResultId);
      const prompt = `Break down this weekly task into 2-4 short, actionable daily tasks. Each with full metrics. Return JSON array: [{"title": "short title", "description": "brief description", "priority": "High|Medium|Low", "target": 100, "weight": number}]. Weights sum to 100.

Weekly Task: ${weeklyTask.title}
Description: ${weeklyTask.description || "No description"}
Key Result: ${selectedKR?.title}
Priority: ${weeklyTask.priority}`;

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
        setTasks([]);
        return;
      }

      // Parse AI response
      try {
        let jsonStr = suggestion.replace(/```json\s*/, '').replace(/```\s*$/, '');
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) jsonStr = jsonMatch[0];
        const aiTasks = JSON.parse(jsonStr);
        if (Array.isArray(aiTasks) && aiTasks.length > 0) {
          const tasksWithIds = aiTasks.map((task: any) => ({
            id: crypto.randomUUID(),
            title: task.title || "Untitled Task",
            description: task.description || "",
            priority: task.priority || "Medium",
            target: task.target || 100,
            weight: task.weight || Math.round(100 / aiTasks.length),
          }));
          setTasks(tasksWithIds);
        }
      } catch (parseError) {
        console.error("Parse error:", parseError);
        setTasks([]);
      }
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

  // Effect to generate tasks when a Key Result is selected (only if no weekly selected for daily)
  useEffect(() => {
    if (selectedKeyResultId && (!selectedWeeklyTaskId || planType !== "Daily")) {
      generateAiTasks();
    }
  }, [selectedKeyResultId, planType, selectedWeeklyTaskId]);

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
    if (selectedKeyResultId && tasks.every(task => task.title)) {
      onSave(planType, selectedKeyResultId, tasks);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedKeyResultId("");
    setSelectedWeeklyTaskId("");
    setTasks([]);
    setIsGenerating(false);
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
              {isGenerating && !selectedWeeklyTaskId && (
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating {planType.toLowerCase()} tasks with AI...
                </div>
              )}

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