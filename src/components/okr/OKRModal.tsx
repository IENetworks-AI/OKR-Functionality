import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sparkles, RefreshCw, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AISuggestionCard } from "./AISuggestionCard";
import { KeyResultItem } from "./KeyResultItem";

interface OKRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface KeyResult {
  id: string;
  text: string;
  progress: number;
  milestones: Milestone[];
  isAI?: boolean;
  weight: number;
  deadline?: Date;
}

interface Milestone {
  id: string;
  text: string;
  completed: boolean;
}

export function OKRModal({ open, onOpenChange }: OKRModalProps) {
  const [objective, setObjective] = useState("");
  const [alignment, setAlignment] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [aiSuggestionCount, setAiSuggestionCount] = useState(0);
  const [currentAISuggestion, setCurrentAISuggestion] = useState("Retain 2,000,000 by the end of the month");

  // Supervisor's key results for alignment
  const supervisorKeyResults = [
    "Increase customer retention rate by 15%",
    "Reduce customer churn by 8% this quarter", 
    "Achieve 95% customer satisfaction score",
    "Generate 1.5M revenue from existing customers",
    "Expand market share by 12%"
  ];

  const handleAlignmentChange = (value: string) => {
    setAlignment(value);
    setObjective(value); // Set selected supervisor's key result as objective
    
    // Automatically generate 3-4 AI key results
    setShowAISuggestion(true);
    setAiSuggestionCount(4);
    
    // Generate multiple AI key results automatically
    const suggestions = [
      "Retain 2,000,000 by the end of the month",
      "Increase customer retention rate by 15%", 
      "Reduce customer churn by 8% this quarter",
      "Achieve 95% customer satisfaction score"
    ];
    
    const newKeyResults: KeyResult[] = suggestions.map((suggestion, index) => ({
      id: `ai-${Date.now()}-${index}`,
      text: suggestion,
      progress: 100,
      milestones: [],
      isAI: true,
      weight: 25,
      deadline: undefined
    }));
    
    setKeyResults(newKeyResults);
  };

  const generateAISuggestion = () => {
    const suggestions = [
      "Retain 2,000,000 by the end of the month",
      "Increase customer retention rate by 15%",
      "Reduce customer churn by 8% this quarter",
      "Achieve 95% customer satisfaction score",
      "Generate 1.5M revenue from existing customers"
    ];
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    setCurrentAISuggestion(randomSuggestion);
  };

  const handleRegenerateAI = () => {
    generateAISuggestion();
  };

  const handleAddAISuggestion = () => {
    const newKeyResult: KeyResult = {
      id: Date.now().toString(),
      text: currentAISuggestion,
      progress: 100,
      milestones: [],
      isAI: true,
      weight: 25,
      deadline: undefined
    };
    setKeyResults([...keyResults, newKeyResult]);
    setShowAISuggestion(false);
  };

  const handleRegenerateKeyResult = (id: string, prompt: string) => {
    // Simulate AI regeneration with prompt
    const suggestions = [
      `Focus on ${prompt}: Retain 2,000,000 by the end of the month`,
      `${prompt} optimization: Increase customer retention rate by 15%`,
      `${prompt} strategy: Reduce customer churn by 8% this quarter`,
      `${prompt} target: Achieve 95% customer satisfaction score`
    ];
    
    const newSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    setKeyResults(keyResults.map(kr => 
      kr.id === id ? { ...kr, text: newSuggestion } : kr
    ));
  };

  const handleAddKeyResult = () => {
    const newKeyResult: KeyResult = {
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
    // Here you would typically save to your backend/database
    console.log('Saving OKR:', {
      objective,
      alignment,
      deadline,
      keyResults
    });
    
    // For now, just close the modal
    onOpenChange(false);
    
    // Reset form
    setObjective("");
    setAlignment("");
    setDeadline(undefined);
    setKeyResults([]);
    setShowAISuggestion(false);
  };

  const handleAddMilestone = (keyResultId: string) => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      text: "Milestone",
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

            {/* AI Suggestion */}
            {showAISuggestion && (
              <AISuggestionCard
                suggestion={currentAISuggestion}
                suggestionCount={aiSuggestionCount}
                onCancel={() => setShowAISuggestion(false)}
              />
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
          <Button onClick={handleSaveOKR} className="bg-primary hover:bg-primary/90">
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}