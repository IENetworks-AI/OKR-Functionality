// Enhanced AI Service for better response quality and automation
export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  suggestions?: string[];
  confidence?: number;
}

export interface OKRGenerationRequest {
  objective: string;
  context?: {
    department?: string;
    role?: string;
    timeframe?: string;
    priority?: 'high' | 'medium' | 'low';
  };
  type: 'objective' | 'key_results' | 'tasks';
}

export interface TaskGenerationRequest {
  keyResult: string;
  planType: 'daily' | 'weekly';
  context?: {
    complexity?: 'simple' | 'medium' | 'complex';
    duration?: string;
    resources?: string[];
  };
}

class AIService {
  private baseUrl: string;
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor() {
    // Use Vite proxy to avoid CORS issues
    this.baseUrl = "/api/backend";
  }

  async makeRequest(
    endpoint: string, 
    payload: any, 
    retryCount = 0
  ): Promise<AIResponse> {
    try {
      // Use your FastAPI backend directly
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend Error Response:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Backend Response:', data);
      
      // Handle backend response format - check for error and raw_answer
      if (data.error && data.raw_answer) {
        console.log('Backend returned error with raw_answer, attempting to parse...');
        try {
          // Clean and parse the raw_answer JSON
          let jsonText = data.raw_answer.trim();
          
          // Remove any leading/trailing text that's not JSON
          const jsonStart = jsonText.indexOf('{');
          const jsonEnd = jsonText.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
            
            // Fix common JSON issues (missing closing brackets, etc.)
            if (!jsonText.endsWith('}')) {
              jsonText += '}';
            }
            
            const parsedData = JSON.parse(jsonText);
            return {
              success: true,
              data: { answer: parsedData },
              confidence: this.calculateConfidence(parsedData),
            };
          }
        } catch (parseError) {
          console.error('Failed to parse raw_answer:', parseError);
          console.log('Raw answer content:', data.raw_answer);
        }
      }
      
      // Handle successful response or fallback
      return {
        success: true,
        data: { answer: data.answer || data },
        confidence: this.calculateConfidence(data.answer || data),
      };
    } catch (error) {
      console.error(`AI Service Error (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < this.retryAttempts - 1) {
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.makeRequest(endpoint, payload, retryCount + 1);
      }

      // Return error if all retries failed
      return {
        success: false,
        error: `Backend failed after ${this.retryAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }


  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateConfidence(data: any): number {
    // Simple confidence calculation based on response quality
    if (!data || !data.answer) return 0;
    
    const answer = data.answer;
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for structured responses
    if (Array.isArray(answer)) confidence += 0.2;
    if (typeof answer === 'object' && answer !== null) confidence += 0.1;
    
    // Increase confidence for longer, more detailed responses
    const textLength = JSON.stringify(answer).length;
    if (textLength > 100) confidence += 0.1;
    if (textLength > 500) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  // OKR Generation using /chat endpoint for key results
  async generateOKR(request: OKRGenerationRequest): Promise<AIResponse> {
    // Use /chat endpoint for key results generation (matches your Streamlit example)
    const response = await this.makeRequest('chat', {
      query: request.objective,
      top_k: 5,
    });

    if (response.success) {
      response.suggestions = this.extractSuggestions(response.data);
    }

    return response;
  }

  private buildOKRPrompt(request: OKRGenerationRequest): string {
    const { objective, context, type } = request;
    
    let basePrompt = '';
    
    switch (type) {
      case 'objective':
        basePrompt = `Generate a clear, measurable objective based on: "${objective}". 
        The objective should be:
        - Specific and actionable
        - Time-bound (considering ${context?.timeframe || 'quarterly'} timeframe)
        - Aligned with ${context?.department || 'business'} goals
        - ${context?.priority || 'medium'} priority level
        
        Return a JSON object with: {"objective": "string", "rationale": "string", "success_metrics": ["string"]}`;
        break;
        
      case 'key_results':
        basePrompt = `Generate 3-4 measurable key results for the objective: "${objective}".
        Each key result should be:
        - Quantifiable and specific
        - Have a clear target value
        - Include a metric type (milestone, percentage, numeric, currency, achieved)
        - Have appropriate weight distribution (total 100%)
        - Be achievable within ${context?.timeframe || 'quarterly'} timeframe
        
        Return a JSON object with this structure:
        {
          "key_results": [
            {
              "title": "string",
              "weight": number,
              "metric_type": "milestone|percentage|numeric|currency|achieved",
              "target_value": number,
              "description": "string"
            }
          ]
        }`;
        break;
        
      case 'tasks':
        basePrompt = `Generate actionable tasks for the objective: "${objective}".
        Tasks should be:
        - Specific and actionable
        - Prioritized (High/Medium/Low)
        - Have realistic targets
        - Include weight distribution
        - Suitable for ${context?.role || 'team member'} role
        
        Return a JSON object with:
        {
          "tasks": [
            {
              "title": "string",
              "priority": "High|Medium|Low",
              "target": number,
              "weight": number,
              "description": "string"
            }
          ]
        }`;
        break;
    }
    
    return basePrompt;
  }

  // Task Generation using specific endpoints (matches your Streamlit example)
  async generateTasks(request: TaskGenerationRequest): Promise<AIResponse> {
    let endpoint: string;
    let payload: any;

    if (request.planType === 'weekly') {
      endpoint = 'weekly-plan';
      payload = {
        key_result: request.keyResult,
        top_k: 5,
      };
    } else if (request.planType === 'daily') {
      endpoint = 'daily-plan';
      payload = {
        annual_key_result: request.keyResult,
        top_k: 5,
      };
    } else {
      throw new Error(`Unsupported plan type: ${request.planType}`);
    }

    const response = await this.makeRequest(endpoint, payload);

    if (response.success) {
      response.suggestions = this.extractTaskSuggestions(response.data);
    }

    return response;
  }

  private buildTaskPrompt(request: TaskGenerationRequest): string {
    const { keyResult, planType, context } = request;
    
    return `Generate ${planType} tasks for the key result: "${keyResult}".
    
    Requirements:
    - Create 3-5 specific, actionable tasks
    - Each task should be ${context?.complexity || 'medium'} complexity
    - Tasks should be completable within ${context?.duration || '1 week'} timeframe
    - Include proper priority levels (High/Medium/Low)
    - Ensure weight distribution totals 100%
    - Make tasks measurable and specific
    
    ${context?.resources ? `Available resources: ${context.resources.join(', ')}` : ''}
    
    Return a JSON object with:
    {
      "${planType}_tasks": [
        {
          "title": "string",
          "priority": "High|Medium|Low", 
          "target": number,
          "weight": number,
          "description": "string",
          "estimated_duration": "string"
        }
      ]
    }`;
  }

  // Enhanced Chat Response
  async generateChatResponse(message: string, context: any = {}): Promise<AIResponse> {
    // Use /chat endpoint for general chat responses (matches your Streamlit example)
    const response = await this.makeRequest('chat', {
      query: message,
      top_k: 5,
    });

    return response;
  }

  private extractSuggestions(data: any): string[] {
    if (!data?.answer) return [];
    
    const answer = data.answer;
    const suggestions: string[] = [];
    
    if (Array.isArray(answer)) {
      answer.forEach((item, index) => {
        if (typeof item === 'object' && item.title) {
          suggestions.push(item.title);
        } else if (typeof item === 'string') {
          suggestions.push(item);
        }
      });
    } else if (typeof answer === 'object') {
      // Handle the actual backend response format with "Key Results" array
      if (answer['Key Results'] && Array.isArray(answer['Key Results'])) {
        answer['Key Results'].forEach((kr: any) => {
          if (kr.title) suggestions.push(kr.title);
        });
      }
      // Fallback to other possible formats
      if (answer.key_results) {
        answer.key_results.forEach((kr: any) => {
          if (kr.title) suggestions.push(kr.title);
        });
      }
      if (answer.tasks) {
        answer.tasks.forEach((task: any) => {
          if (task.title) suggestions.push(task.title);
        });
      }
    }
    
    return suggestions;
  }

  private extractTaskSuggestions(data: any): string[] {
    if (!data?.answer) return [];
    
    const answer = data.answer;
    const suggestions: string[] = [];
    
    // Look for various task array formats
    const taskArrays = [
      answer.daily_plan?.DailyTasks,
      answer.weekly_plan?.WeeklyTasks,
      answer.daily_tasks,
      answer.weekly_tasks,
      answer.tasks,
      answer
    ].filter(Boolean);
    
    taskArrays.forEach(taskArray => {
      if (Array.isArray(taskArray)) {
        taskArray.forEach((task: any) => {
          if (task.title) {
            suggestions.push(`${task.title} (${task.priority || 'Medium'} priority)`);
          }
        });
      }
    });
    
    return suggestions;
  }

  // Auto-suggestion based on context
  async getAutoSuggestions(context: {
    currentObjective?: string;
    userRole?: string;
    department?: string;
    recentActivity?: string[];
  }): Promise<AIResponse> {
    const prompt = `Based on the current context, suggest next actions or improvements:
    
    Current Objective: ${context.currentObjective || 'Not set'}
    User Role: ${context.userRole || 'Employee'}
    Department: ${context.department || 'General'}
    Recent Activity: ${context.recentActivity?.join(', ') || 'None'}
    
    Provide 3-5 actionable suggestions for improving OKR performance or next steps.`;
    
    return this.makeRequest('chat', {
      query: prompt,
      top_k: 5,
    });
  }
}

// Export singleton instance
export const aiService = new AIService();
