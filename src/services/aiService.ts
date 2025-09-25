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
    this.baseUrl = import.meta.env.DEV ? "http://localhost:8082" : "";
  }

  private async makeRequest(
    endpoint: string, 
    payload: any, 
    retryCount = 0
  ): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/.netlify/functions/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return {
        success: true,
        data: data,
        confidence: this.calculateConfidence(data),
      };
    } catch (error) {
      console.error(`AI Service Error (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < this.retryAttempts - 1) {
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.makeRequest(endpoint, payload, retryCount + 1);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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

  // Enhanced OKR Generation with better prompts
  async generateOKR(request: OKRGenerationRequest): Promise<AIResponse> {
    const enhancedPrompt = this.buildOKRPrompt(request);
    
    const response = await this.makeRequest('okr-suggest', {
      prompt: enhancedPrompt,
      context: {
        type: request.type,
        department: request.context?.department,
        role: request.context?.role,
        timeframe: request.context?.timeframe,
        priority: request.context?.priority,
      },
      params: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.9,
      }
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

  // Enhanced Task Generation
  async generateTasks(request: TaskGenerationRequest): Promise<AIResponse> {
    const enhancedPrompt = this.buildTaskPrompt(request);
    
    const response = await this.makeRequest('okr-suggest', {
      prompt: enhancedPrompt,
      context: {
        planType: request.planType,
        complexity: request.context?.complexity,
        duration: request.context?.duration,
        resources: request.context?.resources,
      },
      params: {
        temperature: 0.6,
        maxOutputTokens: 800,
      }
    });

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
    const enhancedPrompt = `You are Selam AI, an intelligent OKR assistant. 
    
    User message: "${message}"
    
    Context: ${JSON.stringify(context)}
    
    Provide a helpful, accurate response that:
    - Directly addresses the user's question
    - Provides actionable advice when appropriate
    - Maintains a professional yet friendly tone
    - Includes relevant examples if helpful
    - Stays focused on OKR, goal-setting, and productivity topics
    
    Keep the response concise but comprehensive.`;
    
    const response = await this.makeRequest('okr-suggest', {
      prompt: enhancedPrompt,
      context: {
        type: 'chat',
        previousMessages: context.previousMessages || [],
        userRole: context.userRole || 'employee',
      },
      params: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
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
    
    return this.makeRequest('okr-suggest', {
      prompt,
      context,
      params: {
        temperature: 0.8,
        maxOutputTokens: 300,
      }
    });
  }
}

// Export singleton instance
export const aiService = new AIService();
