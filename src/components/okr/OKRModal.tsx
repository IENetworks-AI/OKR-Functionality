import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { KeyResultItem } from "./KeyResultItem";
import { askOkrModel } from "@/lib/ai";
import { OKRData, OKRKeyResult, Milestone, AITask } from "@/types";

interface OKRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (okr: OKRData) => void;
  existingOKR?: OKRData;
}

export function OKRModal({ open, onOpenChange, onSave, existingOKR }: OKRModalProps) {
  const [objective, setObjective] = useState("");
  const [alignment, setAlignment] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [keyResults, setKeyResults] = useState<OKRKeyResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Supervisor's key results for alignment
  const supervisorKeyResults = [
    "Increase customer retention rate by 15%",
    "Reduce customer churn by 8% this quarter", 
    "Achieve 95% customer satisfaction score",
    "Generate 1.5M revenue from existing customers",
    "Expand market share by 12%"
  ];

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
    }
  }, [open, existingOKR]);

  const generateAIKeyResults = async (obj: string) => {
    setIsGenerating(true);
    try {
      const prompt = `Generate 3-4 short, actionable key results for the objective: "${obj}". Each with full metrics. Return JSON array: [{"text": "short title", "weight": number}]. Weights sum to 100.`;
      const { suggestion, error } = await askOkrModel({
        prompt,
        params: { temperature: 0.3 },
      });

      if (error) {
        console.error("AI Error:", error);
        return [];
      }

      // Parse response
      let jsonStr = String(suggestion).replace(/```json\s*/, '').replace(/```\s*$/, '');
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) jsonStr = jsonMatch[0];
      const aiKRs = JSON.parse(jsonStr);
      if (Array.isArray(aiKRs)) {
        return aiKRs.map((kr: AITask, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          text: kr.title || "Untitled",
          progress: 100,
          milestones: [],
          isAI: true,
          weight: kr.weight || Math.round(100 / aiKRs.length),
          deadline: undefined
        }));
      }
      return [];
    } catch (parseError) {
      console.error("Parse error:", parseError);
      return [];
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAlignmentChange = async (value: string) => {
    setAlignment(value);
    setObjective(value);
    
    const newKRs = await generateAIKeyResults(value);
    if (newKRs.length > 0) {
      setKeyResults(newKRs);
    }
  };

  const handleRegenerateKeyResult = async (id: string, prompt: string) => {
    setIsGenerating(true);
    try {
      const currentKR = keyResults.find(kr => kr.id === id);
      if (!currentKR) return;

      const regenPrompt = `Regenerate this key result with refinement: "${prompt}". Original: "${currentKR.text}". Return JSON: {"text": "new short text", "weight": number}.`;
      const { suggestion, error } = await askOkrModel({
        prompt: regenPrompt,
        params: { temperature: 0.3 },
      });

      if (error) {
        console.error("AI Error:", error);
        return;
      }

      // Parse response
      const jsonStr = String(suggestion).replace(/```json\s*/, '').replace(/```\s*$/, '');
      const newKR = JSON.parse(jsonStr) as { text?: string; weight?: number };

      setKeyResults(keyResults.map(kr => 
        kr.id === id ? { ...kr, text: newKR.text || kr.text, weight: newKR.weight || kr.weight } : kr
      ));
    } catch (parseError) {
      console.error("Parse error:", parseError);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddKeyResult = () => {
    const newKeyResult: OKRKeyResult = {
      id: Date.now().toString(),
      text: "",
      progress: 100,
      milestones: [],
      weight: 25,
      deadline: undefined
    };
    setKeyResults([...keyResults, newKeyResult]);
  };

  const handleDeleteKeyResult = (id: string) => {
    setKeyResults(keyResults.filter(kr => kr.id !== id));
  };

  const handleUpdateKeyResult = (id: string, text: string) => {
    setKeyResults(keyResults.map(kr => 
      kr.id === id ? { ...kr, text } : kr
    ));
  };

  const handleUpdateKeyResultWeight = (id: string, weight: number) => {
    setKeyResults(keyResults.map(kr => 
      kr.id === id ? { ...kr, weight } : kr
    ));
  };

  const handleUpdateKeyResultDeadline = (id: string, deadline: Date | undefined) => {
    setKeyResults(keyResults.map(kr => 
      kr.id === id ? { ...kr, deadline } : kr
    ));
  };

  const handleSaveOKR = () => {
    onSave({
      objective,
      alignment,
      deadline,
      keyResults
    });
    onOpenChange(false);
  };

  const handleAddMilestone = (keyResultId: string) => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      text: "New Milestone",
      completed: false
    };
    
    setKeyResults(keyResults.map(kr => 
      kr.id === keyResultId 
        ? { ...kr, milestones: [...kr.milestones, newMilestone] }
        : kr
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">OKR</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Objective Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Objective</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="objective">Objective *</Label>
                <Input
                  id="objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Select alignment or enter custom objective"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alignment">Alignment *</Label>
                <Select value={alignment} onValueChange={handleAlignmentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supervisor's key result" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisorKeyResults.map((keyResult, index) => (
                      <SelectItem key={index} value={keyResult}>{keyResult}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
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
            </div>
          </div>

          {/* Key Result Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Key Result</h3>
              <Button onClick={handleAddKeyResult} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Key Result
              </Button>
            </div>

            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating AI key results...
              </div>
            )}

            {/* Key Results List */}
            <div className="space-y-4">
              {keyResults.map((keyResult) => (
                <KeyResultItem
                  key={keyResult.id}
                  keyResult={keyResult}
                  onDelete={handleDeleteKeyResult}
                  onUpdate={handleUpdateKeyResult}
                  onUpdateWeight={handleUpdateKeyResultWeight}
                  onUpdateDeadline={handleUpdateKeyResultDeadline}
                  onAddMilestone={handleAddMilestone}
                  onRegenerate={keyResult.isAI ? handleRegenerateKeyResult : undefined}
                />
              ))}
            </div>
          </div>
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