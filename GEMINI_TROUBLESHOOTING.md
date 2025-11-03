# 🔧 Gemini AI Incident Reporting - Troubleshooting

## ❌ **Issue:** Incident reporting AI call agent not working

### **Potential Causes & Solutions:**

#### 1. **API Key Issues**
**Symptoms:** Error messages about API key, 401 unauthorized
**Check:**
```bash
# In browser console, check if API key is loaded:
console.log('API Key exists:', !!import.meta.env.VITE_GEMINI_API_KEY);
console.log('API Key preview:', import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 10) + '...');
```

**Solutions:**
- Verify `VITE_GEMINI_API_KEY` is set in Netlify environment variables
- Check if API key is valid at https://makersuite.google.com/app/apikey
- Ensure API key has Gemini API access enabled

#### 2. **Network/CORS Issues**
**Symptoms:** Network errors, blocked requests
**Check:** Browser Network tab for failed requests to `generativelanguage.googleapis.com`

**Solutions:**
- Check if Gemini API is accessible from your domain
- Verify no ad blockers are blocking the requests

#### 3. **Token Limits**
**Symptoms:** Feature blocked for free users
**Check:** Look for "upgrade" messages or token limit warnings

**Solutions:**
- Check subscription tier allows AI features
- Verify `hasSufficientTokens()` returns true

#### 4. **Component State Issues**
**Symptoms:** Button not responsive, no loading states
**Check:** Look for JavaScript errors in console

### **Debugging Steps:**

#### Step 1: Check Environment Variables
Open browser console on your Netlify site and run:
```javascript
console.log('Environment check:', {
  hasGeminiKey: !!import.meta.env.VITE_GEMINI_API_KEY,
  hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});
```

#### Step 2: Test API Call Directly
In browser console:
```javascript
// Test the Gemini service directly
import('./services/geminiService.js').then(service => {
  service.getChatResponse([{role: 'user', content: 'test'}], null)
    .then(result => console.log('✅ API working:', result))
    .catch(error => console.error('❌ API failed:', error));
});
```

#### Step 3: Check Network Requests
1. Open Developer Tools → Network tab
2. Try to send a message in incident reporting
3. Look for requests to `generativelanguage.googleapis.com`
4. Check for any 4xx/5xx errors

### **Quick Fixes:**

#### If API Key is Missing/Invalid:
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add/update `VITE_GEMINI_API_KEY` with valid key
3. Trigger new deployment

#### If Network Issues:
1. Check if using HTTPS (required for Gemini API)
2. Verify no browser extensions blocking requests
3. Try from different network/device

#### If Token Limits:
1. Check subscription tier in app
2. Look for "upgrade" prompts
3. Verify token counting logic

### **Expected Behavior:**
When working correctly:
1. ✅ User types message in incident reporting chat
2. ✅ Loading spinner appears
3. ✅ AI response appears within 2-5 seconds
4. ✅ No console errors
5. ✅ Token count updates if applicable

### **Still Not Working?**
Check these files for specific error messages:
- Browser console (F12)
- Network tab for failed requests
- Netlify deploy logs for build issues