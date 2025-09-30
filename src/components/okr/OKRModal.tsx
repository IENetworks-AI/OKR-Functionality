import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, Plus, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { generateAIObjectiveAndKeyResults as genOKR } from "@/lib/okrAi";
import { fetchSupervisorKeyResults } from "@/lib/okrApi";

interface OKRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (okr: any) => void;
  existingOKR?: any;
}

interface KeyResult {
  id: string;
  title: string;
  metricType: "milestone" | "percentage" | "numeric" | "currency" | "achieved";
  targetValue: number;
  currentValue: number;
  weight: number;
  completed: boolean;
  deadline?: Date;
  milestones?: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  weight: number;
}

export function OKRModal({ open, onOpenChange, onSave, existingOKR }: OKRModalProps) {
  const [objective, setObjective] = useState("");
  const [alignment, setAlignment] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [supervisorKeyResults, setSupervisorKeyResults] = useState<string[]>([]);
  const [loadingSupervisorKRs, setLoadingSupervisorKRs] = useState(false);
  const [newMilestone, setNewMilestone] = useState<{ [key: string]: string }>({});

  // Fetch supervisor's key results
  useEffect(() => {
    const loadSupervisorKeyResults = async () => {
      const supervisorUserId = import.meta.env.VITE_SUPERVISOR_USER_ID;
      
      if (!supervisorUserId) {
        console.warn('⚠️ No VITE_SUPERVISOR_USER_ID configured');
        return;
      }

      setLoadingSupervisorKRs(true);
      try {
        const keyResults = await fetchSupervisorKeyResults(supervisorUserId);
        const titles = keyResults.map(kr => kr.title);
        setSupervisorKeyResults(titles);
      } catch (err) {
        console.error('❌ Failed to load supervisor key results:', err);
      } finally {
        setLoadingSupervisorKRs(false);
      }
    };

    if (open) {
      loadSupervisorKeyResults();
    }
  }, [open]);

  useEffect(() => {
    if (open && existingOKR) {
      setObjective(existingOKR.objective || "");
      setAlignment(existingOKR.alignment || "");
      setDeadline(existingOKR.deadline);
      setKeyResults(existingOKR.keyResults || []);
    } else if (!open) {
      // Reset when closing
      setObjective("");
      setAlignment("");
      setDeadline(undefined);
      setKeyResults([]);
      setNewMilestone({});
    }
  }, [open, existingOKR]);

  const handleAlignmentChange = async (value: string) => {
    setAlignment(value);
    setIsGenerating(true);
    
    try {
      const { title, keyResults: generatedKRs } = await genOKR(value, true);
      setObjective(title);
      
      // Map generated key results with proper metric types
      const mappedKRs: KeyResult[] = generatedKRs.map((kr: any) => ({
        id: kr.id,
        title: kr.title,
        metricType: kr.metricType || "numeric",
        targetValue: kr.targetValue || 100,
        currentValue: kr.currentValue || 0,
        weight: kr.weight || 0,
        completed: kr.completed || false,
        deadline: undefined,
        milestones: kr.milestones || []
      }));
      
      setKeyResults(mappedKRs);
    } catch (err) {
      console.error("OKR generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const addKeyResult = () => {
    const newKR: KeyResult = {
      id: `kr-${Date.now()}`,
      title: "",
      metricType: "milestone",
      targetValue: 100,
      currentValue: 0,
      weight: 0,
      completed: false,
      milestones: []
    };
    
    setKeyResults([...keyResults, newKR]);
  };

  const updateKeyResult = (id: string, field: string, value: any) => {
    setKeyResults(keyResults.map(kr => 
      kr.id === id ? { ...kr, [field]: value } : kr
    ));
  };

  const deleteKeyResult = (id: string) => {
    setKeyResults(keyResults.filter(kr => kr.id !== id));
  };

  const addMilestone = (krId: string) => {
    const milestoneTitle = newMilestone[krId] || "";
    if (!milestoneTitle.trim()) return;

    setKeyResults(keyResults.map(kr => {
      if (kr.id === krId) {
        const newMilestoneObj: Milestone = {
          id: `m-${Date.now()}`,
          title: milestoneTitle,
          completed: false,
          weight: 0
        };
        return {
          ...kr,
          milestones: [...(kr.milestones || []), newMilestoneObj]
        };
      }
      return kr;
    }));

    setNewMilestone({ ...newMilestone, [krId]: "" });
  };

  const deleteMilestone = (krId: string, milestoneId: string) => {
    setKeyResults(keyResults.map(kr => {
      if (kr.id === krId) {
        return {
          ...kr,
          milestones: (kr.milestones || []).filter(m => m.id !== milestoneId)
        };
      }
      return kr;
    }));
  };

  const calculateTotalWeight = () => {
    return keyResults.reduce((sum, kr) => sum + (kr.weight || 0), 0);
  };

  const handleSave = () => {
    onSave({
      objective,
      alignment,
      deadline,
      keyResults
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold">OKR</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Objective Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Objective</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>
                  <span className="text-red-500">*</span> Objective
                </Label>
                <div className="relative">
                  <Input
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="Enter objective"
                    className="pr-8"
                  />
                  {objective && (
                    <button
                      onClick={() => setObjective("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  <span className="text-red-500">*</span> Alignment
                </Label>
                <Select value={alignment} onValueChange={handleAlignmentChange} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingSupervisorKRs ? "Loading..." : "Select alignment"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingSupervisorKRs ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Loading...
                      </SelectItem>
                    ) : supervisorKeyResults.length === 0 ? (
                      <SelectItem value="none" disabled>No alignments available</SelectItem>
                    ) : (
                      supervisorKeyResults.map((kr, index) => (
                        <SelectItem key={`${kr}-${index}`} value={kr}>
                          {kr}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  <span className="text-red-500">*</span> Objective Deadline
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Key Results Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Key Result</h3>
              <Button 
                onClick={addKeyResult} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isGenerating}
              >
                <Plus className="w-4 h-4 mr-2" />
                Key Result
              </Button>
            </div>

            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                <Sparkles className="w-4 h-4" />
                Generating AI key results from alignment...
              </div>
            )}

            {/* Key Result Forms */}
            <div className="space-y-4">
              {keyResults.map((kr, index) => (
                <div key={kr.id} className="border rounded-lg p-4 space-y-4 relative">
                  <button
                    onClick={() => deleteKeyResult(kr.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 bg-white rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Key Result Name</Label>
                      <Input
                        placeholder="Enter key result name"
                        value={kr.title}
                        onChange={(e) => updateKeyResult(kr.id, "title", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Metric Type</Label>
                      <Select 
                        value={kr.metricType} 
                        onValueChange={(value) => updateKeyResult(kr.id, "metricType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select metric type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="numeric">Numeric</SelectItem>
                          <SelectItem value="currency">Currency</SelectItem>
                          <SelectItem value="achieved">Achieved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Weight</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Weight"
                          value={kr.weight || ''}
                          onChange={(e) => updateKeyResult(kr.id, "weight", Number(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Deadline</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !kr.deadline && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {kr.deadline ? format(kr.deadline, "PP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={kr.deadline}
                            onSelect={(date) => updateKeyResult(kr.id, "deadline", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Metric Type Specific Fields */}
                  {kr.metricType === "milestone" ? (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium">Milestones</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Set Milestone"
                          value={newMilestone[kr.id] || ""}
                          onChange={(e) => setNewMilestone({ ...newMilestone, [kr.id]: e.target.value })}
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addMilestone(kr.id);
                            }
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="100"
                            defaultValue="100"
                            className="w-20"
                            disabled
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                        <Button 
                          onClick={() => addMilestone(kr.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={!newMilestone[kr.id]?.trim()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Milestone
                        </Button>
                      </div>

                      {/* Display Milestones */}
                      {kr.milestones && kr.milestones.length > 0 && (
                        <div className="space-y-2 mt-3">
                          <Label className="text-xs text-gray-600">Added Milestones:</Label>
                          {kr.milestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-center gap-2 bg-white p-2 rounded border">
                              <span className="flex-1 text-sm">{milestone.title}</span>
                              <button
                                onClick={() => deleteMilestone(kr.id, milestone.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : kr.metricType === "achieved" ? (
                    <div className="flex items-center gap-2 bg-gray-50 p-4 rounded-lg">
                      <input
                        type="checkbox"
                        checked={kr.completed}
                        onChange={(e) => updateKeyResult(kr.id, "completed", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label className="text-sm cursor-pointer" onClick={() => updateKeyResult(kr.id, "completed", !kr.completed)}>
                        Mark as Achieved
                      </Label>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">
                          {kr.metricType === "percentage" ? "Initial Value (%)" : 
                           kr.metricType === "currency" ? "Initial Value ($)" : 
                           "Initial Value"}
                        </Label>
                        <Input
                          type="number"
                          placeholder={kr.metricType === "percentage" ? "0" : 
                                     kr.metricType === "currency" ? "0.00" : "0"}
                          value={kr.currentValue || ''}
                          onChange={(e) => updateKeyResult(kr.id, "currentValue", Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">
                          {kr.metricType === "percentage" ? "Target Value (%)" : 
                           kr.metricType === "currency" ? "Target Value ($)" : 
                           "Target Value"}
                        </Label>
                        <Input
                          type="number"
                          placeholder={kr.metricType === "percentage" ? "100" : 
                                     kr.metricType === "currency" ? "1000.00" : "100"}
                          value={kr.targetValue || ''}
                          onChange={(e) => updateKeyResult(kr.id, "targetValue", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {keyResults.length === 0 && !isGenerating && (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                No key results added yet. Click "+ Key Result" or select an alignment to generate AI suggestions.
              </div>
            )}
          </div>

          {/* Total Weight */}
          <div className="flex justify-end">
            <div className="text-sm">
              <span className="font-medium">Total Weight: </span>
              <span className={cn(
                "font-semibold",
                calculateTotalWeight() === 100 ? "text-green-600" : "text-red-600"
              )}>
                {calculateTotalWeight()}%
              </span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-center gap-4 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="min-w-[120px]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="min-w-[120px] bg-gray-200 hover:bg-gray-300 text-gray-700"
            disabled={isGenerating || !objective || !alignment || calculateTotalWeight() !== 100}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
