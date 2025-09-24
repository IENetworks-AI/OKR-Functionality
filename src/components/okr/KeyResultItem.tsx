import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Sparkles, X, RefreshCw, Plus, Calendar as CalendarIcon } from "lucide-react";
import { KeyResult } from "@/types";

interface KeyResultItemProps {
  keyResult: KeyResult;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onUpdateWeight: (id: string, weight: number) => void;
  onUpdateDeadline: (id: string, deadline: Date | undefined) => void;
  onUpdateMetricType: (id: string, metric_type: string) => void;
  onUpdateValues: (id: string, initial_value: number, target_value: number) => void;
  onAddMilestone: (keyResultId: string) => void;
  onUpdateMilestone: (keyResultId: string, milestoneId: string, text: string) => void;
  onDeleteMilestone: (keyResultId: string, milestoneId: string) => void;
  onRegenerate?: (id: string, prompt: string) => void;
}

export function KeyResultItem({ 
  keyResult, 
  onDelete, 
  onUpdate, 
  onUpdateWeight,
  onUpdateDeadline,
  onUpdateMetricType,
  onUpdateValues,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onRegenerate 
}: KeyResultItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(keyResult.text);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [editWeight, setEditWeight] = useState(keyResult.weight.toString());
  const [isEditingInitial, setIsEditingInitial] = useState(false);
  const [editInitial, setEditInitial] = useState(keyResult.initial_value?.toString() || "0");
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editTarget, setEditTarget] = useState(keyResult.target_value?.toString() || "100");

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

  const handleEditInitial = () => {
    if (isEditingInitial) {
      const initialValue = parseInt(editInitial);
      if (!isNaN(initialValue)) {
        onUpdateValues(keyResult.id, initialValue, keyResult.target_value || 100);
      }
    }
    setIsEditingInitial(!isEditingInitial);
  };

  const handleEditTarget = () => {
    if (isEditingTarget) {
      const targetValue = parseInt(editTarget);
      if (!isNaN(targetValue)) {
        onUpdateValues(keyResult.id, keyResult.initial_value || 0, targetValue);
      }
    }
    setIsEditingTarget(!isEditingTarget);
  };

  const handleRegenerate = () => {
    if (onRegenerate && regeneratePrompt.trim()) {
      onRegenerate(keyResult.id, regeneratePrompt);
      setRegeneratePrompt("");
      setShowRegenerateDialog(false);
    }
  };

  const metricTypes = [
    { value: "numeric", label: "Numeric" },
    { value: "percentage", label: "Percentage" },
    { value: "milestone", label: "Milestone" },
    { value: "achieved", label: "Achieved" },
    { value: "currency", label: "Currency" },
    { value: "target", label: "Target" }
  ];

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
            <Select 
              value={keyResult.metric_type || "numeric"} 
              onValueChange={(value) => onUpdateMetricType(keyResult.id, value)}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metricTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
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
                  <CalendarIcon className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
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
              <DialogContent aria-describedby={undefined} className="sm:max-w-[400px]">
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
      
      {/* Metric Values */}
      {keyResult.metric_type && keyResult.metric_type !== "milestone" && keyResult.metric_type !== "achieved" && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">From:</span>
          {isEditingInitial ? (
            <Input
              value={editInitial}
              onChange={(e) => setEditInitial(e.target.value)}
              className="w-16 h-7 text-xs"
              onBlur={handleEditInitial}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEditInitial();
                }
              }}
              autoFocus
            />
          ) : (
            <span 
              className="font-medium cursor-pointer hover:bg-muted px-1 rounded"
              onClick={handleEditInitial}
            >
              {keyResult.initial_value}
            </span>
          )}
          
          <span className="text-muted-foreground">to:</span>
          {isEditingTarget ? (
            <Input
              value={editTarget}
              onChange={(e) => setEditTarget(e.target.value)}
              className="w-16 h-7 text-xs"
              onBlur={handleEditTarget}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEditTarget();
                }
              }}
              autoFocus
            />
          ) : (
            <span 
              className="font-medium cursor-pointer hover:bg-muted px-1 rounded"
              onClick={handleEditTarget}
            >
              {keyResult.target_value}
            </span>
          )}
          
          {keyResult.metric_type === "percentage" && <span>%</span>}
          {keyResult.metric_type === "currency" && <span>$</span>}
        </div>
      )}
      
      {/* Milestones */}
      {keyResult.metric_type === "milestone" && keyResult.milestones.length > 0 && (
        <div className="ml-6 space-y-2">
          {keyResult.milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              <Input
                value={milestone.text}
                onChange={(e) => onUpdateMilestone(keyResult.id, milestone.id, e.target.value)}
                className="h-7 text-xs flex-1"
              />
              <span className="text-muted-foreground text-xs">{milestone.weight}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteMilestone(keyResult.id, milestone.id)}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Milestone Button */}
      {keyResult.metric_type === "milestone" && (
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
      )}
    </div>
  );
}