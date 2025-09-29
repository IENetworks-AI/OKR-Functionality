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
  Copy,
  Check
} from 'lucide-react';
import { useState } from 'react';

interface KeyResult {
  title: string;
  metric_type: string;
  initial_value?: number;
  target_value?: number;
  weight?: number;
  milestones?: Array<{
    title: string;
    weight: number;
  }>;
}

interface AIResponse {
  "Key Results"?: KeyResult[];
  "WeeklyTasks"?: Array<{
    title: string;
    target: number;
    weight: number;
    priority: string;
  }>;
  "DailyTasks"?: Array<{
    title: string;
    weight: number;
    priority: string;
  }>;
}

interface AIResponseDisplayProps {
  response: AIResponse;
  type: 'chat' | 'weekly-plan' | 'daily-plan';
  title: string;
  confidence?: number;
}

export function AIResponseDisplay({ response, type, title, confidence = 0.8 }: AIResponseDisplayProps) {
  const [copied, setCopied] = useState(false);

  const getTypeIcon = () => {
    switch (type) {
      case 'chat':
        return <Target className="w-5 h-5" />;
      case 'weekly-plan':
        return <Clock className="w-5 h-5" />;
      case 'daily-plan':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'chat':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'weekly-plan':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'daily-plan':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMetricTypeColor = (metricType: string) => {
    switch (metricType) {
      case 'percentage':
        return 'bg-blue-100 text-blue-800';
      case 'numeric':
        return 'bg-green-100 text-green-800';
      case 'achieved':
        return 'bg-purple-100 text-purple-800';
      case 'milestone':
        return 'bg-orange-100 text-orange-800';
      case 'currency':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetricDisplay = (kr: KeyResult) => {
    const metricType = kr.metric_type || 'numeric';
    
    switch (metricType) {
      case 'percentage':
        return `${kr.initial_value || 0}% → ${kr.target_value || 100}%`;
      case 'numeric':
        return `${kr.initial_value || 0} → ${kr.target_value || 100}`;
      case 'achieved':
        return 'Achievement-based';
      case 'milestone':
        return `${kr.milestones?.length || 0} milestones`;
      case 'currency':
        return `$${kr.initial_value || 0} → $${kr.target_value || 100}`;
      default:
        return `${kr.initial_value || 0} → ${kr.target_value || 100}`;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {getTypeIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getTypeColor()}>
                  {type.replace('-', ' ').toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1">
                  <Progress value={confidence * 100} className="w-16 h-2" />
                  <span className="text-sm text-muted-foreground">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Results Display */}
        {response["Key Results"] && (
          <div className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Target className="w-4 h-4" />
              Generated Key Results
            </h4>
            <div className="grid gap-3">
              {response["Key Results"].map((kr, index) => (
                <div key={index} className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm flex-1">{kr.title}</h5>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getMetricTypeColor(kr.metric_type)}`}>
                        {kr.metric_type.toUpperCase()}
                      </Badge>
                      {kr.weight && (
                        <Badge variant="secondary" className="text-xs">
                          {kr.weight}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getMetricDisplay(kr)}
                  </div>
                  
                  {/* Milestones */}
                  {kr.metric_type === 'milestone' && kr.milestones && kr.milestones.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <h6 className="text-xs font-medium text-muted-foreground">Milestones:</h6>
                      <div className="space-y-1">
                        {kr.milestones.map((milestone, mIndex) => (
                          <div key={mIndex} className="flex items-center gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                            <span className="flex-1">{milestone.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {milestone.weight}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Tasks Display */}
        {response["WeeklyTasks"] && (
          <div className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Weekly Tasks
            </h4>
            <div className="grid gap-3">
              {response["WeeklyTasks"].map((task, index) => (
                <div key={index} className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm flex-1">{task.title}</h5>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {task.weight}%
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Target: {task.target}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Tasks Display */}
        {response["DailyTasks"] && (
          <div className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Daily Tasks
            </h4>
            <div className="grid gap-3">
              {response["DailyTasks"].map((task, index) => (
                <div key={index} className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm flex-1">{task.title}</h5>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {task.weight}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw JSON for debugging */}
        <details className="mt-4">
          <summary className="text-sm font-medium text-muted-foreground cursor-pointer">
            View Raw Response
          </summary>
          <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
            {JSON.stringify(response, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
