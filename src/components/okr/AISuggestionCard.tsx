import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

interface AISuggestionCardProps {
  suggestion: string;
  suggestionCount: number;
  onCancel: () => void;
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