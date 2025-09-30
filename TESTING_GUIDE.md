# 🧪 Testing Guide - Backend Field Mapping

## Quick Test Checklist

### ✅ Before Testing
1. Start development server: `npm run dev`
2. Open browser console (F12)
3. Navigate to OKR creation

---

## 🎯 Test 1: Basic Field Display

### Steps:
1. Click "Create OKR"
2. Check that all fields are visible

### Expected Results:
```
Objective Section:
✅ "Objective" field with placeholder
✅ "Alignment" dropdown with options
✅ "Objective Deadline" date picker

Key Result Section (after clicking "+ Key Result"):
✅ "Key Result Name" field
✅ "Metric Type" dropdown
✅ "Weight" field with %
✅ "Deadline" date picker
```

---

## 🤖 Test 2: AI Generation from Backend

### Steps:
1. Select an alignment from dropdown
2. Wait for AI generation
3. Check browser console
4. Verify UI fields are populated

### Expected Console Output:
```
✅ Extracted key results array: [...]
📊 Number of key results: 3
🔍 Processing key results from backend...
📝 KR 1: {
  title: "...",
  metricType: "numeric",
  weight: 30,
  currentValue: 0,
  targetValue: 100,
  raw: {...}
}
📝 KR 2: {...}
📝 KR 3: {...}
⚖️  Total weight before normalization: 90%
🔄 Normalizing weights to sum to 100%...
✅ Total weight after normalization: 100%
🎯 Final key results: [...]
```

### Expected UI:
```
✅ Key Results cards appear
✅ All titles filled from backend
✅ Metric types set correctly
✅ Weights populated and sum to 100%
✅ Initial/Target values filled (for numeric types)
```

---

## 📊 Test 3: Metric Type - Numeric

### Backend Returns:
```json
{
  "title": "Complete Test Deployment",
  "metric_type": "numeric",
  "weight": 30,
  "initial_value": 0,
  "target_value": 100
}
```

### Expected UI Display:
```
Key Result Name: Complete Test Deployment ✅
Metric Type: Numeric ✅
Weight: 30 % ✅
Deadline: [Select date]

Initial Value        Target Value
[0]                  [100]
✅ Label: "Initial Value"
✅ Label: "Target Value"
✅ Values populated from backend
```

---

## 📊 Test 4: Metric Type - Percentage

### Backend Returns:
```json
{
  "title": "Increase User Engagement",
  "metric_type": "percentage",
  "weight": 25,
  "initial_value": 0,
  "target_value": 100
}
```

### Expected UI Display:
```
Key Result Name: Increase User Engagement ✅
Metric Type: Percentage ✅
Weight: 25 % ✅

Initial Value (%)    Target Value (%)
[0]                  [100]
✅ Labels include "(%)"
✅ Values populated from backend
```

---

## 📊 Test 5: Metric Type - Currency

### Backend Returns:
```json
{
  "title": "Increase Revenue",
  "metric_type": "currency",
  "weight": 20,
  "initial_value": 0,
  "target_value": 10000
}
```

### Expected UI Display:
```
Key Result Name: Increase Revenue ✅
Metric Type: Currency ✅
Weight: 20 % ✅

Initial Value ($)    Target Value ($)
[0]                  [10000]
✅ Labels include "($)"
✅ Placeholder: "0.00" / "1000.00"
✅ Values populated from backend
```

---

## 📊 Test 6: Metric Type - Achieved

### Backend Returns:
```json
{
  "title": "Finalize UI Design",
  "metric_type": "achieved",
  "weight": 25
}
```

### Expected UI Display:
```
Key Result Name: Finalize UI Design ✅
Metric Type: Achieved ✅
Weight: 25 % ✅

☐ Mark as Achieved
✅ Checkbox displayed
✅ No initial/target value fields
```

---

## 📊 Test 7: Metric Type - Milestone

### Expected UI Display:
```
Key Result Name: [...]
Metric Type: Milestone ✅
Weight: [...] %

Milestones
[Set Milestone] [100%] [Add Milestone]
✅ Input field visible
✅ Add button enabled when text entered
✅ Can add multiple milestones
✅ Each milestone has delete button
```

---

## ⚖️ Test 8: Weight Calculation

### Steps:
1. Generate 3 key results from backend
2. Check console for weight normalization
3. Verify total weight display

### Expected Results:
```
Backend weights: 30, 30, 30 (total: 90)
Console shows:
⚖️  Total weight before normalization: 90%
🔄 Normalizing weights to sum to 100%...
✅ Total weight after normalization: 100%

UI shows:
Total Weight: 100% (in green) ✅
```

---

## 🔍 Test 9: Field Labels

### Check Each Key Result Card:

#### Row 1 - Always Visible:
```
✅ "Key Result Name" label
✅ "Metric Type" label
✅ "Weight" label
✅ "Deadline" label
```

#### Row 2 - Dynamic Based on Type:

**For Numeric:**
```
✅ "Initial Value" label
✅ "Target Value" label
```

**For Percentage:**
```
✅ "Initial Value (%)" label
✅ "Target Value (%)" label
```

**For Currency:**
```
✅ "Initial Value ($)" label
✅ "Target Value ($)" label
```

**For Achieved:**
```
✅ "Mark as Achieved" label
```

**For Milestone:**
```
✅ "Milestones" label
✅ "Set Milestone" placeholder
```

---

## 📝 Test 10: Placeholder Text

### Check Placeholders:

| Field | Expected Placeholder | Status |
|-------|---------------------|--------|
| Key Result Name | "Enter key result name" | ✅ |
| Metric Type | "Select metric type" | ✅ |
| Weight | "Weight" | ✅ |
| Deadline | "Select date" | ✅ |
| Initial Value (numeric) | "0" | ✅ |
| Target Value (numeric) | "100" | ✅ |
| Initial Value (percentage) | "0" | ✅ |
| Target Value (percentage) | "100" | ✅ |
| Initial Value (currency) | "0.00" | ✅ |
| Target Value (currency) | "1000.00" | ✅ |
| Set Milestone | "Set Milestone" | ✅ |

---

## 🧪 Test 11: Direct API Test

### Command:
```bash
curl -X POST "https://selamnew-ai.ienetworks.co/okr" \
  -H "Content-Type: application/json" \
  -d '{"objective": "Add AI features to SelamNew Workspaces"}' \
  -s | jq '.'
```

### Expected Response:
```json
{
  "answer": {
    "Key Results": [
      {
        "title": "...",
        "metric_type": "achieved|numeric|...",
        "weight": 30,
        "initial_value": 0,  // for numeric types
        "target_value": 100  // for numeric types
      }
    ]
  }
}
```

### Verify:
```
✅ Response has "answer" object
✅ "answer" has "Key Results" array
✅ Each KR has "title"
✅ Each KR has "metric_type"
✅ Each KR has "weight"
✅ Numeric KRs have "initial_value"
✅ Numeric KRs have "target_value"
```

---

## 🎯 Test 12: Complete Flow

### Full Test Scenario:
1. ✅ Open OKR Modal
2. ✅ Fill Objective: "Improve Product Quality"
3. ✅ Select Alignment: [Any option]
4. ✅ Select Deadline: [Future date]
5. ✅ Wait for AI generation
6. ✅ Verify 3 key results appear
7. ✅ Check each KR has all fields populated
8. ✅ Verify weights sum to 100%
9. ✅ Check console logs
10. ✅ Edit one KR manually
11. ✅ Add manual KR
12. ✅ Verify total weight updates
13. ✅ Click Save
14. ✅ Verify OKR is saved

---

## ❌ Common Issues & Solutions

### Issue 1: Fields Not Populated
**Check:**
- Browser console for errors
- Network tab for API response
- Console logs for field extraction

**Solution:**
- Verify backend is returning data
- Check field mapping in `okrAi.ts`

### Issue 2: Wrong Metric Type
**Check:**
- Console log for "metric_type" value
- Check normalization logic

**Solution:**
- Verify metric type mapping in `okrAi.ts`

### Issue 3: Weight Not 100%
**Check:**
- Console logs for weight normalization
- Individual KR weights

**Solution:**
- Verify normalization logic runs
- Check if all KRs have weights

### Issue 4: Labels Not Showing
**Check:**
- Browser dev tools
- Component structure

**Solution:**
- Verify `<Label>` components are rendered
- Check CSS visibility

---

## 📊 Success Criteria

### All Tests Must Show:

1. **Labels Present**: ✅
   - All fields have descriptive labels
   - Labels are visible and readable

2. **Placeholders Correct**: ✅
   - All placeholders are appropriate
   - Dynamic placeholders work

3. **Backend Values Populated**: ✅
   - Title filled from backend
   - Metric type set from backend
   - Weight filled from backend
   - Initial/Target values filled

4. **Console Logs Working**: ✅
   - Shows extraction process
   - Shows each KR details
   - Shows weight normalization

5. **Weight Calculation**: ✅
   - Sum equals 100%
   - Green indicator shows
   - Normalization works

6. **Editable Fields**: ✅
   - Can edit all values
   - Changes are saved
   - Validation works

---

## 🚀 Quick Test Script

Run this in browser console after generating OKRs:

```javascript
// Check if all fields are populated
const checkOKRFields = () => {
  const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
  const selects = document.querySelectorAll('select');
  
  console.log('📊 Field Check:');
  console.log('Text/Number inputs:', inputs.length);
  console.log('Selects:', selects.length);
  
  // Check for empty required fields
  const emptyFields = [];
  inputs.forEach(input => {
    if (input.required && !input.value) {
      emptyFields.push(input.placeholder || input.name);
    }
  });
  
  if (emptyFields.length === 0) {
    console.log('✅ All required fields populated!');
  } else {
    console.log('❌ Empty fields:', emptyFields);
  }
};

checkOKRFields();
```

---

## ✅ Final Checklist

- [ ] All field labels visible
- [ ] All placeholders appropriate
- [ ] Backend values populate correctly
- [ ] Console logs show processing
- [ ] Weights sum to 100%
- [ ] Metric types recognized
- [ ] Dynamic labels work
- [ ] Can edit all fields
- [ ] Can add/delete milestones
- [ ] Save button works
- [ ] No console errors
- [ ] TypeScript compiles

**When all checked: Ready for production! 🎉**

