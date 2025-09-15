import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Sparkles } from "lucide-react";

interface CreatePlanModalProps {
  open: boolean;
  onClose: () => void;
  planType: "Daily" | "Weekly" | "Monthly";
  employees: Array<{ id: string; name: string; role: string }>;
}

interface Task {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  target: number;
  weight: number;
}

const aiSuggestedTasks = {
  Daily: [
    "Review and optimize data pipeline performance metrics",
    "Collaborate with ML team on feature engineering tasks",
    "Conduct code review for AI model integration",
    "Update documentation for data validation processes"
  ],
  Weekly: [
    "Complete model accuracy testing and validation",
    "Prepare weekly ML experiment results report",
    "Optimize model inference latency for production",
    "Design A/B testing framework for new features"
  ],
  Monthly: [
    "Develop comprehensive AI strategy roadmap",
    "Conduct quarterly model performance review",
    "Research and evaluate new ML frameworks",
    "Plan infrastructure scaling for ML workloads"
  ]
};

export function CreatePlanModal({ open, onClose, planType, employees }: CreatePlanModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [tasks, setTasks] = useState<Task[]>([
    { title: "", description: "", priority: "Medium", target: 100, weight: 50 }
  ]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const addTask = () => {
    setTasks([...tasks, { title: "", description: "", priority: "Medium", target: 100, weight: 50 }]);
  };

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const updateTask = (index: number, field: keyof Task, value: any) => {
    const updatedTasks = tasks.map((task, i) => 
      i === index ? { ...task, [field]: value } : task
    );
    setTasks(updatedTasks);
  };

  const handleAISuggestion = (suggestion: string) => {
    const emptyTaskIndex = tasks.findIndex(task => !task.title);
    if (emptyTaskIndex >= 0) {
      updateTask(emptyTaskIndex, 'title', suggestion);
    } else {
      setTasks([...tasks, { title: suggestion, description: "", priority: "Medium", target: 100, weight: 50 }]);
    }
  };

  const handleSubmit = () => {
    // Here you would normally save the plan
    console.log("Creating plan:", { planType, selectedEmployee, tasks });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create {planType} Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Selection */}
          <div>
            <Label htmlFor="employee">Select Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} - {employee.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Suggestions */}
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Suggested Tasks for {planType} Planning
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAISuggestions(!showAISuggestions)}
              >
                {showAISuggestions ? 'Hide' : 'Show'} Suggestions
              </Button>
            </div>
            
            {showAISuggestions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {aiSuggestedTasks[planType].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleAISuggestion(suggestion)}
                    className="text-left p-2 text-xs bg-white border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Tasks</Label>
              <Button variant="outline" size="sm" onClick={addTask}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>

            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div key={index} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium text-sm">Task {index + 1}</h4>
                    {tasks.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTask(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label>Task Title</Label>
                      <Input
                        value={task.title}
                        onChange={(e) => updateTask(index, 'title', e.target.value)}
                        placeholder="Enter task title"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={task.description}
                        onChange={(e) => updateTask(index, 'description', e.target.value)}
                        placeholder="Task description (optional)"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Priority</Label>
                      <Select value={task.priority} onValueChange={(value) => updateTask(index, 'priority', value)}>
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
                      <Input
                        type="number"
                        value={task.target}
                        onChange={(e) => updateTask(index, 'target', parseInt(e.target.value) || 0)}
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <Label>Weight</Label>
                      <Input
                        type="number"
                        value={task.weight}
                        onChange={(e) => updateTask(index, 'weight', parseFloat(e.target.value) || 0)}
                        step="0.1"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={
                        task.priority === "High" ? "bg-red-100 text-red-700" :
                        task.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }>
                        {task.priority} Priority
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedEmployee || tasks.some(task => !task.title)}>
              Create {planType} Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}