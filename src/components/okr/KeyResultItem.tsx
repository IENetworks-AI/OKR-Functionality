import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Calendar, Plus, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { OKRKeyResult } from "@/types";

interface KeyResultItemProps {
  keyResult: OKRKeyResult;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onUpdateWeight: (id: string, weight: number) => void;
  onUpdateDeadline: (id: string, deadline: Date | undefined) => void;
  onAddMilestone: (keyResultId: string) => void;
  onRegenerate?: (id: string, prompt: string) => void;
}

export function KeyResultItem({ 
  keyResult, 
  onDelete, 
  onUpdate, 
  onUpdateWeight,
  onUpdateDeadline,
  onAddMilestone,
  onRegenerate 
}: KeyResultItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(keyResult.text);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [editWeight, setEditWeight] = useState(keyResult.weight.toString());

  const handleEdit = () => {
    if (isEditing) {
      onUpdate(keyResult.id, editText);
    }
    setIsEditing(!isEditing);
  };

  const handleEditWeight = () => {
    if (isEditingWeight) {
      const weightValue = parseInt(editWeight);
      if (!isNaN(weightValue) && weightValue >= 0 && weightValue <= 100) {
        onUpdateWeight(keyResult.id, weightValue);
      }
    }
    setIsEditingWeight(!isEditingWeight);
  };

  const handleRegenerate = () => {
    if (onRegenerate && regeneratePrompt.trim()) {
      onRegenerate(keyResult.id, regeneratePrompt);
      setRegeneratePrompt("");
      setShowRegenerateDialog(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      {/* AI Highlight */}
      {keyResult.isAI && (
        <div className="bg-gradient-to-r from-ai-icon/10 to-ai-icon/5 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-ai-icon" />
            <span className="text-sm font-semibold text-ai-suggestion-foreground">
              This is a Key Result from the AI
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          {isEditing ? (
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="text-sm"
              onBlur={handleEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEdit();
                }
              }}
              autoFocus
            />
          ) : (
            <p 
              className="text-sm cursor-pointer hover:bg-muted p-2 rounded"
              onClick={handleEdit}
            >
              {keyResult.text}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Select defaultValue="milestone">
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="target">Target</SelectItem>
                <SelectItem value="metric">Metric</SelectItem>
                <SelectItem value="numeric">Numeric</SelectItem>
                <SelectItem value="currency">Currency</SelectItem>
              </SelectContent>
            </Select>
            
            {isEditingWeight ? (
              <Input
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="w-16 h-8 text-xs text-center"
                onBlur={handleEditWeight}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditWeight();
                  }
                }}
                autoFocus
              />
            ) : (
              <span 
                className="text-sm font-medium cursor-pointer hover:bg-muted px-2 py-1 rounded"
                onClick={handleEditWeight}
              >
                {keyResult.weight}%
              </span>
            )}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    keyResult.deadline && "text-primary"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={keyResult.deadline}
                  onSelect={(date) => onUpdateDeadline(keyResult.id, date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {onRegenerate && (
            <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-ai-suggestion-foreground hover:bg-ai-icon/10"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Refine AI Suggestion</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter your prompt to refine the suggestion (e.g., 'focus on customer satisfaction', 'make it more specific')"
                    value={regeneratePrompt}
                    onChange={(e) => setRegeneratePrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRegenerateDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRegenerate}
                      disabled={!regeneratePrompt.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(keyResult.id)}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Milestones */}
      {keyResult.milestones.length > 0 && (
        <div className="ml-6 space-y-2">
          {keyResult.milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              {milestone.text}
            </div>
          ))}
        </div>
      )}
      
      {/* Add Milestone Button */}
      <div className="ml-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddMilestone(keyResult.id)}
          className="h-8 text-xs text-primary hover:bg-primary/10"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Milestone
        </Button>
      </div>
    </div>
  );
}