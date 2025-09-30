# Quick Reference - SelamNew AI API

## 🚀 Quick Start

### Test API Directly
```bash
./test-selamnew-api.sh
```

### Run Development Server
```bash
npm run dev
# or
netlify dev
```

---

## 📡 API Endpoints at a Glance

| Endpoint | Request | Response Key |
|----------|---------|--------------|
| `/okr` | `{objective: string}` | `answer.Key Results[]` |
| `/weekly-plan` | `{key_result: string}` | `weekly_plan.WeeklyTasks[]` |
| `/daily-plan` | `{weekly_plan: string}` | `daily_plan.DailyTasks[]` |
| `/copilot` | `{query: string}` | `answer` |

---

## 💻 Code Examples

### Generate Key Results
```typescript
import { generateAIObjectiveAndKeyResults } from '@/lib/okrAi';

const { title, keyResults } = await generateAIObjectiveAndKeyResults(
  "Improve customer satisfaction"
);
```

### Generate Weekly Tasks
```typescript
import { generateAITasks } from '@/lib/okrAi';

const { tasks } = await generateAITasks(
  "Complete project milestone",
  'weekly'
);
```

### Generate Daily Tasks
```typescript
import { generateAITasks } from '@/lib/okrAi';

const { tasks } = await generateAITasks(
  "Finish ETL pipeline",
  'daily'
);
```

### Chat/Copilot
```typescript
import { aiService } from '@/services/aiService';

const response = await aiService.getOKRExplanation(
  "How to create effective OKRs?"
);
```

---

## 🔧 Testing Commands

### Test OKR Endpoint
```bash
curl -X POST "https://selamnew-ai.ienetworks.co/okr" \
  -H "Content-Type: application/json" \
  -d '{"objective": "Improve customer satisfaction"}'
```

### Test Weekly Plan
```bash
curl -X POST "https://selamnew-ai.ienetworks.co/weekly-plan" \
  -H "Content-Type: application/json" \
  -d '{"key_result": "Complete data pipeline"}'
```

### Test Daily Plan
```bash
curl -X POST "https://selamnew-ai.ienetworks.co/daily-plan" \
  -H "Content-Type: application/json" \
  -d '{"weekly_plan": "Finalize ETL pipeline"}'
```

### Test Copilot
```bash
curl -X POST "https://selamnew-ai.ienetworks.co/copilot" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is OKR?"}'
```

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `src/services/aiService.ts` | Main AI service with retry logic |
| `src/lib/okrAi.ts` | OKR-specific AI functions |
| `src/lib/okrApi.ts` | API helper functions |
| `netlify/functions/backend-proxy.js` | Production proxy |
| `vite.config.ts` | Development proxy |

---

## 🐛 Troubleshooting

### Check Proxy Routes
**Development:**
- `/api/backend/*` → `https://selamnew-ai.ienetworks.co/*`

**Production:**
- `/.netlify/functions/backend-proxy/*` → `https://selamnew-ai.ienetworks.co/*`

### Enable Debug Logging
```javascript
// In browser console
localStorage.setItem('debug', 'true')
```

### Common Issues

**Empty Response:**
- Check request payload field names
- Verify API is accessible

**CORS Error:**
- Check proxy configuration
- Verify headers in backend-proxy.js

**Parse Error:**
- Check response format in browser Network tab
- Verify parsing logic in okrAi.ts

---

## 📊 Response Formats

### OKR Response
```json
{
  "answer": {
    "Key Results": [
      {
        "title": "Key Result Title",
        "metric_type": "numeric|achieved|percentage",
        "weight": 0.3,
        "initial_value": 0,
        "target_value": 100
      }
    ]
  }
}
```

### Weekly Plan Response
```json
{
  "weekly_plan": {
    "WeeklyTasks": [
      {
        "title": "Task Title",
        "target": 3,
        "weight": 10,
        "priority": "high|medium|low"
      }
    ]
  }
}
```

### Daily Plan Response
```json
{
  "daily_plan": {
    "DailyTasks": [
      {
        "title": "Task Title",
        "weight": 1,
        "priority": "high|medium|low"
      }
    ]
  }
}
```

### Copilot Response
```json
{
  "answer": "Natural language response text..."
}
```

---

## 📚 Full Documentation

- **Complete Guide:** `SELAMNEW_AI_INTEGRATION.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **API Documentation:** `API_ENDPOINTS_GUIDE.md`

---

## ✅ Verification

Test that everything works:

1. ✅ Run test script: `./test-selamnew-api.sh`
2. ✅ Start dev server: `npm run dev`
3. ✅ Create OKR with AI
4. ✅ Create Weekly Plan with AI
5. ✅ Create Daily Plan with AI
6. ✅ Chat with Selam AI bot

---

## 🎯 What Changed?

**Before:**
```typescript
// ❌ Wrong endpoint, wrong fields
fetch('/api/chat', {
  body: JSON.stringify({
    query: objective,
    top_k: 5,
    context: {...}
  })
});
```

**After:**
```typescript
// ✅ Correct endpoint, only required field
fetch('/api/backend/okr', {
  body: JSON.stringify({
    objective: objective
  })
});
```

---

**API Base:** `https://selamnew-ai.ienetworks.co`  
**Authentication:** Not required (future: Bearer token)  
**Content-Type:** `application/json` (required)

