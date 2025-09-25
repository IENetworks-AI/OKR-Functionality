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

interface GeneratedOutput {
  id: string;
  type: 'okr' | 'weekly_plan' | 'daily_plan';
  title: string;
  items: Array<{
    title: string;
    weight?: number;
    priority?: 'high' | 'medium' | 'low';
    target?: number;
    metricType?: string;
  }>;
  confidence: number;
  createdAt: Date;
  status: 'active' | 'completed' | 'archived';
}

export function GeneratedOutputDisplay() {
  const [generatedOutputs, setGeneratedOutputs] = useState<GeneratedOutput[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const { objectives, plans } = useOKRStore();

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    const mockOutputs: GeneratedOutput[] = [
      {
        id: '1',
        type: 'okr',
        title: 'Increase Customer Satisfaction',
        items: [
          { title: 'Achieve 95% customer satisfaction score', weight: 40, metricType: 'percentage' },
          { title: 'Reduce customer complaints by 30%', weight: 30, metricType: 'numeric' },
          { title: 'Implement customer feedback system', weight: 30, metricType: 'milestone' },
        ],
        confidence: 0.92,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: 'active',
      },
      {
        id: '2',
        type: 'weekly_plan',
        title: 'Marketing Campaign Execution',
        items: [
          { title: 'Finalize analytics report including action improvement per month', weight: 30, priority: 'high', target: 100 },
          { title: 'Start processing the MC, Flawless, and Abenzers price', weight: 25, priority: 'medium', target: 100 },
          { title: 'Run at least one Digital marketing campaign on all social media platforms and get 30% impressions', weight: 20, priority: 'high', target: 30 },
          { title: 'Make a proposal for this quarter CSR activity', weight: 25, priority: 'low', target: 100 },
        ],
        confidence: 0.88,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: 'active',
      },
      {
        id: '3',
        type: 'daily_plan',
        title: 'Market Research Tasks',
        items: [
          { title: 'Research and identify 5 potential partner companies in East Africa', weight: 10, priority: 'high' },
          { title: 'Review and provide feedback on HQ LLD document', weight: 8, priority: 'medium' },
          { title: 'Draft the layout for the international market entry strategy document', weight: 6, priority: 'low' },
        ],
        confidence: 0.85,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        status: 'active',
      },
    ];
    setGeneratedOutputs(mockOutputs);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'okr':
        return <Target className="w-4 h-4" />;
      case 'weekly_plan':
        return <Clock className="w-4 h-4" />;
      case 'daily_plan':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'okr':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'weekly_plan':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'daily_plan':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

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
          <div className="space-y-4">
            {filteredOutputs.map((output) => (
              <div
                key={output.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(output.type)}
                    <h3 className="font-semibold">{output.title}</h3>
                    <Badge className={getTypeColor(output.type)}>
                      {output.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-sm ${getConfidenceColor(output.confidence)}`}>
                      {Math.round(output.confidence * 100)}% confidence
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(output)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {output.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-muted-foreground">•</span>
                        <span className="flex-1">{item.title}</span>
                        {item.weight && (
                          <Badge variant="secondary" className="text-xs">
                            {item.weight}%
                          </Badge>
                        )}
                        {item.priority && (
                          <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </Badge>
                        )}
                        {item.target && (
                          <span className="text-muted-foreground text-xs">
                            Target: {item.target}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {output.items.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      +{output.items.length - 3} more items
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Generated {formatDate(output.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={output.confidence * 100} 
                      className="w-16 h-2" 
                    />
                    <span className="capitalize">{output.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
