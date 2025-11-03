# Supabase Edge Function Setup Guide

## 🚀 Complete Setup Instructions

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Initialize Supabase (if not already done)
```bash
supabase init
```

### 4. Link to Your Project
```bash
supabase link --project-ref mtdnnjanxqyvklzstwzl
```

### 5. Deploy the Edge Function
```bash
supabase functions deploy gemini
```

### 6. Set Environment Variables in Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard/project/mtdnnjanxqyvklzstwzl
2. Navigate to **Settings** → **Edge Functions**
3. Add environment variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your complete Gemini API key from https://makersuite.google.com/app/apikey

### 7. Test the Function
```bash
# Test locally first
supabase functions serve gemini

# Then test with curl:
curl -X POST 'http://localhost:54321/functions/v1/gemini' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "getChatResponse",
    "payload": {
      "messages": [{"role": "user", "content": "Hello"}],
      "userProfile": null
    }
  }'
```

## 🔧 What Changed

### ✅ Created Files:
- `supabase/functions/gemini/index.ts` - Complete Edge Function with all Gemini AI operations

### ✅ Modified Files:
- `services/geminiService.ts` - Updated to call Supabase Edge Functions instead of Netlify

### ✅ Environment Setup:
- Your existing `.env.local` has the correct Supabase URL and anon key
- You need to add the complete Gemini API key to Supabase dashboard

## 🎯 Benefits of This Migration:

1. **Better Integration**: Native Supabase environment
2. **Improved Security**: Server-side API key management
3. **Cost Efficiency**: No need for separate Netlify account
4. **Unified Platform**: Everything in one place with your database
5. **Better Performance**: Edge functions run closer to your users

## 🚨 Important Notes:

1. **Get Complete Gemini API Key**: Visit https://makersuite.google.com/app/apikey and copy the FULL key
2. **Environment Variables**: Add the key in Supabase Dashboard → Settings → Edge Functions
3. **Testing**: Test locally first with `supabase functions serve` before deploying
4. **Authorization**: The edge function uses your Supabase anon key for authentication

## 📋 Next Steps:

1. Follow steps 1-6 above to deploy the function
2. Add your complete Gemini API key to Supabase dashboard
3. Test your app at http://localhost:3002/
4. All AI features should now work through Supabase Edge Functions!

## 🆘 Troubleshooting:

- **"Function not found"**: Make sure you've deployed with `supabase functions deploy gemini`
- **"GEMINI_API_KEY not configured"**: Add the environment variable in Supabase dashboard
- **"Permission denied"**: Ensure you're logged in with `supabase login`
- **API errors**: Check the function logs in your Supabase dashboard