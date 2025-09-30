import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { AIResponseDisplay } from '@/components/AIResponseDisplay';

interface TestResult {
  endpoint: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export function BackendTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testInputs, setTestInputs] = useState({
    objective: 'Increase customer satisfaction',
    keyResult: 'Achieve 95% customer satisfaction score',
    weeklyPlan: 'Complete data pipeline implementation',
  });

  const runTest = async (endpoint: string, payload: any) => {
    const startTime = Date.now();
    try {
      let response: any;
      if (endpoint === 'okr') {
        response = await aiService.generateOKR({
          objective: payload.objective,
          type: 'key_results'
        });
      } else if (endpoint === 'weekly-plan') {
        response = await aiService.generateTasks({
          keyResult: payload.key_result,
          planType: 'weekly'
        });
      } else if (endpoint === 'daily-plan') {
        response = await aiService.generateTasks({
          keyResult: payload.weekly_plan,
          planType: 'daily'
        });
      } else if (endpoint === 'copilot') {
        response = await aiService.getOKRExplanation(payload.query);
      } else {
        throw new Error(`Unknown endpoint: ${endpoint}`);
      }
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        endpoint,
        success: response.success,
        data: response.data,
        error: response.error,
        duration,
      };
      
      setTestResults(prev => [result, ...prev]);
      
      // If successful, add to dashboard
      if (result.success && result.data?.answer) {
        const addResponse = (window as any).addAIResponse;
        if (addResponse) {
          const title = endpoint === 'okr' ? 'AI Generated Key Results' :
                       endpoint === 'weekly-plan' ? 'Weekly Plan Generation' :
                       endpoint === 'daily-plan' ? 'Daily Plan Generation' :
                       'Copilot Response';
          addResponse(endpoint as 'okr' | 'weekly-plan' | 'daily-plan' | 'copilot', title, result.data.answer, 0.9);
        }
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        endpoint,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
      
      setTestResults(prev => [result, ...prev]);
      return result;
    }
  };

  const testOKREndpoint = async () => {
    setIsLoading(true);
    await runTest('okr', {
      objective: testInputs.objective,
    });
    setIsLoading(false);
  };

  const testWeeklyPlanEndpoint = async () => {
    setIsLoading(true);
    await runTest('weekly-plan', {
      key_result: testInputs.keyResult,
    });
    setIsLoading(false);
  };

  const testDailyPlanEndpoint = async () => {
    setIsLoading(true);
    await runTest('daily-plan', {
      weekly_plan: testInputs.weeklyPlan,
    });
    setIsLoading(false);
  };

  const testCopilotEndpoint = async () => {
    setIsLoading(true);
    await runTest('copilot', {
      query: 'How to create effective OKRs?',
    });
    setIsLoading(false);
  };

  const testAllEndpoints = async () => {
    setIsLoading(true);
    await testOKREndpoint();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    await testWeeklyPlanEndpoint();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testDailyPlanEndpoint();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testCopilotEndpoint();
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Backend API Test
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={testAllEndpoints} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test All'}
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Objective (for /okr)</label>
            <Input
              value={testInputs.objective}
              onChange={(e) => setTestInputs(prev => ({ ...prev, objective: e.target.value }))}
              placeholder="Enter objective..."
            />
            <Button onClick={testOKREndpoint} disabled={isLoading} size="sm" className="w-full">
              Test /okr
            </Button>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Key Result (for /weekly-plan)</label>
            <Input
              value={testInputs.keyResult}
              onChange={(e) => setTestInputs(prev => ({ ...prev, keyResult: e.target.value }))}
              placeholder="Enter key result..."
            />
            <Button onClick={testWeeklyPlanEndpoint} disabled={isLoading} size="sm" className="w-full">
              Test /weekly-plan
            </Button>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Weekly Plan (for /daily-plan)</label>
            <Input
              value={testInputs.weeklyPlan}
              onChange={(e) => setTestInputs(prev => ({ ...prev, weeklyPlan: e.target.value }))}
              placeholder="Enter weekly plan..."
            />
            <Button onClick={testDailyPlanEndpoint} disabled={isLoading} size="sm" className="w-full">
              Test /daily-plan
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Copilot Query</label>
            <Input
              value="How to create OKRs?"
              disabled
              placeholder="Ask a question..."
            />
            <Button onClick={testCopilotEndpoint} disabled={isLoading} size="sm" className="w-full">
              Test /copilot
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            {testResults.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.endpoint}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {result.duration}ms
                      </span>
                    </div>
                  </div>
                  
                  {result.success ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-600 font-medium">✅ Success</p>
                      {result.data?.answer && (
                        <AIResponseDisplay 
                          response={result.data.answer}
                          type={result.endpoint as 'okr' | 'weekly-plan' | 'daily-plan' | 'copilot'}
                          title={`${result.endpoint.toUpperCase()} Response`}
                          confidence={0.9}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-red-600 font-medium">❌ Error</p>
                      <p className="text-sm text-red-600">{result.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Backend URL Info */}
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
          <p><strong>Backend URL:</strong> https://selamnew-ai.ienetworks.co</p>
          <p><strong>Endpoints:</strong> /okr, /weekly-plan, /daily-plan, /copilot</p>
          <p><strong>Expected Response Format:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              <code>/chat</code>:&nbsp;
              <code>
                {'{'}"Key Results": [...] {'}'}
              </code>
            </li>
            <li>
              <code>/weekly-plan</code>:&nbsp;
              <code>
                {'{'}"WeeklyTasks": [...] {'}'}
              </code>
            </li>
            <li>
              <code>/daily-plan</code>:&nbsp;
              <code>
                {'{'}"DailyTasks": [...] {'}'}
              </code>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
