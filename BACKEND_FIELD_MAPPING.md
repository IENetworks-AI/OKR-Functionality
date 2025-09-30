# Backend API to Frontend Field Mapping

## 📡 Complete Field Mapping Documentation

This document shows exactly how each field from the backend API response is mapped to the frontend UI.

---

## 🎯 OKR Endpoint Response Structure

### Backend API Response (`/okr`)
```json
{
  "answer": {
    "Key Results": [
      {
        "title": "Finalize UI Design and Prototype for AI Features",
        "metric_type": "achieved",
        "weight": 30
      },
      {
        "title": "Complete 100% of Test Deployment",
        "metric_type": "numeric",
        "weight": 30,
        "initial_value": 0,
        "target_value": 100
      }
    ]
  }
}
```

---

## 🔄 Field Mapping Table

### For ALL Key Results

| Backend Field | Type | Frontend Field | UI Display | Placeholder/Label |
|---------------|------|----------------|------------|-------------------|
| `title` | string | `title` | Input field | "Enter key result name" |
| `metric_type` | string | `metricType` | Select dropdown | "Select metric type" |
| `weight` | number | `weight` | Number input + % | "Weight" label |
| - | - | `deadline` | Date picker | "Select date" |

### For Numeric/Percentage/Currency Types

| Backend Field | Type | Frontend Field | UI Display | Placeholder/Label |
|---------------|------|----------------|------------|-------------------|
| `initial_value` | number | `currentValue` | Number input | "Initial Value" / "Initial Value (%)" / "Initial Value ($)" |
| `target_value` | number | `targetValue` | Number input | "Target Value" / "Target Value (%)" / "Target Value ($)" |

### For Achieved Type

| Backend Field | Type | Frontend Field | UI Display | Label |
|---------------|------|----------------|------------|-------|
| - | boolean | `completed` | Checkbox | "Mark as Achieved" |

### For Milestone Type

| Backend Field | Type | Frontend Field | UI Display | Label |
|---------------|------|----------------|------------|-------|
| `milestones` | array | `milestones[]` | Input + List | "Set Milestone" |
| `milestones[].title` | string | `title` | Text display | Milestone name |
| `milestones[].weight` | number | `weight` | (Not used) | - |

---

## 📊 Complete UI Layout with Field Names

### Key Result Card Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Key Result Card                                        [X]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Row 1: Basic Information                                    │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │ Key Result  │ Metric Type │   Weight    │  Deadline   │ │
│  │    Name     │             │             │             │ │
│  ├─────────────┼─────────────┼─────────────┼─────────────┤ │
│  │  [title]    │[metricType] │  [weight]%  │ [deadline]  │ │
│  │  Input      │  Dropdown   │  Input      │ Date Picker │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
│                                                              │
│  Row 2: Metric-Specific Fields (Dynamic)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  IF metric_type = "numeric" OR "percentage" OR        │ │
│  │     "currency":                                        │ │
│  │  ┌──────────────────┬──────────────────┐              │ │
│  │  │  Initial Value   │   Target Value   │              │ │
│  │  ├──────────────────┼──────────────────┤              │ │
│  │  │ [currentValue]   │  [targetValue]   │              │ │
│  │  │     Input        │      Input       │              │ │
│  │  └──────────────────┴──────────────────┘              │ │
│  │                                                        │ │
│  │  IF metric_type = "achieved":                         │ │
│  │  ☐ Mark as Achieved [completed]                       │ │
│  │                                                        │ │
│  │  IF metric_type = "milestone":                        │ │
│  │  [Set Milestone Input] [Add Milestone Button]         │ │
│  │  • Milestone 1                                [X]      │ │
│  │  • Milestone 2                                [X]      │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Field Descriptions

### 1. **title** (Backend → Frontend)
- **Backend Field**: `title`
- **Frontend Field**: `title`
- **Type**: `string`
- **UI Component**: Text Input
- **Label**: "Key Result Name"
- **Placeholder**: "Enter key result name"
- **Example**: "Complete 100% of Test Deployment"

### 2. **metric_type** (Backend → Frontend)
- **Backend Field**: `metric_type`
- **Frontend Field**: `metricType`
- **Type**: `string` → enum
- **UI Component**: Select Dropdown
- **Label**: "Metric Type"
- **Placeholder**: "Select metric type"
- **Options**:
  - `"achieved"` → "Achieved"
  - `"numeric"` → "Numeric"
  - `"percentage"` → "Percentage"
  - `"currency"` → "Currency"
  - `"milestone"` → "Milestone"
- **Mapping Logic**:
  ```typescript
  const metricTypeMap = {
    "achieved": "achieved",
    "milestone": "milestone",
    "percentage": "percentage",
    "percent": "percentage",
    "numeric": "numeric",
    "number": "numeric",
    "currency": "currency",
    "money": "currency"
  };
  ```

### 3. **weight** (Backend → Frontend)
- **Backend Field**: `weight`
- **Type**: `number`
- **Frontend Field**: `weight`
- **UI Component**: Number Input + "%" suffix
- **Label**: "Weight"
- **Placeholder**: "Weight"
- **Constraints**: 0-100
- **Display**: Shows with "%" symbol
- **Example**: `30` displays as "30 %"

### 4. **initial_value** (Backend → Frontend)
- **Backend Field**: `initial_value`
- **Frontend Field**: `currentValue`
- **Type**: `number`
- **UI Component**: Number Input
- **Label** (varies by metric type):
  - Numeric: "Initial Value"
  - Percentage: "Initial Value (%)"
  - Currency: "Initial Value ($)"
- **Placeholder**:
  - Numeric: "0"
  - Percentage: "0"
  - Currency: "0.00"
- **Example**: `0`
- **Visible for**: numeric, percentage, currency types only

### 5. **target_value** (Backend → Frontend)
- **Backend Field**: `target_value`
- **Frontend Field**: `targetValue`
- **Type**: `number`
- **UI Component**: Number Input
- **Label** (varies by metric type):
  - Numeric: "Target Value"
  - Percentage: "Target Value (%)"
  - Currency: "Target Value ($)"
- **Placeholder**:
  - Numeric: "100"
  - Percentage: "100"
  - Currency: "1000.00"
- **Example**: `100`
- **Visible for**: numeric, percentage, currency types only

### 6. **deadline** (Frontend Only)
- **Backend Field**: Not provided
- **Frontend Field**: `deadline`
- **Type**: `Date`
- **UI Component**: Date Picker
- **Label**: "Deadline"
- **Placeholder**: "Select date"
- **Note**: This is a frontend-only field

### 7. **completed** (Frontend Only - for Achieved type)
- **Backend Field**: Not provided
- **Frontend Field**: `completed`
- **Type**: `boolean`
- **UI Component**: Checkbox
- **Label**: "Mark as Achieved"
- **Default**: `false`
- **Visible for**: achieved type only

### 8. **milestones** (Frontend Only - for Milestone type)
- **Backend Field**: `milestones` (if provided)
- **Frontend Field**: `milestones[]`
- **Type**: `array of objects`
- **UI Component**: Input + List with delete buttons
- **Structure**:
  ```typescript
  {
    id: string,
    title: string,
    completed: boolean,
    weight: number
  }
  ```
- **Visible for**: milestone type only

---

## 🎨 UI Components by Metric Type

### Metric Type: **numeric**
```
┌──────────────────────────────────────────┐
│ Initial Value    │    Target Value       │
├──────────────────┼───────────────────────┤
│ [0] ← backend    │ [100] ← backend       │
│ initial_value    │ target_value          │
└──────────────────┴───────────────────────┘
```

### Metric Type: **percentage**
```
┌──────────────────────────────────────────┐
│ Initial Value (%)│  Target Value (%)     │
├──────────────────┼───────────────────────┤
│ [0] ← backend    │ [100] ← backend       │
│ initial_value    │ target_value          │
└──────────────────┴───────────────────────┘
```

### Metric Type: **currency**
```
┌──────────────────────────────────────────┐
│ Initial Value ($)│  Target Value ($)     │
├──────────────────┼───────────────────────┤
│ [0.00] ← backend │ [1000.00] ← backend   │
│ initial_value    │ target_value          │
└──────────────────┴───────────────────────┘
```

### Metric Type: **achieved**
```
┌──────────────────────────────────────────┐
│ ☐ Mark as Achieved                       │
│   [completed] ← frontend only            │
└──────────────────────────────────────────┘
```

### Metric Type: **milestone**
```
┌──────────────────────────────────────────┐
│ Milestones                               │
├──────────────────────────────────────────┤
│ [Set Milestone] [100%] [Add Milestone]   │
│                                          │
│ Added Milestones:                        │
│ • Milestone Title 1              [X]     │
│ • Milestone Title 2              [X]     │
└──────────────────────────────────────────┘
```

---

## 🔄 Backend Response Processing Flow

### Step-by-Step Processing

1. **Receive Response**
   ```javascript
   {
     "answer": {
       "Key Results": [...]
     }
   }
   ```

2. **Extract Key Results Array**
   ```typescript
   const aiKRs = data.answer["Key Results"];
   ```

3. **Map Each Key Result**
   ```typescript
   aiKRs.map((kr, index) => {
     // Extract fields
     title: kr.title
     metric_type: kr.metric_type
     weight: kr.weight
     initial_value: kr.initial_value
     target_value: kr.target_value
   })
   ```

4. **Normalize Metric Type**
   ```typescript
   metricType = metricTypeMap[kr.metric_type.toLowerCase()]
   ```

5. **Convert Weight** (if needed)
   ```typescript
   if (weight > 0 && weight < 1) {
     weight = Math.round(weight * 100);
   }
   ```

6. **Create Frontend Object**
   ```typescript
   {
     id: `ai-${Date.now()}-${index}`,
     title: kr.title,
     metricType: metricType,
     weight: weight,
     currentValue: kr.initial_value ?? 0,
     targetValue: kr.target_value ?? 100,
     completed: false,
     deadline: undefined
   }
   ```

7. **Normalize Total Weight to 100%**
   ```typescript
   // Ensures sum of all weights = 100%
   ```

8. **Display in UI**
   - All fields populated from backend
   - Proper labels and placeholders shown
   - Metric-specific fields displayed

---

## 📋 Example Complete Mapping

### Backend Response
```json
{
  "answer": {
    "Key Results": [
      {
        "title": "Complete Test Deployment",
        "metric_type": "numeric",
        "weight": 30,
        "initial_value": 0,
        "target_value": 100
      }
    ]
  }
}
```

### Frontend State After Processing
```typescript
{
  id: "ai-1234567890-0",
  title: "Complete Test Deployment",      // ✅ From backend
  metricType: "numeric",                  // ✅ From backend (normalized)
  weight: 30,                             // ✅ From backend
  currentValue: 0,                        // ✅ From backend (initial_value)
  targetValue: 100,                       // ✅ From backend (target_value)
  completed: false,                       // Frontend default
  deadline: undefined,                    // Frontend only
  progress: 0,                            // Frontend calculated
  description: undefined                  // Optional from backend
}
```

### UI Display
```
┌──────────────────────────────────────────────────────────┐
│ Key Result Name: Complete Test Deployment    ✅ Backend │
│ Metric Type: Numeric                          ✅ Backend │
│ Weight: 30 %                                  ✅ Backend │
│ Deadline: [Select date]                      Frontend   │
├──────────────────────────────────────────────────────────┤
│ Initial Value: 0                              ✅ Backend │
│ Target Value: 100                             ✅ Backend │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

### For Each Key Result Generated:

- [ ] **title** is displayed in "Key Result Name" field
- [ ] **metric_type** is correctly set in dropdown
- [ ] **weight** is shown with % symbol
- [ ] **initial_value** appears in "Initial Value" field (for numeric/percentage/currency)
- [ ] **target_value** appears in "Target Value" field (for numeric/percentage/currency)
- [ ] Labels change based on metric type (%, $, etc.)
- [ ] Placeholders are appropriate for each field type
- [ ] Total weight sums to 100%
- [ ] All fields are editable
- [ ] Console logs show proper field mapping

---

## 🧪 Testing Commands

### Test OKR Generation
```bash
curl -X POST "https://selamnew-ai.ienetworks.co/okr" \
  -H "Content-Type: application/json" \
  -d '{"objective": "Add AI features to SelamNew Workspaces"}' | jq
```

### Expected Fields in Response:
- ✅ `title` - Key result title
- ✅ `metric_type` - Type of metric
- ✅ `weight` - Weight percentage
- ✅ `initial_value` - Starting value (numeric types)
- ✅ `target_value` - Target value (numeric types)

### Check Browser Console:
Look for these logs:
```
✅ Extracted key results array: [...]
📊 Number of key results: 3
🔍 Processing key results from backend...
📝 KR 1: {title, metricType, weight, ...}
📝 KR 2: {title, metricType, weight, ...}
📝 KR 3: {title, metricType, weight, ...}
⚖️  Total weight before normalization: 90%
🔄 Normalizing weights to sum to 100%...
✅ Total weight after normalization: 100%
🎯 Final key results: [...]
```

---

## 📝 Summary

### Backend Fields → Frontend Display

| Backend | Frontend | UI Display | Always Shown |
|---------|----------|------------|--------------|
| `title` | `title` | Text Input | ✅ Yes |
| `metric_type` | `metricType` | Dropdown | ✅ Yes |
| `weight` | `weight` | Number + % | ✅ Yes |
| `initial_value` | `currentValue` | Number Input | Conditional |
| `target_value` | `targetValue` | Number Input | Conditional |
| - | `deadline` | Date Picker | ✅ Yes |
| - | `completed` | Checkbox | Conditional |
| - | `milestones[]` | List | Conditional |

### All Backend Fields Are Properly:
- ✅ **Extracted** from API response
- ✅ **Normalized** to frontend format
- ✅ **Displayed** with proper labels
- ✅ **Editable** by users
- ✅ **Validated** (weight sum = 100%)
- ✅ **Logged** in console for debugging

**Result:** Complete field mapping with no data loss! 🎉

