import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useOKRStore } from '@/store/okrStore';
import { AIResponseDisplay } from '@/components/AIResponseDisplay';

interface GeneratedOutput {
  id: string;
  type: 'chat' | 'weekly-plan' | 'daily-plan';
  title: string;
  response: any;
  confidence: number;
  createdAt: Date;
  status: 'active' | 'completed' | 'archived';
}

export function GeneratedOutputDisplay() {
  const [generatedOutputs, setGeneratedOutputs] = useState<GeneratedOutput[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const { objectives, plans } = useOKRStore();

  // Load stored responses from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ai-generated-responses');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setGeneratedOutputs(parsed.map((output: any) => ({
          ...output,
          createdAt: new Date(output.createdAt)
        })));
      } catch (error) {
        console.error('Failed to parse stored responses:', error);
      }
    }
  }, []);

  // Function to add new response (can be called from other components)
  const addResponse = (type: 'chat' | 'weekly-plan' | 'daily-plan', title: string, response: any, confidence: number = 0.8) => {
    const newOutput: GeneratedOutput = {
      id: `response-${Date.now()}`,
      type,
      title,
      response,
      confidence,
      createdAt: new Date(),
      status: 'active'
    };
    
    const updated = [newOutput, ...generatedOutputs];
    setGeneratedOutputs(updated);
    localStorage.setItem('ai-generated-responses', JSON.stringify(updated));
  };

  // Expose the addResponse function globally for other components to use
  useEffect(() => {
    (window as any).addAIResponse = addResponse;
    return () => {
      delete (window as any).addAIResponse;
    };
  }, [generatedOutputs]);


  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const filteredOutputs = generatedOutputs.filter(output => 
    showArchived || output.status !== 'archived'
  );

  const handleRefresh = () => {
    // TODO: Implement actual refresh logic
    console.log('Refreshing generated outputs...');
  };

  const handleViewDetails = (output: GeneratedOutput) => {
    // TODO: Implement view details logic
    console.log('Viewing details for:', output.title);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>AI Generated Output</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredOutputs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No generated output available</p>
            <p className="text-sm">AI-generated OKRs and plans will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOutputs.map((output) => (
              <AIResponseDisplay
                key={output.id}
                response={output.response}
                type={output.type}
                title={output.title}
                confidence={output.confidence}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
