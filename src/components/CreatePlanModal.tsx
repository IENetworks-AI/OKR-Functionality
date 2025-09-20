import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Sparkles, Loader2, RefreshCw, CalendarIcon } from 'lucide-react';
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { KeyResult, WeeklyPlan, Task } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { askOkrModel } from "@/lib/ai";

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

interface TaskWithAI extends Task {
  isAI?: boolean;
  deadline?: Date;
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
  const [selectedWeeklyPlanId, setSelectedWeeklyPlanId] = useState('');
  const [tasks, setTasks] = useState<TaskWithAI[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingFromWeekly, setIsGeneratingFromWeekly] = useState(false);
  const [refinements, setRefinements] = useState<{ [id: string]: string }>({});
  const { toast } = useToast();

  // Validate keyResults to prevent empty IDs
  useEffect(() => {
    const invalidKeyResults = keyResults.filter((kr) => !kr.id || kr.id === '');
    if (invalidKeyResults.length > 0) {
      console.warn('Key Results with empty IDs:', invalidKeyResults);
      toast({
        variant: 'destructive',
        title: 'Warning',
        description: 'Some Key Results have empty IDs. Please check the data.',
      });
    }
  }, [keyResults, toast]);

  // Weekly plans for selected KR
  const availableWeeklyPlans = selectedKeyResultId
    ? weeklyPlans.filter((plan) => plan.keyResultId === selectedKeyResultId)
    : [];

  // Validate weeklyPlans to prevent empty IDs
  useEffect(() => {
    const invalidWeeklyPlans = availableWeeklyPlans.filter((p) => !p.id || p.id === '');
    if (invalidWeeklyPlans.length > 0) {
      console.warn('Weekly Plans with empty IDs:', invalidWeeklyPlans);
      toast({
        variant: 'destructive',
        title: 'Warning',
        description: 'Some Weekly Plans have empty IDs. Please check the data.',
      });
    }
  }, [availableWeeklyPlans, toast]);

  // AI generate tasks from Key Result
  const generateAiTasks = async () => {
    if (!selectedKeyResultId) return;
    setIsGenerating(true);

    try {
      const kr = keyResults.find((kr) => kr.id === selectedKeyResultId);
      if (!kr) {
        throw new Error('Selected Key Result not found');
      }
      const prompt = `
Generate 2-4 measurable ${planType.toLowerCase()} tasks for the following Key Result. 
Return a JSON array of objects with the following structure: 
[{"title":"string","description":"string","priority":"High|Medium|Low","target":number,"weight":number,"deadline":"YYYY-MM-DD"}].
Ensure weights sum to 100 and all fields are provided. Each task must have a unique, non-empty title and a target between 0 and 100.
Key Result: ${kr.title}
Objective: ${kr.objective}
Owner: ${kr.owner.name} (${kr.owner.role})
      `.trim();

      const { suggestion, error } = await askOkrModel({
        prompt,
        params: { temperature: 0.3, maxOutputTokens: 1000 },
      });

      if (error) {
        console.error('AI task generation error:', error);
        toast({ variant: 'destructive', title: 'AI Error', description: error });
        setTasks([]);
        return;
      }

      try {
        let jsonStr = suggestion.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) jsonStr = jsonMatch[0];
        const aiTasks: any[] = JSON.parse(jsonStr);

        if (Array.isArray(aiTasks) && aiTasks.length > 0) {
          const totalWeight = aiTasks.reduce((sum: number, t: any) => sum + (t.weight || 0), 0);
          const normalizedTasks: TaskWithAI[] = aiTasks.map((t: any, index: number) => ({
            id: generateUUID(),
            title: t.title || `Task ${index + 1}`,
            description: t.description || '',
            priority: t.priority && ['High', 'Medium', 'Low'].includes(t.priority) ? t.priority : 'Medium',
            target: Math.min(Math.max(parseFloat(t.target) || 100, 0), 100),
            weight: totalWeight ? Math.round(((parseFloat(t.weight) || 100 / aiTasks.length) * 100) / totalWeight) : Math.round(100 / aiTasks.length),
            parentTaskId: undefined,
            achieved: 0,
            krProgress: 0,
            deadline: t.deadline ? new Date(t.deadline) : undefined,
            isAI: true,
          }));

          // Normalize weights to exactly sum to 100 (handle rounding errors)
          let currentTotalWeight = normalizedTasks.reduce((sum, t) => sum + t.weight, 0);
          let difference = 100 - currentTotalWeight;
          for (let i = 0; i < Math.abs(difference); i++) {
            const index = i % normalizedTasks.length;
            normalizedTasks[index].weight += difference > 0 ? 1 : -1;
          }

          setTasks(normalizedTasks);
          toast({ title: 'Success', description: 'AI-generated tasks loaded' });
        } else {
          console.warn('No valid tasks in AI response:', aiTasks);
          setTasks([]);
          toast({ variant: 'destructive', title: 'AI Error', description: 'No valid tasks returned' });
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError, 'Raw suggestion:', suggestion);
        setTasks([]);
        toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to parse AI response' });
      }
    } catch (err) {
      console.error('Error generating AI tasks:', err);
      setTasks([]);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: err instanceof Error ? err.message : 'Failed to generate tasks',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // AI generate daily tasks from Weekly Plan
  const generateDailyTasksFromWeeklyPlan = async (weeklyPlan: WeeklyPlan) => {
    if (!selectedKeyResultId) return;
    setIsGeneratingFromWeekly(true);

    try {
      const kr = keyResults.find((kr) => kr.id === selectedKeyResultId);
      if (!kr) {
        throw new Error('Selected Key Result not found');
      }
      const weeklyTasksList = weeklyPlan.tasks.map((task) => 
        `Title: ${task.title}, Description: ${task.description || 'No description'}, Priority: ${task.priority}, Target: ${task.target}, Weight: ${task.weight}`
      ).join('\n');
      const prompt = `
Break down the following weekly plan into 2-4 measurable daily tasks. Return a JSON array of objects with the following structure: 
[{"title":"string","description":"string","priority":"High|Medium|Low","target":number,"weight":number,"deadline":"YYYY-MM-DD"}].
Ensure weights sum to 100 and all fields are provided. Each task must have a unique, non-empty title and a target between 0 and 100.
Weekly Plan Tasks:
${weeklyTasksList}
Key Result: ${kr.title}
Objective: ${kr.objective}
      `.trim();

      const { suggestion, error } = await askOkrModel({
        prompt,
        params: { temperature: 0.3, maxOutputTokens: 1000 },
      });

      if (error) {
        console.error('AI daily task generation error:', error);
        toast({ variant: 'destructive', title: 'AI Error', description: error });
        setTasks([]);
        return;
      }

      try {
        let jsonStr = suggestion.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) jsonStr = jsonMatch[0];
        const aiTasks: any[] = JSON.parse(jsonStr);

        if (Array.isArray(aiTasks) && aiTasks.length > 0) {
          const totalWeight = aiTasks.reduce((sum: number, t: any) => sum + (t.weight || 0), 0);
          const normalizedTasks: TaskWithAI[] = aiTasks.map((t: any, index: number) => ({
            id: generateUUID(),
            title: t.title || `Daily Task ${index + 1}`,
            description: t.description || `Linked to weekly plan: ${weeklyPlan.id}`,
            priority: t.priority && ['High', 'Medium', 'Low'].includes(t.priority) ? t.priority : 'Medium',
            target: Math.min(Math.max(parseFloat(t.target) || 100, 0), 100),
            weight: totalWeight ? Math.round(((parseFloat(t.weight) || 100 / aiTasks.length) * 100) / totalWeight) : Math.round(100 / aiTasks.length),
            parentTaskId: undefined,
            achieved: 0,
            krProgress: 0,
            deadline: t.deadline ? new Date(t.deadline) : undefined,
            isAI: true,
          }));

          // Normalize weights to exactly sum to 100 (handle rounding errors)
          let currentTotalWeight = normalizedTasks.reduce((sum, t) => sum + t.weight, 0);
          let difference = 100 - currentTotalWeight;
          for (let i = 0; i < Math.abs(difference); i++) {
            const index = i % normalizedTasks.length;
            normalizedTasks[index].weight += difference > 0 ? 1 : -1;
          }

          setTasks(normalizedTasks);
          toast({ title: 'Success', description: 'Daily tasks generated from weekly plan' });
        } else {
          console.warn('No valid tasks in AI response:', aiTasks);
          setTasks([]);
          toast({ variant: 'destructive', title: 'AI Error', description: 'No valid tasks returned' });
        }
      } catch (parseError) {
        console.error('Failed to parse AI response for daily tasks:', parseError, 'Raw suggestion:', suggestion);
        setTasks([]);
        toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to parse AI response' });
      }
    } catch (err) {
      console.error('Error generating daily tasks from weekly plan:', err);
      setTasks([]);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: err instanceof Error ? err.message : 'Failed to generate daily tasks',
      });
    } finally {
      setIsGeneratingFromWeekly(false);
    }
  };

  // Regenerate single task
  const handleRegenerateTask = async (id: string, refinement: string) => {
    if (!selectedKeyResultId) return;
    setIsGenerating(true);

    try {
      const kr = keyResults.find((kr) => kr.id === selectedKeyResultId);
      if (!kr) {
        throw new Error('Selected Key Result not found');
      }
      const task = tasks.find((t) => t.id === id);
      if (!task) {
        throw new Error('Task not found');
      }

      const prompt = `
Regenerate this measurable ${planType.toLowerCase()} task for the Key Result: ${kr.title}.
Original: Title: ${task.title}, Description: ${task.description}, Priority: ${task.priority}, Target: ${task.target}, Weight: ${task.weight}, Deadline: ${task.deadline ? format(task.deadline, 'yyyy-MM-dd') : 'None'}
Refinement: ${refinement}
Return a JSON object with the following structure: 
{"title":"string","description":"string","priority":"High|Medium|Low","target":number,"weight":number,"deadline":"YYYY-MM-DD"}.
Ensure all fields are provided. The task must have a unique, non-empty title and a target between 0 and 100.
      `.trim();

      const { suggestion, error } = await askOkrModel({
        prompt,
        params: { temperature: 0.3, maxOutputTokens: 1000 },
      });

      if (error) {
        console.error('AI task regeneration error:', error);
        toast({ variant: 'destructive', title: 'AI Error', description: error });
        return;
      }

      try {
        let jsonStr = suggestion.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[0];
        const newTask: any = JSON.parse(jsonStr);

        setTasks(tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                title: newTask.title || t.title,
                description: newTask.description || t.description,
                priority: newTask.priority && ['High', 'Medium', 'Low'].includes(newTask.priority) ? newTask.priority : t.priority,
                target: Math.min(Math.max(parseFloat(newTask.target) || t.target, 0), 100),
                weight: parseFloat(newTask.weight) || t.weight,
                deadline: newTask.deadline ? new Date(newTask.deadline) : t.deadline,
              }
            : t
        ));

        toast({ title: 'Success', description: 'Task regenerated' });
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError, 'Raw suggestion:', suggestion);
        toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to parse AI response' });
      }
    } catch (err) {
      console.error('Error regenerating task:', err);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: err instanceof Error ? err.message : 'Failed to regenerate task',
      });
    } finally {
      setIsGenerating(false);
      setRefinements({ ...refinements, [id]: '' }); // Clear refinement
    }
  };

  const handleWeeklyPlanSelection = (planId: string) => {
    setSelectedWeeklyPlanId(planId);
    if (planId && planId !== 'none') {
      const weeklyPlan = availableWeeklyPlans.find((p) => p.id === planId);
      if (weeklyPlan) {
        generateDailyTasksFromWeeklyPlan(weeklyPlan);
      } else {
        console.warn('Selected Weekly Plan not found:', planId);
        setTasks([]);
        toast({ variant: 'destructive', title: 'Error', description: 'Selected Weekly Plan not found' });
      }
    } else {
      setTasks([]);
      generateAiTasks();
    }
  };

  useEffect(() => {
    if (selectedKeyResultId && (!selectedWeeklyPlanId || planType !== 'Daily' || selectedWeeklyPlanId === 'none')) {
      generateAiTasks();
    }
  }, [selectedKeyResultId, planType, selectedWeeklyPlanId]);

  const addTask = () =>
    setTasks([
      ...tasks,
      {
        id: generateUUID(),
        title: '',
        description: selectedWeeklyPlanId && selectedWeeklyPlanId !== 'none'
          ? `Linked to weekly plan: ${availableWeeklyPlans.find((p) => p.id === selectedWeeklyPlanId)?.id || ''}`
          : '',
        priority: 'Medium',
        target: 100,
        weight: 0,
        parentTaskId: undefined,
        achieved: 0,
        krProgress: 0,
        deadline: undefined,
      },
    ]);

  const removeTask = (id: string) => setTasks(tasks.filter((t) => t.id !== id));
  const updateTask = (id: string, field: keyof Omit<Task, 'id' | 'parentTaskId' | 'achieved' | 'krProgress'> | 'deadline', value: string | number | Date) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, [field]: value } : t)));

  const handleSubmit = () => {
    const totalWeight = tasks.reduce((sum, t) => sum + t.weight, 0);
    if (!selectedKeyResultId) return toast({ variant: 'destructive', title: 'Error', description: 'Select a Key Result' });
    if (tasks.length === 0) return toast({ variant: 'destructive', title: 'Error', description: 'At least one task is required' });
    if (tasks.some((t) => !t.title)) return toast({ variant: 'destructive', title: 'Error', description: 'All tasks must have a title' });
    if (Math.abs(totalWeight - 100) > 0.01)
      return toast({ variant: 'destructive', title: 'Error', description: 'Task weights must sum to 100' });

    // Strip isAI before saving
    const tasksToSave = tasks.map(({ isAI, ...task }) => task) as Task[];
    onSave(planType, selectedKeyResultId, tasksToSave);
  };

  const handleClose = () => {
    setSelectedKeyResultId('');
    setSelectedWeeklyPlanId('');
    setTasks([]);
    setIsGenerating(false);
    setIsGeneratingFromWeekly(false);
    setRefinements({});
    onClose();
  };

  const totalWeight = tasks.reduce((sum, t) => sum + t.weight, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create {planType} Plan</DialogTitle>
          <DialogDescription>
            Create a new {planType.toLowerCase()} plan by selecting a Key Result and defining tasks.
          </DialogDescription>
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
                {keyResults.map((kr, index) => (
                  <SelectItem key={`${kr.id}-${planType}-${index}`} value={kr.id}>
                    {kr.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weekly Plan Selection for Daily Plans */}
          {planType === 'Daily' && selectedKeyResultId && availableWeeklyPlans.length > 0 && (
            <div>
              <Label htmlFor="weekly-plan" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" /> Generate from Weekly Plan (Optional)
              </Label>
              <Select value={selectedWeeklyPlanId} onValueChange={handleWeeklyPlanSelection}>
                <SelectTrigger id="weekly-plan" disabled={isGeneratingFromWeekly}>
                  <SelectValue placeholder="Choose a weekly plan to break down" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="none" value="none">None (Generate from Key Result)</SelectItem>
                  {availableWeeklyPlans.map((p, index) => (
                    <SelectItem key={`${p.id}-${planType}-${index}`} value={p.id}>
                      {p.date ? `Weekly Plan (${p.date})` : `Weekly Plan ${p.id}`}
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
                  {selectedWeeklyPlanId && selectedWeeklyPlanId !== 'none' ? 'Daily Tasks from Weekly Plan' : 'AI Suggested Tasks (Editable)'}
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
              {isGenerating && (!selectedWeeklyPlanId || selectedWeeklyPlanId === 'none') && (
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating {planType.toLowerCase()} tasks with AI...
                </div>
              )}

              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div key={task.id} className="border rounded-lg p-4 bg-card relative">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-medium text-sm">Task {index + 1}</h4>
                      <div className="absolute top-2 right-2 flex gap-1">
                        {task.isAI && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-4">
                                <Label>Refinement Prompt</Label>
                                <Input
                                  value={refinements[task.id] || ''}
                                  onChange={(e) => setRefinements({ ...refinements, [task.id]: e.target.value })}
                                  placeholder="e.g., Make it more specific"
                                />
                                <Button onClick={() => handleRegenerateTask(task.id, refinements[task.id] || '')}>
                                  Regenerate
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeTask(task.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
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

                      <div>
                        <Label>Deadline</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !task.deadline && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {task.deadline ? format(task.deadline, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={task.deadline}
                              onSelect={(date) => updateTask(task.id, 'deadline', date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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