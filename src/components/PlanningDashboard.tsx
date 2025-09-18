import { useState, useEffect, useCallback } from 'react';
import { Target, Plus, User, MoreVertical, Circle, CheckCircle, Edit2, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreatePlanModal } from './CreatePlanModal';
import { ReportingDashboard } from './ReportingDashboard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { fetchPlans, createPlan, updateTask, deleteTask } from '@/lib/okrApi';
import { KeyResult, Employee, Task, Plan } from '@/types';

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
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
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
        setKeyResults([...dailyData.keyResults, ...weeklyData.keyResults]);
        setEmployees([...dailyData.employees, ...weeklyData.employees]);
        if (!selectedEmployeeId && (dailyData.employees.length + weeklyData.employees.length > 0)) {
          setSelectedEmployeeId((dailyData.employees[0] || weeklyData.employees[0])?.id || '');
        }
      })
      .catch((err: Error) => {
        const msg = `Failed to load plans: ${err.message}`;
        setError(msg);
        toast({ variant: 'destructive', title: 'Error', description: msg });
      })
      .finally(() => setLoading(false));
  }, [toast, selectedEmployeeId]);

  // Filter employee-specific KRs
  const employeeKRs = keyResults.filter((kr) => kr.owner.id === selectedEmployeeId);

  // Default selected employee when employees change
  useEffect(() => {
    setSelectedEmployeeId((prev) => prev || employees[0]?.id || '');
  }, [employees]);

  const plansForSelectedEmployee = activeTab
    ? plans[activeTab].filter(
        (plan) => keyResults.find((kr) => kr.id === plan.keyResultId)?.owner.id === selectedEmployeeId
      )
    : [];

  // -------------------- Plan Operations --------------------
  const handleCreatePlan = useCallback(async (planType: 'Daily' | 'Weekly', keyResultId: string, tasks: Task[]) => {
    const newPlan: Plan = {
      id: generateUUID(),
      keyResultId,
      date: new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }),
      status: 'Open',
      tasks: tasks.map((t) => ({ ...t, id: generateUUID(), achieved: 0, krProgress: 0 })),
      achieved: 0,
      progress: 0,
    };

    try {
      await createPlan(newPlan);
      setPlans((prev) => ({ ...prev, [planType]: [...(prev[planType] || []), newPlan] }));
      setShowCreateForm(false);
      toast({ title: 'Success', description: `${planType} plan created` });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to create plan: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }, [toast]);

  const handleUpdatePlan = useCallback(async (planId: string, updatedPlan: Plan) => {
    try {
      await Promise.all(updatedPlan.tasks.map((task) => updateTask(planId, task)));
      setPlans((prev) => ({
        ...prev,
        [activeTab!]: prev[activeTab!].map((p) =>
          p.id === planId
            ? {
                ...updatedPlan,
                achieved: updatedPlan.tasks.reduce((sum, t) => sum + t.achieved, 0),
                progress: updatedPlan.tasks.reduce((sum, t) => sum + t.weight, 0)
                  ? (updatedPlan.tasks.reduce((sum, t) => sum + t.achieved, 0) /
                      updatedPlan.tasks.reduce((sum, t) => sum + t.weight, 0)) *
                    100
                  : 0,
              }
            : p
        ),
      }));
      setEditingPlanId(null);
      toast({ title: 'Success', description: 'Plan updated' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update plan: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }, [activeTab, toast]);

  const handleUpdateTask = useCallback((planId: string, taskId: string, field: keyof Task, value: string | number) => {
    setPlans((prev) => ({
      ...prev,
      [activeTab!]: prev[activeTab!].map((plan) =>
        plan.id === planId
          ? { ...plan, tasks: plan.tasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)) }
          : plan
      ),
    }));
  }, [activeTab]);

  const handleSaveTask = useCallback(async (planId: string, task: Task) => {
    try {
      await updateTask(planId, task);
      setEditingTaskId(null);
      toast({ title: 'Success', description: 'Task updated' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update task: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }, [toast]);

  const handleDeletePlan = useCallback(async (planId: string) => {
    try {
      const plan = plans[activeTab!].find((p) => p.id === planId);
      if (plan) await Promise.all(plan.tasks.map((t) => deleteTask(t.id)));

      setPlans((prev) => ({
        ...prev,
        [activeTab!]: prev[activeTab!].filter((p) => p.id !== planId),
      }));
      toast({ title: 'Success', description: 'Plan deleted' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete plan: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }, [activeTab, plans, toast]);

  const handleDeleteTask = useCallback(async (planId: string, taskId: string) => {
    try {
      await deleteTask(taskId);
      setPlans((prev) => ({
        ...prev,
        [activeTab!]: prev[activeTab!].map((plan) =>
          plan.id === planId
            ? { ...plan, tasks: plan.tasks.filter((t) => t.id !== taskId) }
            : plan
        ),
      }));
      toast({ title: 'Success', description: 'Task deleted' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete task: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }, [activeTab, toast]);

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
            <Button variant={mode === 'Planning' ? 'default' : 'outline'} size="sm" onClick={() => setMode('Planning')}>Planning</Button>
            <Button variant={mode === 'Reporting' ? 'default' : 'outline'} size="sm" onClick={() => setMode('Reporting')}>Reporting</Button>
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
                    {activeTab === tab && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-600 block" />}
                  </button>
                ))}
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Employee" /></SelectTrigger>
                  <SelectContent>{employees.map((emp) => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}</SelectContent>
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

            {/* Create Plan Modal */}
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
                <Button size="sm" onClick={() => setActiveTab(activeTab)}>Retry</Button>
              </div>
            )}

            {/* Plans Display */}
            {!loading && !error && activeTab && selectedEmployeeId && (
              <div className="px-6 pb-6">
                {plansForSelectedEmployee.length > 0 ? plansForSelectedEmployee.map((plan) => {
                  const KR = keyResults.find((kr) => kr.id === plan.keyResultId);
                  const isEditingPlan = editingPlanId === plan.id;
                  return (
                    <div key={plan.id} className="mb-8">
                      {/* Plan Card & Tasks rendering same as before */}
                      {/* ...keep your existing JSX for plan/task cards... */}
                    </div>
                  );
                }) : (
                  <div className="text-center py-10 bg-card border-dashed border-2 rounded-lg">
                    <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">No Plans Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">No {activeTab?.toLowerCase()} plans exist for this Employee.</p>
                    <Button size="sm" onClick={() => setShowCreateForm(true)} className="mt-6"><Plus className="-ml-1 mr-2 h-5 w-5" />Create New Plan</Button>
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
