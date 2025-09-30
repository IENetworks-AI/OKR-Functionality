# API Endpoints Integration Guide

## Overview
This document describes the API endpoints used for fetching objectives, key results, and plans dynamically. The application now automatically fetches data from the backend instead of using hardcoded values.

## Environment Variables Required

Add these variables to your `.env` file:

```env
# Firebase Authentication
VITE_EMAIL=your-email@example.com
VITE_PASSWORD=your-password
VITE_FIREBASE_API_KEY=your-firebase-api-key

# Backend API Configuration
VITE_API_BASE_URL=https://ie-okr-backend.selamnew.com/api/v1
VITE_TENANT_ID=9b320d7d-bece-4dd4-bb87-dd226f70daef

# Plan IDs (for fetching plan tasks)
VITE_DAILY_PLAN_ID=f157473c-500d-4aa4-808d-a960f2498937
VITE_WEEKLY_PLAN_ID=d000ce31-c0e7-44fa-a17e-0d75f2e88c91

# User IDs (optional - for direct key results fetching)
VITE_USER_ID_TO_FETCH=783a79a8-d8aa-4b47-95b5-dc459e81af1b
VITE_SUPERVISOR_USER_ID=cfc5d4db-d91f-428e-b8d3-4b45a0670010
```

## API Endpoints Implemented

### 1. User Key Results
**Endpoint:** `GET /key-results?userId={user_id}`

**Purpose:** Fetch key results for a specific user

**Headers Required:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`
- `tenantId: {tenant_id}`
- `userId: {user_id}`

**Response Structure:**
```json
{
  "keyResults": {
    "items": [
      {
        "id": "...",
        "title": "...",
        "objective": { "title": "..." }
      }
    ],
    "meta": { "totalItems": 12 }
  }
}
```

**Usage in Code:**
```typescript
import { fetchUserKeyResults } from '@/lib/okrApi';

const keyResults = await fetchUserKeyResults(userId);
```

### 2. Supervisor Key Results
**Endpoint:** `GET /key-results/user/{supervisor_user_id}`

**Purpose:** Fetch supervisor's key results for alignment purposes

**Headers Required:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`
- `tenantId: {tenant_id}`

**Response Structure:**
```json
{
  "requesterUserId": "...",
  "supervisorUserId": "...",
  "keyResults": {
    "items": [
      {
        "id": "c84e3c1a-a5b8-4944-a6ac-c910f637b4fa",
        "title": "Finalize GTM for AI and also Attend 6 Division meeting",
        "objectiveId": "...",
        "objective": {
          "title": "Achieve 6 TNA Certifications...",
          "userId": "..."
        },
        "progress": "16.67",
        "weight": "30.00",
        ...
      }
    ],
    "meta": {
      "totalItems": 12,
      "currentPage": 1
    }
  }
}
```

**Usage in Code:**
```typescript
import { fetchSupervisorKeyResults } from '@/lib/okrApi';

const supervisorKRs = await fetchSupervisorKeyResults(supervisorUserId);
```

**Integration Points:**
- `OKRModal.tsx`: Automatically fetches supervisor key results when modal opens
- No more hardcoded supervisor key results array
- Handles nested `keyResults.items` structure automatically

### 3. Weekly Plans
**Endpoint:** `GET /weekly-plans?userId={user_id}`

**Purpose:** Fetch user's weekly plans

**Headers Required:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`
- `tenantId: {tenant_id}`
- `userId: {user_id}`

**Usage in Code:**
```typescript
import { fetchWeeklyPlans } from '@/lib/okrApi';

const weeklyPlans = await fetchWeeklyPlans(userId);
```

### 4. Plan Tasks by Plan ID
**Endpoint:** `GET /plan-tasks/get-reported-plan-tasks/by-plan-id/{plan_id}`

**Purpose:** Fetch plan tasks for a specific plan (Daily or Weekly)

**Headers Required:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`
- `tenantId: {tenant_id}`

**Usage in Code:**
```typescript
import { fetchPlans } from '@/lib/okrApi';

const { keyResults, plans } = await fetchPlans('Daily'); // or 'Weekly'
```

### 5. User Information (Dynamic)
**Endpoint:** `GET /users/{user_id}`

**Purpose:** Fetch user details (name, role, email) dynamically

**Headers Required:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`
- `tenantId: {tenant_id}`

**Usage in Code:**
```typescript
import { fetchUserInfo } from '@/lib/okrApi';

const userInfo = await fetchUserInfo(userId);
// Returns: { id, name, role, email }
```

**Note:** User information is automatically cached to reduce API calls.

## Changes Made

### 1. `okrApi.ts` Enhancements
- ✅ Removed hardcoded `userMap`
- ✅ Added `fetchUserInfo()` with caching
- ✅ Added `fetchUserKeyResults()`
- ✅ Added `fetchSupervisorKeyResults()`
- ✅ Added `fetchWeeklyPlans()`
- ✅ Updated `fetchPlans()` to dynamically fetch user information

### 2. `OKRModal.tsx` Updates
- ✅ Removed hardcoded supervisor key results array
- ✅ Added dynamic fetching of supervisor key results on modal open
- ✅ Supervisor KRs are now fetched from `VITE_SUPERVISOR_USER_ID`

### 3. `PlanningDashboard.tsx` Updates
- ✅ Enhanced to optionally fetch direct user key results
- ✅ Merges key results from plans and direct user endpoint
- ✅ Improved error handling and logging

## Testing Reference

The Python test script that validated these endpoints:

```python
# Fetch supervisor key results
def fetch_supervisor_key_results(headers, base_url, supervisor_user_id):
    url = f"{base_url}/key-results/user/{supervisor_user_id}"
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    key_results = data.get("keyResults", data) if isinstance(data, dict) else data
    return key_results

# Fetch user key results
def fetch_user_key_results(headers, base_url, user_id):
    url = f"{base_url}/key-results?userId={user_id}"
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()

# Fetch weekly plans
def fetch_weekly_plans(headers, base_url, user_id):
    url = f"{base_url}/weekly-plans?userId={user_id}"
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()
```

## Benefits

1. **No More Hardcoding**: All user data, supervisor KRs, and plans are fetched dynamically
2. **Automatic User Info**: User details are fetched automatically and cached
3. **Flexible Configuration**: Use environment variables to configure different users/supervisors
4. **Better Error Handling**: Graceful fallbacks when data is unavailable
5. **Scalable**: Works with any tenant, user, or supervisor without code changes

## Troubleshooting

### No Supervisor Key Results Showing
- Check that `VITE_SUPERVISOR_USER_ID` is set in your `.env` file
- Verify the supervisor user ID is valid in your tenant
- Check browser console for API errors

### No User Key Results
- Ensure `VITE_USER_ID_TO_FETCH` is set (optional feature)
- Verify the user has key results in the system
- Check API response in browser Network tab

### Authentication Errors
- Verify `VITE_EMAIL`, `VITE_PASSWORD`, and `VITE_FIREBASE_API_KEY` are correct
- Check that the token is not expired
- Ensure Firebase authentication is enabled for your project

### Missing User Information
- The system will fallback to "Unknown User" and "Unknown Role" if user info cannot be fetched
- Check that the `/users/{user_id}` endpoint is accessible
- Verify the user ID exists in your tenant

## Example .env File

```env
# Firebase Authentication
VITE_EMAIL=muluken.a@ienetworks.co
VITE_PASSWORD=162093
VITE_FIREBASE_API_KEY=AIzaSyC2H3_6GRQe48d2xZ0JJ2tjs1vX0eGboSw

# Backend API
VITE_API_BASE_URL=https://ie-okr-backend.selamnew.com/api/v1
VITE_TENANT_ID=9b320d7d-bece-4dd4-bb87-dd226f70daef

# Plan IDs
VITE_DAILY_PLAN_ID=f157473c-500d-4aa4-808d-a960f2498937
VITE_WEEKLY_PLAN_ID=d000ce31-c0e7-44fa-a17e-0d75f2e88c91

# User Context
VITE_USER_ID_TO_FETCH=783a79a8-d8aa-4b47-95b5-dc459e81af1b
VITE_SUPERVISOR_USER_ID=cfc5d4db-d91f-428e-b8d3-4b45a0670010
```

## Testing the Implementation

1. Set up your `.env` file with the required variables
2. Start the development server: `npm run dev`
3. Open the OKR Management modal - supervisor KRs should load automatically
4. Create a plan - key results should be fetched dynamically
5. Check browser console for API calls and responses

## Future Enhancements

- [ ] Add team member selection for fetching their key results
- [ ] Implement real-time updates via WebSocket
- [ ] Add offline support with local caching
- [ ] Implement pagination for large datasets

