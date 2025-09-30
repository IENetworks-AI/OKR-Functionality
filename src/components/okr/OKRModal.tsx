import { useState, useEffect, Fragment } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, RefreshCw, X, Plus, Loader2, Sparkles, Edit, Trash2, Save } from "lucide-react";
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

interface Objective {
  id: string;
  title: string;
  alignment: string;
  keyResults: KeyResult[];
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
  progress?: number;
  // For milestone type
  milestones?: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  weight: number;
}

interface AISuggestionCardProps {
  suggestion: string;
  suggestionCount: number;
  onCancel: () => void;
}

export function OKRModal({ open, onOpenChange, onSave, existingOKR }: OKRModalProps) {
  const [alignment, setAlignment] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [generatingObjectiveId, setGeneratingObjectiveId] = useState<string | null>(null);
  const [supervisorKeyResults, setSupervisorKeyResults] = useState<string[]>([]);
  const [loadingSupervisorKRs, setLoadingSupervisorKRs] = useState(false);

  // Fetch supervisor's key results dynamically
  useEffect(() => {
    const loadSupervisorKeyResults = async () => {
      const supervisorUserId = import.meta.env.VITE_SUPERVISOR_USER_ID;
      
      if (!supervisorUserId) {
        console.warn('⚠️ No VITE_SUPERVISOR_USER_ID configured');
        return;
      }

      console.log('🔄 Loading supervisor key results for:', supervisorUserId);
      setLoadingSupervisorKRs(true);
      try {
        const keyResults = await fetchSupervisorKeyResults(supervisorUserId);
        console.log('📦 Received key results:', keyResults);
        
        const titles = keyResults.map(kr => kr.title);
        console.log('📝 Extracted titles:', titles);
        
        setSupervisorKeyResults(titles);
        console.log('✅ Loaded supervisor key results count:', titles.length);
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
      setAlignment(existingOKR.alignment || "");
      setDeadline(existingOKR.deadline);
      setObjectives(existingOKR.objectives || []);
    } else if (!open) {
      // Reset when closing
      setAlignment("");
      setDeadline(undefined);
      setObjectives([]);
      setGeneratingObjectiveId(null);
    }
  }, [open, existingOKR]);

  const generateAIObjectiveAndKeyResults = async (input: string, isAlignment: boolean = false) => {
    setIsGenerating(true);
    try {
      // Delegate to shared OKR generator wired to backend
      const { title, keyResults } = await genOKR(input, isAlignment);
      return { title, keyResults };
    } catch (err) {
      console.error("OKR generation error:", err);
      return { title: input, keyResults: [] };
    } finally {
      setIsGenerating(false);
      setGeneratingObjectiveId(null);
    }
  };

  const handleAlignmentChange = async (value: string) => {
    setAlignment(value);
    
    const { title, keyResults } = await generateAIObjectiveAndKeyResults(value, true);
    if (keyResults.length > 0) {
      // Create a new objective with the AI-generated key results
      const newObjective: Objective = {
        id: `obj-${Date.now()}`,
        title,
        alignment: value,
        keyResults
      };
      setObjectives((prev) => [...prev, newObjective]);
    }
  };

  const calculateProgress = (keyResult: KeyResult): number => {
    if (keyResult.metricType === "milestone") {
      if (!keyResult.milestones || keyResult.milestones.length === 0) return 0;
      
      const totalWeight = keyResult.milestones.reduce((sum, m) => sum + m.weight, 0);
      if (totalWeight === 0) return 0;
      
      const completedWeight = keyResult.milestones
        .filter(m => m.completed)
        .reduce((sum, m) => sum + m.weight, 0);
      
      return Math.round((completedWeight / totalWeight) * 100);
    }
    
    if (keyResult.metricType === "achieved") {
      return keyResult.completed ? 100 : 0;
    }
    
    if (keyResult.targetValue === 0) return 0;
    
    return Math.min(100, Math.round((keyResult.currentValue / keyResult.targetValue) * 100));
  };

  const calculateObjectiveProgress = (objective: Objective): number => {
    if (!objective.keyResults.length) return 0;
    
    const totalWeight = objective.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight === 0) return 0;
    
    const weightedProgress = objective.keyResults.reduce((sum, kr) => {
      return sum + (calculateProgress(kr) * kr.weight);
    }, 0);
    
    return Math.round(weightedProgress / totalWeight);
  };

  const startEdit = (type: "objective" | "keyResult", objectiveId: string, keyResultId?: string) => {
    if (type === "objective") {
      const objective = objectives.find(obj => obj.id === objectiveId);
      if (objective) {
        setEditingId(`objective-${objectiveId}`);
        setEditData({
          type: "objective",
          objectiveId,
          title: objective.title,
          alignment: objective.alignment || ""
        });
      }
    } else if (type === "keyResult" && keyResultId) {
      const objective = objectives.find(obj => obj.id === objectiveId);
      const keyResult = objective?.keyResults.find(kr => kr.id === keyResultId);
      
      if (keyResult) {
        setEditingId(`keyResult-${keyResultId}`);
        setEditData({
          type: "keyResult",
          objectiveId,
          keyResultId,
          title: keyResult.title,
          metricType: keyResult.metricType,
          targetValue: keyResult.targetValue,
          currentValue: keyResult.currentValue,
          weight: keyResult.weight,
          completed: keyResult.completed,
          milestones: keyResult.milestones || []
        });
      }
    }
  };

  const saveEdit = () => {
    if (!editData) return;
    
    if (editData.type === "objective") {
      setObjectives(objectives.map(obj => 
        obj.id === editData.objectiveId 
          ? { ...obj, title: editData.title, alignment: editData.alignment }
          : obj
      ));
    } else if (editData.type === "keyResult") {
      setObjectives(objectives.map(obj => 
        obj.id === editData.objectiveId 
          ? { 
              ...obj, 
              keyResults: obj.keyResults.map(kr => 
                kr.id === editData.keyResultId 
                  ? { 
                      ...kr, 
                      title: editData.title,
                      metricType: editData.metricType,
                      targetValue: Number(editData.targetValue),
                      currentValue: Number(editData.currentValue),
                      weight: Number(editData.weight),
                      completed: editData.metricType === "achieved" 
                        ? editData.completed 
                        : kr.completed,
                      milestones: editData.milestones || []
                    }
                  : kr
              )
            }
          : obj
      ));
    }
    
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const addObjective = () => {
    const newId = `obj-${Date.now()}`;
    const newObjective: Objective = {
      id: newId,
      title: "New Objective",
      alignment: "",
      keyResults: []
    };
    
    setObjectives([...objectives, newObjective]);
    startEdit("objective", newId);
  };

  const addKeyResult = (objectiveId: string) => {
    const newId = `kr-${Date.now()}`;
    const newKeyResult: KeyResult = {
      id: newId,
      title: "New Key Result",
      metricType: "numeric",
      targetValue: 100,
      currentValue: 0,
      weight: 0, // Will be adjusted later to ensure sum is 100
      completed: false
    };
    
    setObjectives(objectives.map(obj => 
      obj.id === objectiveId 
        ? { ...obj, keyResults: [...obj.keyResults, newKeyResult] }
        : obj
    ));
    
    // Adjust weights to ensure they sum to 100
    adjustWeights(objectiveId);
    
    startEdit("keyResult", objectiveId, newId);
  };

  const adjustWeights = (objectiveId: string) => {
    setObjectives(objectives.map(obj => {
      if (obj.id !== objectiveId) return obj;
      
      const totalKRs = obj.keyResults.length;
      if (totalKRs === 0) return obj;
      
      const equalWeight = Math.round(100 / totalKRs);
      const remainder = 100 - (equalWeight * totalKRs);
      
      const updatedKeyResults = obj.keyResults.map((kr, index) => ({
        ...kr,
        weight: index === 0 ? equalWeight + remainder : equalWeight
      }));
      
      return { ...obj, keyResults: updatedKeyResults };
    }));
  };

  const deleteObjective = (objectiveId: string) => {
    setObjectives(objectives.filter(obj => obj.id !== objectiveId));
  };

  const deleteKeyResult = (objectiveId: string, keyResultId: string) => {
    setObjectives(objectives.map(obj => 
      obj.id === objectiveId 
        ? { ...obj, keyResults: obj.keyResults.filter(kr => kr.id !== keyResultId) }
        : obj
    ));
    
    // Adjust weights after deletion
    adjustWeights(objectiveId);
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData({ ...editData, [field]: value });
  };

  const formatMetricValue = (keyResult: KeyResult): string => {
    switch (keyResult.metricType) {
      case "milestone":
        if (!keyResult.milestones || keyResult.milestones.length === 0) return "No milestones";
        const completed = keyResult.milestones.filter(m => m.completed).length;
        return `${completed}/${keyResult.milestones.length} milestones`;
      case "percentage":
        return `${keyResult.currentValue}% / ${keyResult.targetValue}%`;
      case "currency":
        return `$${keyResult.currentValue.toLocaleString()} / $${keyResult.targetValue.toLocaleString()}`;
      case "achieved":
        return keyResult.completed ? "Achieved" : "Not Achieved";
      default:
        return `${keyResult.currentValue} / ${keyResult.targetValue}`;
    }
  };

  const handleSaveOKR = () => {
    onSave({
      deadline,
      objectives
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">OKR</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Objective Deadline *</Label>
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
                  {deadline ? format(deadline, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alignment">Select Alignment to Generate Objective</Label>
            <Select onValueChange={handleAlignmentChange}>
              <SelectTrigger>
                <SelectValue placeholder={loadingSupervisorKRs ? "Loading..." : supervisorKeyResults.length > 0 ? "Select supervisor's key result" : "No key results available"} />
              </SelectTrigger>
              <SelectContent>
                {loadingSupervisorKRs ? (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Loading...
                  </SelectItem>
                ) : supervisorKeyResults.length === 0 ? (
                  <SelectItem value="none" disabled>No key results found</SelectItem>
                ) : (
                  supervisorKeyResults.map((keyResult, index) => (
                    <SelectItem key={`${keyResult}-${index}`} value={keyResult}>
                      {keyResult}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {supervisorKeyResults.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {supervisorKeyResults.length} key result{supervisorKeyResults.length !== 1 ? 's' : ''} available
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Objectives and Key Results</h3>
            <Button onClick={addObjective} className="bg-primary hover:bg-primary/90" disabled={isGenerating}>
              {isGenerating && generatingObjectiveId ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add Objective
            </Button>
          </div>

          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating AI key results...
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead className="w-1/4">Objectives</TableHead>
                  <TableHead className="w-2/5">Key Results</TableHead>
                  <TableHead className="w-1/5">Metrics</TableHead>
                  <TableHead className="w-20">Weight</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {objectives.map((objective, objIndex) => (
                  <Fragment key={`objective-block-${objective.id}`}>
                    <TableRow className="bg-gray-50">
                      <TableCell className="font-medium">{objIndex + 1}</TableCell>
                      <TableCell>
                        {editingId === `objective-${objective.id}` ? (
                          <div className="space-y-2">
                            <Input
                              value={editData.title}
                              onChange={(e) => handleInputChange("title", e.target.value)}
                            />
                            <Select
                              value={editData.alignment}
                              onValueChange={(v) => handleInputChange("alignment", v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select alignment" />
                              </SelectTrigger>
                              <SelectContent>
                                {supervisorKeyResults.map(kr => (
                                  <SelectItem key={kr} value={kr}>
                                    {kr}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              disabled={isGenerating}
                              onClick={async () => {
                                const inp = editData.alignment || alignment;
                                if (!inp) return;
                                setGeneratingObjectiveId(objective.id);
                                const { title, keyResults } = await generateAIObjectiveAndKeyResults(inp, true);
                                setEditData((prev: any) => ({ ...prev, title }));
                                setObjectives(prev => prev.map(obj => 
                                  obj.id === editData.objectiveId ? { ...obj, keyResults, title } : obj
                                ));
                              }}
                            >
                              {isGenerating && generatingObjectiveId === objective.id && <Loader2 className="mr-2 animate-spin" />}
                              Generate AI Key Results
                            </Button>
                          </div>
                        ) : (
                          <div className="font-semibold">{objective.title}</div>
                        )}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {editingId === `objective-${objective.id}` ? (
                            <>
                              <Button size="sm" onClick={saveEdit} className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700">
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button size="sm" onClick={cancelEdit} className="h-8 w-8 p-0 bg-gray-500 hover:bg-gray-600">
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => startEdit("objective", objective.id)} 
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => deleteObjective(objective.id)} 
                                className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={async () => {
                                  const inp = objective.alignment || alignment;
                                  if (!inp) return;
                                  setGeneratingObjectiveId(objective.id);
                                  const { title, keyResults } = await generateAIObjectiveAndKeyResults(inp, true);
                                  setObjectives(prev => prev.map(o => o.id === objective.id ? { ...o, title, keyResults } : o));
                                }} 
                                className="h-8 w-8 p-0"
                                disabled={isGenerating}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            size="sm" 
                            onClick={() => addKeyResult(objective.id)} 
                            className="h-8 bg-primary hover:bg-primary/90"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            KR
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {objective.keyResults.map((keyResult, krIndex) => (
                      <Fragment key={`${objective.id}-${keyResult.id}-${krIndex}`}>
                        <TableRow>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell>
                            {editingId === `keyResult-${keyResult.id}` ? (
                              <div className="space-y-2">
                                <Input
                                  value={editData.title}
                                  onChange={(e) => handleInputChange("title", e.target.value)}
                                  className="mb-2"
                                />
                                <Select 
                                  value={editData.metricType} 
                                  onValueChange={(value) => handleInputChange("metricType", value)}
                                >
                                  <SelectTrigger className="w-full">
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
                                {editData.metricType === "milestone" ? (
                                  <div className="space-y-2">
                                    <Label>Milestones</Label>
                                    {editData.milestones.map((m: Milestone, index: number) => (
                                      <div key={m.id} className="flex items-center space-x-2">
                                        <Input 
                                          value={m.title} 
                                          onChange={(e) => {
                                            const newMilestones = [...editData.milestones];
                                            newMilestones[index].title = e.target.value;
                                            handleInputChange("milestones", newMilestones);
                                          }}
                                        />
                                        <Input 
                                          type="number" 
                                          value={m.weight} 
                                          onChange={(e) => {
                                            const newMilestones = [...editData.milestones];
                                            newMilestones[index].weight = Number(e.target.value);
                                            handleInputChange("milestones", newMilestones);
                                          }}
                                        />
                                        <Button 
                                          variant="destructive" 
                                          size="sm" 
                                          onClick={() => {
                                            const newMilestones = editData.milestones.filter((_: any, i: number) => i !== index);
                                            handleInputChange("milestones", newMilestones);
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button 
                                      onClick={() => {
                                        const newId = `m-${Date.now()}`;
                                        const newMilestone = {id: newId, title: "", completed: false, weight: 0};
                                        handleInputChange("milestones", [...editData.milestones, newMilestone]);
                                      }}
                                    >
                                      <Plus className="mr-2 h-4 w-4" /> Add Milestone
                                    </Button>
                                  </div>
                                ) : editData.metricType === "achieved" ? (
                                  <div className="space-y-2">
                                    <Label>Achieved</Label>
                                    <input 
                                      type="checkbox" 
                                      checked={editData.completed} 
                                      onChange={(e) => handleInputChange("completed", e.target.checked)} 
                                    />
                                  </div>
                                ) : (
                                  <div className="flex space-x-2">
                                    <div className="flex-1">
                                      <Label className="text-xs">Current</Label>
                                      <Input
                                        type="number"
                                        value={editData.currentValue}
                                        onChange={(e) => handleInputChange("currentValue", e.target.value)}
                                        className="w-full"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <Label className="text-xs">Target</Label>
                                      <Input
                                        type="number"
                                        value={editData.targetValue}
                                        onChange={(e) => handleInputChange("targetValue", e.target.value)}
                                        className="w-full"
                                      />
                                    </div>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <Label>Weight</Label>
                                  <Input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editData.weight}
                                    onChange={(e) => handleInputChange("weight", e.target.value)}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>{keyResult.title}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === `keyResult-${keyResult.id}` ? (
                              null
                            ) : (
                              <div>{formatMetricValue(keyResult)}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === `keyResult-${keyResult.id}` ? (
                              null
                            ) : (
                              <div>{keyResult.weight}%</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {editingId === `keyResult-${keyResult.id}` ? (
                                <>
                                  <Button size="sm" onClick={saveEdit} className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700">
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" onClick={cancelEdit} className="h-8 w-8 p-0 bg-gray-500 hover:bg-gray-600">
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={() => startEdit("keyResult", objective.id, keyResult.id)} 
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={() => deleteKeyResult(objective.id, keyResult.id)} 
                                    className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Milestone rows for milestone key results */}
                        {keyResult.metricType === "milestone" && keyResult.milestones && keyResult.milestones.map((milestone, mIndex) => (
                          <TableRow key={`milestone-${milestone.id}`} className="bg-gray-50/50">
                            <TableCell colSpan={2}></TableCell>
                            <TableCell className="pl-8">
                              {milestone.title}
                            </TableCell>
                            <TableCell colSpan={2}>
                              <div className="text-sm text-gray-500">
                                Weight: {milestone.weight}%
                              </div>
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {objectives.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No objectives defined yet. Click "Add Objective" to get started or use the alignment dropdown to generate AI suggestions.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveOKR} className="bg-primary hover:bg-primary/90" disabled={isGenerating}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AISuggestionCard({
  suggestion,
  suggestionCount,
  onCancel
}: AISuggestionCardProps) {
  return (
    <div className="bg-ai-suggestion border border-ai-icon/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-ai-icon" />
          <span className="text-sm font-medium text-ai-suggestion-foreground">
            AI Key Result Suggestion
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs px-3 py-1 h-7 border-ai-icon/30 text-ai-suggestion-foreground"
          >
            I have made you {suggestionCount} Suggestions
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 w-7 p-0 hover:bg-ai-icon/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-ai-suggestion-foreground p-2 rounded bg-ai-icon/5">
          {suggestion}
        </p>
      </div>
    </div>
  );
}
