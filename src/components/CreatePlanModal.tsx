import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { askOkrModel } from '@/lib/okrApi';
import { KeyResult, WeeklyTask, WeeklyPlan, Task } from '@/types';

// UUID fallback generator
const generateUUID = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

export interface CreatePlanModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (planType: 'Daily' | 'Weekly', keyResultId: string, tasks: Task[]) => void;
  planType: 'Daily' | 'Weekly';
  keyResults: KeyResult[];
  weeklyPlans?: WeeklyPlan[];
}

export function CreatePlanModal({
  open,
  onClose,
  onSave,
  planType,
  keyResults,
  weeklyPlans = [],
}: CreatePlanModalProps) {
  const [selectedKeyResultId, setSelectedKeyResultId] = useState('');
  const [selectedWeeklyTaskId, setSelectedWeeklyTaskId] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingFromWeekly, setIsGeneratingFromWeekly] = useState(false);
  const { toast } = useToast();

  // Weekly tasks for selected KR
  const availableWeeklyTasks = selectedKeyResultId
    ? Array.from(
        new Map(
          weeklyPlans
            .filter((plan) => plan.keyResultId === selectedKeyResultId)
            .flatMap((plan) => plan.tasks)
            .map((task) => [task.id, task])
        ).values()
      )
    : [];

  // AI generate tasks from KR
  const generateAiTasks = async () => {
    if (!selectedKeyResultId) return;
    setIsGenerating(true);

    try {
      const kr = keyResults.find((kr) => kr.id === selectedKeyResultId);
      const prompt = `
Generate 2-4 measurable ${planType.toLowerCase()} tasks for this Key Result. 
Return JSON array: [{"title":"string","description":"string","priority":"High|Medium|Low","target":number,"weight":number}].
Ensure weights sum to 100.
Key Result: ${kr?.title}
Objective: ${kr?.objective}
Owner: ${kr?.owner.name} (${kr?.owner.role})
      `.trim();

      const { suggestion, error } = await askOkrModel({
        prompt,
        context: { source: `${planType.toLowerCase()}-plan`, krId: selectedKeyResultId },
        params: { temperature: 0.3, maxOutputTokens: 1000 },
      });

      if (error) {
        toast({ variant: 'destructive', title: 'AI Error', description: error });
        setTasks([]);
        return;
      }

      try {
        let jsonStr = suggestion!.replace(/```json\s*/, '').replace(/```\s*$/, '');
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) jsonStr = jsonMatch[0];
        const aiTasks: any[] = JSON.parse(jsonStr);

        if (Array.isArray(aiTasks) && aiTasks.length > 0) {
          const totalWeight = aiTasks.reduce((sum: number, t: any) => sum + (t.weight || 0), 0);
          setTasks(
            aiTasks.map((t: any) => ({
              id: generateUUID(),
              title: t.title || 'Untitled Task',
              description: t.description || '',
              priority: t.priority || 'Medium',
              target: parseFloat(t.target) || 100,
              weight: totalWeight ? ((parseFloat(t.weight) || 100 / aiTasks.length) * 100) / totalWeight : 100 / aiTasks.length,
              parentTaskId: undefined,
              achieved: 0,
              krProgress: 0,
            }))
          );
          toast({ title: 'Success', description: 'AI-generated tasks loaded' });
        } else {
          setTasks([]);
          toast({ variant: 'destructive', title: 'AI Error', description: 'No valid tasks returned' });
        }
      } catch {
        setTasks([]);
        toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to parse AI response' });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // AI generate daily tasks from weekly task
  const generateDailyTasksFromWeekly = async (weeklyTask: WeeklyTask) => {
    if (!selectedKeyResultId) return;
    setIsGeneratingFromWeekly(true);

    try {
      const kr = keyResults.find((kr) => kr.id === selectedKeyResultId);
      const prompt = `
Break down this weekly task into 2-4 daily tasks. Return JSON array of format: 
[{"title":"string","description":"string","priority":"High|Medium|Low","target":number,"weight":number}].
Weekly Task: ${weeklyTask.title}
Description: ${weeklyTask.description || 'No description'}
Key Result: ${kr?.title}
Objective: ${kr?.objective}
Priority: ${weeklyTask.priority}
      `.trim();

      const { suggestion, error } = await askOkrModel({
        prompt,
        context: { source: 'daily-from-weekly', krId: selectedKeyResultId, weeklyTaskId: weeklyTask.id },
        params: { temperature: 0.3, maxOutputTokens: 1000 },
      });

      if (error) {
        toast({ variant: 'destructive', title: 'AI Error', description: error });
        setTasks([]);
        return;
      }

      try {
        let jsonStr = suggestion!.replace(/```json\s*/, '').replace(/```\s*$/, '');
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) jsonStr = jsonMatch[0];
        const aiTasks: any[] = JSON.parse(jsonStr);

        if (Array.isArray(aiTasks) && aiTasks.length > 0) {
          const totalWeight = aiTasks.reduce((sum: number, t: any) => sum + (t.weight || 0), 0);
          setTasks(
            aiTasks.map((t: any) => ({
              id: generateUUID(),
              title: t.title || 'Untitled Task',
              description: t.description || `Linked to weekly: ${weeklyTask.title}`,
              priority: t.priority || weeklyTask.priority,
              target: parseFloat(t.target) || 100,
              weight: totalWeight ? ((parseFloat(t.weight) || 100 / aiTasks.length) * 100) / totalWeight : 100 / aiTasks.length,
              parentTaskId: weeklyTask.id,
              achieved: 0,
              krProgress: 0,
            }))
          );
          toast({ title: 'Success', description: 'Daily tasks generated from weekly task' });
        } else {
          setTasks([]);
          toast({ variant: 'destructive', title: 'AI Error', description: 'No valid tasks returned' });
        }
      } catch {
        setTasks([]);
        toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to parse AI response' });
      }
    } finally {
      setIsGeneratingFromWeekly(false);
    }
  };

  const handleWeeklyTaskSelection = (taskId: string) => {
    setSelectedWeeklyTaskId(taskId);
    if (taskId) {
      const weeklyTask = availableWeeklyTasks.find((t) => t.id === taskId);
      if (weeklyTask) generateDailyTasksFromWeekly(weeklyTask);
    } else {
      setTasks([]);
      generateAiTasks();
    }
  };

  useEffect(() => {
    if (selectedKeyResultId && (!selectedWeeklyTaskId || planType !== 'Daily')) generateAiTasks();
  }, [selectedKeyResultId, planType, selectedWeeklyTaskId]);

  const addTask = () =>
    setTasks([
      ...tasks,
      {
        id: generateUUID(),
        title: '',
        description: selectedWeeklyTaskId
          ? `Linked to weekly: ${availableWeeklyTasks.find((t) => t.id === selectedWeeklyTaskId)?.title || ''}`
          : '',
        priority: 'Medium',
        target: 100,
        weight: 0,
        parentTaskId: selectedWeeklyTaskId || undefined,
        achieved: 0,
        krProgress: 0,
      },
    ]);

  const removeTask = (id: string) => setTasks(tasks.filter((t) => t.id !== id));
  const updateTask = (id: string, field: keyof Omit<Task, 'id' | 'parentTaskId' | 'achieved' | 'krProgress'>, value: string | number) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, [field]: value } : t)));

  const handleSubmit = () => {
    const totalWeight = tasks.reduce((sum, t) => sum + t.weight, 0);
    if (!selectedKeyResultId) return toast({ variant: 'destructive', title: 'Error', description: 'Select a Key Result' });
    if (tasks.length === 0) return toast({ variant: 'destructive', title: 'Error', description: 'At least one task is required' });
    if (tasks.some((t) => !t.title)) return toast({ variant: 'destructive', title: 'Error', description: 'All tasks must have a title' });
    if (Math.abs(totalWeight - 100) > 0.01)
      return toast({ variant: 'destructive', title: 'Error', description: 'Task weights must sum to 100' });

    onSave(planType, selectedKeyResultId, tasks);
  };

  const handleClose = () => {
    setSelectedKeyResultId('');
    setSelectedWeeklyTaskId('');
    setTasks([]);
    setIsGenerating(false);
    setIsGeneratingFromWeekly(false);
    onClose();
  };

  const totalWeight = tasks.reduce((sum, t) => sum + t.weight, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create {planType} Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-1">
          {/* Key Result */}
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

          {/* Weekly Task Selection */}
          {planType === 'Daily' && selectedKeyResultId && availableWeeklyTasks.length > 0 && (
            <div>
              <Label htmlFor="weekly-task" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" /> Generate from Weekly Task (Optional)
              </Label>
              <Select value={selectedWeeklyTaskId} onValueChange={handleWeeklyTaskSelection}>
                <SelectTrigger id="weekly-task" disabled={isGeneratingFromWeekly}>
                  <SelectValue placeholder="Choose a weekly task to break down" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Generate from Key Result)</SelectItem>
                  {availableWeeklyTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isGeneratingFromWeekly && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating daily tasks with AI...
                </div>
              )}
            </div>
          )}

          {/* Tasks Section */}
          {selectedKeyResultId && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  {selectedWeeklyTaskId ? 'Daily Tasks from Weekly Task' : 'AI Suggested Tasks (Editable)'}
                </Label>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${totalWeight !== 100 ? 'text-red-500' : 'text-green-500'}`}>
                    Total Weight: {totalWeight.toFixed(2)}%
                  </span>
                  <Button variant="outline" size="sm" onClick={addTask}>
                    <Plus className="w-4 h-4 mr-2" /> Add Manual Task
                  </Button>
                </div>
              </div>
              {isGenerating && !selectedWeeklyTaskId && (
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating {planType.toLowerCase()} tasks with AI...
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
                        <Input value={task.title} onChange={(e) => updateTask(task.id, 'title', e.target.value)} placeholder="Enter task title" />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Description</Label>
                        <Textarea value={task.description || ''} onChange={(e) => updateTask(task.id, 'description', e.target.value)} rows={2} />
                      </div>

                      <div>
                        <Label>Priority</Label>
                        <Select value={task.priority} onValueChange={(value: 'High' | 'Medium' | 'Low') => updateTask(task.id, 'priority', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Target (%)</Label>
                        <Input type="number" value={task.target} onChange={(e) => updateTask(task.id, 'target', parseFloat(e.target.value) || 0)} />
                      </div>

                      <div>
                        <Label>Weight</Label>
                        <Input type="number" value={task.weight} onChange={(e) => updateTask(task.id, 'weight', parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedKeyResultId || tasks.length === 0 || tasks.some((t) => !t.title) || Math.abs(totalWeight - 100) > 0.01}
            >
              Create {planType} Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
