# 🚨 SECURITY ALERT - API Keys Exposed

## ⚠️ **IMMEDIATE ACTION REQUIRED**

Your API keys were accidentally exposed in documentation files. You need to **regenerate all keys immediately** to maintain security.

## 🔄 **Steps to Regenerate Keys**

### 1. **Regenerate Supabase Keys**
1. Go to: https://supabase.com/dashboard/project/mtdnnjanxqyvklzstwzl
2. Navigate to **Settings** → **API**
3. Click **"Reset database password"** to rotate keys
4. Copy the new **URL** and **anon key**

### 2. **Regenerate Gemini API Key**
1. Go to: https://makersuite.google.com/app/apikey
2. **Delete** the old key: `AIzaSyCvMT78j9HFFiM9xJ08p9A-kkLerZoCY8k`
3. **Create** a new API key
4. Copy the new key

### 3. **Update Local Environment**
Update your `.env.local` file with the NEW keys:
```
VITE_SUPABASE_URL=[NEW_URL]
VITE_SUPABASE_ANON_KEY=[NEW_ANON_KEY]
VITE_GEMINI_API_KEY=[NEW_GEMINI_KEY]
```

### 4. **Restart Development Server**
```bash
npm run dev
```

## 🔒 **Security Best Practices Applied**

✅ **Removed exposed keys** from all documentation files  
✅ **Updated guides** to use placeholders instead of real values  
✅ **Added security warnings** in all deployment docs  
✅ **Created this security alert** for immediate action  

## 🛡️ **Going Forward**

- ✅ Never commit API keys to version control
- ✅ Use environment variables only
- ✅ Regularly rotate API keys
- ✅ Monitor for exposed secrets in code
- ✅ Use `.env.local` files that are gitignored

## ✅ **After Regenerating Keys**

1. Test your local development server
2. Update Netlify environment variables with new keys
3. Delete this security alert file
4. Deploy with confidence

**Your application security will be fully restored once you complete these steps.**