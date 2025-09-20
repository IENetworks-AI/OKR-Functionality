import { useState, useEffect, useCallback } from 'react';
import { Target, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreatePlanModal } from './CreatePlanModal';
import { ReportingDashboard } from './ReportingDashboard';
import { fetchPlans } from '@/lib/okrApi';
import { KeyResult, Employee, Task, Plan } from '@/types';
import { toast } from "sonner";

import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

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

        // Deduplicate keyResults across daily and weekly plans
        const allKeyResults = [...dailyData.keyResults, ...weeklyData.keyResults];
        // Deduplicate by stable composite key (kr.id + owner.id). If API reuses kr.id across contexts, the owner disambiguates.
        const uniqueKeyResults = Array.from(
          new Map(
            allKeyResults.map((kr) => [`${kr.id}-${kr.owner.id}`, kr])
          ).values()
        );

        // Debug duplicate key results (by plain id across contexts)
        const krIds = allKeyResults.map((kr) => kr.id);
        const duplicateKrIds = Array.from(new Set(krIds.filter((id, i) => krIds.indexOf(id) !== i)));
        if (duplicateKrIds.length > 0) {
          console.warn('Duplicate Key Result IDs across daily/weekly plans:', duplicateKrIds);
          toast({
            variant: 'destructive',
            title: 'Warning',
            description: 'Duplicate Key Result IDs detected across plans. Using unique keys.',
          });
        }

        setKeyResults(uniqueKeyResults);

        const allEmployees = Array.from(
          new Map(
            uniqueKeyResults.map((kr, index) => [`${kr.owner.id}-${index}`, kr.owner])
          ).values()
        );

        // Debug duplicate employee IDs
        const empIds = allEmployees.map((emp) => emp.id);
        const duplicateEmpIds = empIds.filter((id, index) => empIds.indexOf(id) !== index);
        if (duplicateEmpIds.length > 0) {
          console.warn('Duplicate Employee IDs found:', duplicateEmpIds);
          toast({
            variant: 'destructive',
            title: 'Warning',
            description: 'Duplicate Employee IDs detected. Using unique keys.',
          });
        }
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

  // Plan Operations (Custom CRUD)
  const handleCreatePlan = useCallback(
    async (planType: 'Daily' | 'Weekly', keyResultId: string, tasks: Task[]) => {
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
    },
    [toast]
  );

  const handleUpdateTask = useCallback(
    (planId: string, taskId: string, field: keyof Task, value: string | number) => {
      setPlans((prev) => ({
        ...prev,
        [activeTab!]: prev[activeTab!].map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                tasks: plan.tasks.map((t) =>
                  t.id === taskId ? { ...t, [field]: value } : t
                ),
                achieved: plan.tasks.reduce((sum, t) => sum + (t.id === taskId && field === 'achieved' ? (typeof value === 'number' ? value : t.achieved) : t.achieved), 0),
                progress: plan.tasks.reduce((sum, t) => sum + (t.id === taskId && field === 'achieved' ? (typeof value === 'number' ? value : t.achieved) : t.achieved), 0) /
                         (plan.tasks.reduce((sum, t) => sum + t.weight, 0) || 1) * 100,
              }
            : plan
        ),
      }));
    },
    [activeTab]
  );

  const handleSaveTask = useCallback(
    async (planId: string, task: Task) => {
      try {
        toast({ title: 'Success', description: 'Task updated' });
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to update task: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
    [toast]
  );

  const handleDeleteTask = useCallback(
    async (planId: string, taskId: string) => {
      try {
        setPlans((prev) => ({
          ...prev,
          [activeTab!]: prev[activeTab!].map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  tasks: plan.tasks.filter((t) => t.id !== taskId),
                  achieved: plan.tasks.filter((t) => t.id !== taskId).reduce((sum, t) => sum + t.achieved, 0),
                  progress: plan.tasks.filter((t) => t.id !== taskId).reduce((sum, t) => sum + t.achieved, 0) /
                           (plan.tasks.filter((t) => t.id !== taskId).reduce((sum, t) => sum + t.weight, 0) || 1) * 100,
                }
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
    },
    [activeTab, toast]
  );

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
                      <SelectItem key={`${emp.id}-${index}-${mode}`} value={emp.id}>
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
                <Button size="sm" onClick={() => setActiveTab(activeTab)}>Retry</Button>
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
                        <div className="bg-card p-4 rounded-lg border">
                          <h4 className="font-semibold">
                            {keyResults.find((kr) => kr.id === plan.keyResultId)?.title || 'Unknown KR'}
                          </h4>
                          <p className="text-sm text-muted-foreground">Date: {plan.date} | Status: {plan.status}</p>
                          <div className="mt-4 space-y-2">
                            {plan.tasks.map((task, taskIndex) => {
                              const taskKey = `${planKey}-${task.id}-${taskIndex}`;
                              return (
                                <div key={taskKey} className="p-2 border rounded flex justify-between items-center">
                                  <span>{task.title}</span>
                                  <span className="text-sm text-muted-foreground">Pending</span>
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