# 🔧 Fix Connection Between Frontend and Backend

## ✅ Changes Made

### 1. Backend (`server.js`)

#### CORS Configuration Improved
- ✅ Explicitly allows `http://localhost:3000` and `http://127.0.0.1:3000`
- ✅ Better logging for CORS issues
- ✅ Still allows all origins in development mode for flexibility

**Changes:**
```javascript
// Default allowed origins for development
const defaultDevOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
];
```

#### Port Configuration
- ✅ Server listens on port 5000 (from `process.env.PORT || 5000`)
- ✅ Binds to `0.0.0.0` to allow network access

### 2. Frontend (`frontend/src/utils/api.js`)

#### API URL Configuration
- ✅ Default baseURL: `http://localhost:5000/api`
- ✅ Added console logging to show which API URL is being used
- ✅ Increased timeout from 10s to 30s

**Changes:**
```javascript
const apiUrl = getApiUrl();
console.log('🔗 API Base URL:', apiUrl);

const api = axios.create({
  baseURL: apiUrl,
  timeout: 30000, // Increased from 10000
  // ...
});
```

#### Error Handling Improved
- ✅ Better network error detection
- ✅ Detailed console logging for debugging
- ✅ Helpful error messages with troubleshooting tips

**New Error Messages:**
- Network errors: Shows connection troubleshooting steps
- Timeout errors: Clear timeout message
- API errors: Status-specific messages

### 3. Login Component (`frontend/src/components/Login.js`)

#### Error Handling Enhanced
- ✅ Better detection of network errors (`ERR_NETWORK`, `Failed to fetch`)
- ✅ Timeout error handling
- ✅ More helpful error messages

## 🧪 Testing

### 1. Verify Backend is Running

```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Should return:
# {"success":true,"message":"Dev server is running",...}
```

### 2. Check Port

```bash
# Windows
netstat -ano | findstr :5000

# Should show:
# TCP    0.0.0.0:5000           0.0.0.0:0              LISTENING
```

### 3. Test from Frontend

1. Open browser console (F12)
2. Navigate to `http://localhost:3000/login`
3. Look for console log: `🔗 API Base URL: http://localhost:5000/api`
4. Try to login or click "Đăng nhập với Google"
5. Check console for any errors

## 🔍 Debugging

### If "Backend not ready" Error Persists

1. **Check Backend Status:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Check Browser Console:**
   - Open F12 → Console tab
   - Look for:
     - `🔗 API Base URL: ...`
     - Network errors (red)
     - CORS errors

3. **Check Network Tab:**
   - Open F12 → Network tab
   - Try to login
   - Look for failed requests to `http://localhost:5000/api/...`
   - Check:
     - Status code
     - Response headers (CORS headers)
     - Request URL

4. **Common Issues:**

   **Issue: CORS Error**
   - **Symptom:** `Access-Control-Allow-Origin` error in console
   - **Fix:** Backend CORS should allow `http://localhost:3000` (already fixed)

   **Issue: Connection Refused**
   - **Symptom:** `ERR_CONNECTION_REFUSED` or `Network Error`
   - **Fix:** 
     - Ensure backend is running: `npm run dev`
     - Check port 5000 is not blocked by firewall

   **Issue: Timeout**
   - **Symptom:** Request takes too long, then timeout
   - **Fix:** 
     - Check backend is responding: `curl http://localhost:5000/api/health`
     - Timeout increased to 30s (already fixed)

## 📋 Checklist

- [x] Backend listens on port 5000
- [x] CORS allows `http://localhost:3000`
- [x] Frontend baseURL is `http://localhost:5000/api`
- [x] Error handling improved
- [x] Logging added for debugging
- [x] Timeout increased to 30s

## 🎯 Expected Behavior

1. **Frontend Console:**
   ```
   🔗 API Base URL: http://localhost:5000/api
   ```

2. **Backend Console:**
   ```
   🚀 Express server started
   Host: 0.0.0.0
   Port: 5000
   Local: http://localhost:5000
   ```

3. **Network Request:**
   - URL: `http://localhost:5000/api/auth/firebase`
   - Status: 200 (success) or appropriate error code
   - Headers include CORS headers

## 🆘 Still Having Issues?

1. **Restart Both Servers:**
   ```bash
   # Terminal 1: Backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm start
   ```

2. **Clear Browser Cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

3. **Check Firewall:**
   - Ensure port 5000 is not blocked
   - Windows Firewall may block Node.js

4. **Check .env Files:**
   - Backend `.env`: Ensure `PORT=5000`
   - Frontend `.env` (optional): Can set `REACT_APP_API_URL=http://localhost:5000/api`

---

**Last Updated:** 2024-11-30

