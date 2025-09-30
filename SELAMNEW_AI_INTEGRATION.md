# SelamNew AI Integration Guide

## Overview
This document describes the integration of the SelamNew AI API into the OKR Copilot application.

**API Base URL**: `https://selamnew-ai.ienetworks.co`

## API Endpoints

### 1. OKR Generation - `/okr`
Generates Key Results from an Objective.

**Method**: POST

**Request Body**:
```json
{
  "objective": "Add AI features to SelamNew Workspaces"
}
```

**Response Format**:
```json
{
  "answer": {
    "Key Results": [
      {
        "title": "Finalize UI Design",
        "metric_type": "achieved",
        "weight": 0.3
      },
      {
        "title": "Complete Test Deployment",
        "metric_type": "numeric",
        "weight": 0.3,
        "initial_value": 0,
        "target_value": 100
      }
    ]
  }
}
```

**Frontend Usage**:
- File: `src/services/aiService.ts` - `generateOKR()`
- File: `src/lib/okrAi.ts` - `generateAIObjectiveAndKeyResults()`
- Components: `src/components/okr/OKRModal.tsx`

---

### 2. Weekly Plan Generation - `/weekly-plan`
Generates weekly tasks from a Key Result.

**Method**: POST

**Request Body**:
```json
{
  "key_result": "Prepare data pipeline for AI MVP"
}
```

**Response Format**:
```json
{
  "weekly_plan": {
    "WeeklyTasks": [
      {
        "title": "Identify Data Sources",
        "target": 3,
        "weight": 10,
        "priority": "high"
      }
    ]
  }
}
```

**Frontend Usage**:
- File: `src/services/aiService.ts` - `generateTasks()` with `planType: 'weekly'`
- File: `src/lib/okrApi.ts` - `generateWeeklyTasksFromKR()`
- File: `src/lib/okrAi.ts` - `generateAITasks()` with `planType: 'weekly'`
- Components: `src/components/CreatePlanModal.tsx`

---

### 3. Daily Plan Generation - `/daily-plan`
Generates daily tasks from a Weekly Plan.

**Method**: POST

**Request Body**:
```json
{
  "weekly_plan": "Finalize 20% ETL pipeline"
}
```

**Response Format**:
```json
{
  "daily_plan": {
    "DailyTasks": [
      {
        "title": "Ingest raw data",
        "weight": 1,
        "priority": "high"
      }
    ]
  }
}
```

**Frontend Usage**:
- File: `src/services/aiService.ts` - `generateTasks()` with `planType: 'daily'`
- File: `src/lib/okrApi.ts` - `generateDailyTasksFromWeekly()`
- File: `src/lib/okrAi.ts` - `generateAITasks()` with `planType: 'daily'`
- Components: `src/components/CreatePlanModal.tsx`

---

### 4. Copilot - `/copilot`
Provides natural language responses about OKR and SelamNew modules.

**Method**: POST

**Request Body**:
```json
{
  "query": "How to create OKR on SelamNew Workspaces"
}
```

**Response Format**:
```json
{
  "answer": "To create an OKR, follow these steps: 1. Access Dashboard ... 2. Create Objective ... 3. Add Key Results ..."
}
```

**Frontend Usage**:
- File: `src/services/aiService.ts` - `getOKRExplanation()`, `generateChatResponse()`, `getAutoSuggestions()`
- File: `src/lib/okrApi.ts` - `askOkrModel()`
- Components: `src/components/chat/ChatBot.tsx`

---

## Architecture

### Request Flow

1. **Development Mode** (Vite Dev Server):
   ```
   Frontend → /api/backend/* → Vite Proxy → https://selamnew-ai.ienetworks.co/*
   ```

2. **Production Mode** (Netlify):
   ```
   Frontend → /.netlify/functions/backend-proxy/* → Netlify Function → https://selamnew-ai.ienetworks.co/*
   ```

### Key Files

#### Backend Integration
- `netlify/functions/backend-proxy.js` - Netlify serverless function that proxies requests to SelamNew AI
- `vite.config.ts` - Vite proxy configuration for development

#### Frontend Services
- `src/services/aiService.ts` - Main AI service with retry logic and error handling
- `src/lib/okrAi.ts` - OKR-specific AI functions with response parsing
- `src/lib/okrApi.ts` - Helper functions for specific API calls

#### Components
- `src/components/okr/OKRModal.tsx` - OKR creation with AI suggestions
- `src/components/CreatePlanModal.tsx` - Weekly/Daily plan creation with AI
- `src/components/chat/ChatBot.tsx` - Chat interface using Copilot endpoint

---

## Changes Made

### 1. Updated API Endpoints
- Changed from `/chat` to `/okr` for Key Results generation
- Updated payload to use only `objective` field (removed `top_k`, `context`, etc.)

### 2. Simplified Request Payloads
All endpoints now send **only the required fields** as per API documentation:
- `/okr`: `{ objective: string }`
- `/weekly-plan`: `{ key_result: string }`
- `/daily-plan`: `{ weekly_plan: string }`
- `/copilot`: `{ query: string }`

### 3. Response Parsing
Enhanced response parsing to handle the specific formats returned by each endpoint:
- OKR: Looks for `answer.Key Results` array
- Weekly Plan: Looks for `weekly_plan.WeeklyTasks` array
- Daily Plan: Looks for `daily_plan.DailyTasks` array
- Copilot: Extracts `answer` string

---

## Testing

### Test Endpoints Directly

#### 1. Test OKR Generation
```bash
curl -X POST "https://selamnew-ai.ienetworks.co/okr" \
  -H "Content-Type: application/json" \
  -d '{"objective": "Add AI features to SelamNew Workspaces"}'
```

#### 2. Test Weekly Plan
```bash
curl -X POST "https://selamnew-ai.ienetworks.co/weekly-plan" \
  -H "Content-Type: application/json" \
  -d '{"key_result": "Prepare data pipeline for AI MVP"}'
```

#### 3. Test Daily Plan
```bash
curl -X POST "https://selamnew-ai.ienetworks.co/daily-plan" \
  -H "Content-Type: application/json" \
  -d '{"weekly_plan": "Finalize 20% ETL pipeline"}'
```

#### 4. Test Copilot
```bash
curl -X POST "https://selamnew-ai.ienetworks.co/copilot" \
  -H "Content-Type: application/json" \
  -d '{"query": "How to create OKR on SelamNew Workspaces"}'
```

### Test Through Application

1. **Test OKR Generation**:
   - Open the application
   - Click "Create OKR"
   - Enter an objective
   - AI should generate Key Results

2. **Test Weekly Plan**:
   - Navigate to Planning Dashboard
   - Click "Create Weekly Plan"
   - Select a Key Result
   - AI should generate weekly tasks

3. **Test Daily Plan**:
   - Navigate to Planning Dashboard
   - Click "Create Daily Plan"
   - Select a Weekly Plan
   - AI should generate daily tasks

4. **Test Copilot**:
   - Click the Selam AI chat button (bottom right)
   - Ask "What is OKR?"
   - Should get a conversational response

---

## Troubleshooting

### Common Issues

1. **401/403 Errors**: 
   - Check if authentication is required (currently not required per API docs)
   - Verify the API base URL is correct

2. **CORS Errors**:
   - In development: Check Vite proxy configuration
   - In production: Verify Netlify function CORS headers

3. **Empty Responses**:
   - Check request payload matches exact field names
   - Verify response parsing logic in `okrAi.ts`

4. **Timeout Errors**:
   - AI service has retry logic (3 attempts)
   - Check network connectivity
   - Verify API endpoint is accessible

### Debug Mode

Enable debug logging by opening browser console:
```javascript
// See detailed API request/response logs
localStorage.setItem('debug', 'true')
```

---

## Environment Variables

No additional environment variables required for SelamNew AI integration.

The proxy automatically routes to `https://selamnew-ai.ienetworks.co`.

---

## Future Authentication

Per API documentation, future authentication will use:
```
Authorization: Bearer <token>
```

To add authentication, update:
1. `netlify/functions/backend-proxy.js` - Add Authorization header
2. `src/services/aiService.ts` - Include token in requests

