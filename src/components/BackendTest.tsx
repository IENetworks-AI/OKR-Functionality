import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { aiService } from '@/services/aiService';

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
    annualKeyResult: 'Launch new product line successfully',
  });

  const runTest = async (endpoint: string, payload: any) => {
    const startTime = Date.now();
    try {
      const response = await aiService.makeRequest(endpoint, payload);
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        endpoint,
        success: response.success,
        data: response.data,
        error: response.error,
        duration,
      };
      
      setTestResults(prev => [result, ...prev]);
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

  const testChatEndpoint = async () => {
    setIsLoading(true);
    await runTest('chat', {
      query: testInputs.objective,
      top_k: 5,
    });
    setIsLoading(false);
  };

  const testWeeklyPlanEndpoint = async () => {
    setIsLoading(true);
    await runTest('weekly-plan', {
      key_result: testInputs.keyResult,
      top_k: 5,
    });
    setIsLoading(false);
  };

  const testDailyPlanEndpoint = async () => {
    setIsLoading(true);
    await runTest('daily-plan', {
      annual_key_result: testInputs.annualKeyResult,
      top_k: 5,
    });
    setIsLoading(false);
  };

  const testAllEndpoints = async () => {
    setIsLoading(true);
    await testChatEndpoint();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    await testWeeklyPlanEndpoint();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testDailyPlanEndpoint();
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Objective (for /chat)</label>
            <Input
              value={testInputs.objective}
              onChange={(e) => setTestInputs(prev => ({ ...prev, objective: e.target.value }))}
              placeholder="Enter objective..."
            />
            <Button onClick={testChatEndpoint} disabled={isLoading} size="sm" className="w-full">
              Test /chat
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
            <label className="text-sm font-medium">Annual Key Result (for /daily-plan)</label>
            <Input
              value={testInputs.annualKeyResult}
              onChange={(e) => setTestInputs(prev => ({ ...prev, annualKeyResult: e.target.value }))}
              placeholder="Enter annual key result..."
            />
            <Button onClick={testDailyPlanEndpoint} disabled={isLoading} size="sm" className="w-full">
              Test /daily-plan
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
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
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
          <p><strong>Backend URL:</strong> http://139.185.33.139</p>
          <p><strong>Endpoints:</strong> /chat, /weekly-plan, /daily-plan</p>
          <p><strong>Expected Response Format:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              <code>/chat</code>:&nbsp;
              <code>
                {'{'}"answer": {'{'}"Key Results": [...] {'}'}{'}'}
              </code>
            </li>
            <li>
              <code>/weekly-plan</code>:&nbsp;
              <code>
                {'{'}"weekly_plan": {'{'}"WeeklyTasks": [...] {'}'}{'}'}
              </code>
            </li>
            <li>
              <code>/daily-plan</code>:&nbsp;
              <code>
                {'{'}"daily_plan": {'{'}"DailyTasks": [...] {'}'}{'}'}
              </code>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
