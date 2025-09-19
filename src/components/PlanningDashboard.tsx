import { useState, useEffect, useCallback } from 'react';
import { Target, Plus, Loader2, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreatePlanModal } from './CreatePlanModal';
import { ReportingDashboard } from './ReportingDashboard';
import {
  fetchPlans,
  createPlan,
  updateTask,
  deleteTask,
} from '@/lib/okrApi';
import { KeyResult, Employee, Task, Plan, PlanCreatePayload } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

// UUID fallback generator
const generateUUID = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

export function PlanningDashboard() {
  const [mode, setMode] = useState<'Planning' | 'Reporting'>('Planning');
  const [activeTab, setActiveTab] = useState<'Daily' | 'Weekly' | null>('Daily');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [plans, setPlans] = useState<Record<'Daily' | 'Weekly', Plan[]>>({ Daily: [], Weekly: [] });
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Fetch plans for both Daily & Weekly on mount
  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all(['Daily', 'Weekly'].map((tab) => fetchPlans(tab as 'Daily' | 'Weekly')))
      .then(([dailyData, weeklyData]) => {
        setPlans({ Daily: dailyData.plans, Weekly: weeklyData.plans });

        // Dedupe key results by id to avoid duplicate keys in lists
        const mergedKRs = [...dailyData.keyResults, ...weeklyData.keyResults];
        const uniqueKRs = Array.from(new Map(mergedKRs.map((kr) => [kr.id, kr])).values());
        setKeyResults(uniqueKRs);

        // Dedupe employees by id
        const allEmployees = Array.from(
          new Map(uniqueKRs.map((kr) => [kr.owner.id, kr.owner])).values()
        );
        setEmployees(allEmployees);

        if (!selectedEmployeeId && allEmployees.length > 0) {
          setSelectedEmployeeId(allEmployees[0].id);
        }
      })
      .catch((err: Error) => {
        const msg = `Failed to load plans: ${err.message}`;
        setError(msg);
        toast({ variant: 'destructive', title: 'Error', description: msg });
      })
      .finally(() => setLoading(false));
  }, [toast, selectedEmployeeId]);

  const employeeKRs = keyResults.filter((kr) => kr.owner.id === selectedEmployeeId);

  useEffect(() => {
    setSelectedEmployeeId((prev) => prev || employees[0]?.id || '');
  }, [employees]);

  const plansForSelectedEmployee = activeTab
    ? plans[activeTab].filter(
        (plan) => keyResults.find((kr) => kr.id === plan.keyResultId)?.owner.id === selectedEmployeeId
      )
    : [];

  // -------------------- Plan Operations --------------------
  const handleCreatePlan = useCallback(
    async (planPayload: PlanCreatePayload) => {
      try {
        const result = await createPlan(planPayload);
        
        if (result.success) {
          // Refresh plans after successful creation
          const planType = planPayload.planType;
          const updatedData = await fetchPlans(planType);
          setPlans((prev) => ({ ...prev, [planType]: updatedData.plans }));
          
          setShowCreateForm(false);
          toast({ 
            title: 'Success', 
            description: `${planPayload.planType} plan created successfully` 
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.message || 'Failed to create plan',
          });
        }
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to create plan: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
    [toast]
  );

  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [taskUpdates, setTaskUpdates] = useState<Record<string, Partial<Task>>>({});

  const handleUpdateTask = useCallback(
    (taskId: string, field: keyof Task, value: string | number) => {
      setTaskUpdates(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          [field]: value
        }
      }));
      
      // Update local state immediately for UI responsiveness
      setPlans((prev) => ({
        ...prev,
        [activeTab!]: prev[activeTab!].map((plan) => ({
          ...plan,
          tasks: plan.tasks.map((t) => 
            t.id === taskId ? { ...t, [field]: value } : t
          )
        })),
      }));
    },
    [activeTab]
  );

  const handleSaveTask = useCallback(
    async (taskId: string) => {
      try {
        const updates = taskUpdates[taskId];
        if (!updates) return;
        
        const result = await updateTask(taskId, updates);
        
        if (result.success) {
          // Clear the updates for this task
          setTaskUpdates(prev => {
            const newUpdates = { ...prev };
            delete newUpdates[taskId];
            return newUpdates;
          });
          setEditingTask(null);
          toast({ title: 'Success', description: 'Task updated successfully' });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.message || 'Failed to update task',
          });
        }
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to update task: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
    [taskUpdates, toast]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        const result = await deleteTask(taskId);
        
        if (result.success) {
          // Remove from local state
          setPlans((prev) => ({
            ...prev,
            [activeTab!]: prev[activeTab!].map((plan) => ({
              ...plan,
              tasks: plan.tasks.filter((t) => t.id !== taskId)
            })),
          }));
          toast({ title: 'Success', description: 'Task deleted successfully' });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.message || 'Failed to delete task',
          });
        }
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to delete task: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
    [activeTab, toast]
  );

  // -------------------- Render --------------------
  return (
    <div className="flex h-full w-full bg-background">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Planning and Reporting</h1>
            <p className="text-sm text-muted-foreground">OKR Settings</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={mode === 'Planning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('Planning')}
            >
              Planning
            </Button>
            <Button
              variant={mode === 'Reporting' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('Reporting')}
            >
              Reporting
            </Button>
          </div>
        </div>

        {mode === 'Planning' ? (
          <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
            {/* Tabs & Employee Select */}
            <div className="flex items-center justify-between mb-6 px-6 pt-6 border-b">
              <div className="flex gap-8">
                {(['Daily', 'Weekly'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium relative transition-colors ${
                      activeTab === tab ? 'text-blue-600' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-600 block" />
                    )}
                  </button>
                ))}
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp, index) => (
                      <SelectItem key={`${emp.id}-${index}`} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(true)}
                disabled={!activeTab || loading}
                className="flex items-center gap-2 text-muted-foreground border-dashed"
              >
                <Plus className="w-4 h-4" /> Create {activeTab || ''} Plan
              </Button>
            </div>

            {activeTab && (
              <CreatePlanModal
                open={showCreateForm}
                onClose={() => setShowCreateForm(false)}
                onSave={handleCreatePlan}
                planType={activeTab}
                keyResults={employeeKRs}
                weeklyPlans={plans.Weekly || []}
              />
            )}

            {/* Loading & Error */}
            {loading && (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading {activeTab} plans...
              </div>
            )}
            {error && !loading && (
              <div className="text-center py-10 bg-card border-dashed border-2 rounded-lg">
                <h3 className="text-sm font-medium text-foreground">Error</h3>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                <Button size="sm" onClick={() => setActiveTab(activeTab)}>
                  Retry
                </Button>
              </div>
            )}

            {/* Plans Display */}
            {!loading && !error && activeTab && selectedEmployeeId && (
              <div className="px-6 pb-6">
                {plansForSelectedEmployee.length > 0 ? (
                  plansForSelectedEmployee.map((plan, planIndex) => {
                    const planKey = `${activeTab}-${plan.id}-${planIndex}`;

                    return (
                      <div key={planKey} className="mb-8">
                        {/* Plan Card */}
                        <div className="bg-card p-4 rounded-lg border">
                          <h4 className="font-semibold">
                            {keyResults.find((kr) => kr.id === plan.keyResultId)?.title || 'Unknown KR'}
                          </h4>
                          <p className="text-sm text-muted-foreground">Date: {plan.date} | Status: {plan.status}</p>

                          {/* Tasks */}
                          <div className="mt-4 space-y-3">
                            {plan.tasks.map((task, taskIndex) => {
                              const taskKey = `${planKey}-${task.id}-${taskIndex}`;
                              const isEditing = editingTask === task.id;
                              const hasUpdates = taskUpdates[task.id];
                              
                              return (
                                <div key={taskKey} className="p-3 border rounded-lg bg-card">
                                  <div className="flex items-center justify-between mb-2">
                                    {isEditing ? (
                                      <Input
                                        value={task.title}
                                        onChange={(e) => handleUpdateTask(task.id, 'title', e.target.value)}
                                        className="flex-1 mr-2"
                                        placeholder="Task title"
                                      />
                                    ) : (
                                      <span className="font-medium">{task.title}</span>
                                    )}
                                    
                                    <div className="flex items-center gap-2">
                                      {hasUpdates && !isEditing && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleSaveTask(task.id)}
                                        >
                                          <Save className="w-3 h-3 mr-1" />
                                          Save
                                        </Button>
                                      )}
                                      
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingTask(isEditing ? null : task.id)}
                                      >
                                        {isEditing ? <X className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
                                      </Button>
                                      
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {isEditing && (
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                      <div>
                                        <label className="text-xs text-muted-foreground">Priority</label>
                                        <Select
                                          value={task.priority}
                                          onValueChange={(value: 'High' | 'Medium' | 'Low') => 
                                            handleUpdateTask(task.id, 'priority', value)
                                          }
                                        >
                                          <SelectTrigger className="h-8">
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
                                        <label className="text-xs text-muted-foreground">Target (%)</label>
                                        <Input
                                          type="number"
                                          value={task.target}
                                          onChange={(e) => handleUpdateTask(task.id, 'target', parseFloat(e.target.value) || 0)}
                                          className="h-8"
                                          min="0"
                                          max="100"
                                        />
                                      </div>
                                      
                                      <div>
                                        <label className="text-xs text-muted-foreground">Weight (%)</label>
                                        <Input
                                          type="number"
                                          value={task.weight}
                                          onChange={(e) => handleUpdateTask(task.id, 'weight', parseFloat(e.target.value) || 0)}
                                          className="h-8"
                                          min="0"
                                          max="100"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                    <span>Priority: {task.priority}</span>
                                    <span>Target: {task.target}% | Weight: {task.weight}%</span>
                                    <span>Progress: {task.achieved}%</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-card border-dashed border-2 rounded-lg">
                    <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">No Plans Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No {activeTab?.toLowerCase()} plans exist for this Employee.
                    </p>
                    <Button size="sm" onClick={() => setShowCreateForm(true)} className="mt-6">
                      <Plus className="-ml-1 mr-2 h-5 w-5" />
                      Create New Plan
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 p-6">
            <ReportingDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
