# 🔐 Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for your CustodyX.AI application.

## 🚀 Quick Start

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: CustodyX-AI (or any name you prefer)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
5. Click "Create new project"

### Step 2: Get Your Project Credentials

1. Once your project is created, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://abcdefgh.supabase.co`)
   - **Anon Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 3: Update Environment Variables

1. Open your `.env.local` file
2. Replace the placeholder values:

```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase-schema.sql`
3. Paste it into the SQL Editor
4. Click **Run** to create all tables and security policies

### Step 5: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Configure your authentication settings:

#### Site URL
- **Site URL**: `http://localhost:3000` (for development)
- For production, add your actual domain: `https://yourdomain.com`

#### Email Settings (Optional)
- Configure email templates if you want custom emails
- Set up SMTP settings for password reset emails

#### Providers (Optional)
You can enable social login providers:
- Google OAuth
- GitHub OAuth
- Discord OAuth
- And many more...

### Step 6: Test the Setup

1. Start your development server:
```bash
npm run dev
```

2. Visit `http://localhost:3000`
3. You should see the authentication form instead of the landing page
4. Try creating a new account
5. Check your email for the verification link
6. After verification, you should be able to log in

## 🔒 Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- No user can see or modify another user's information

### Data Isolation
- Each user's data is completely isolated
- Authentication is required for all database operations
- Automatic user ID association with all records

### Privacy-First Architecture
- Data can still work offline-first with localStorage
- Supabase sync happens in the background
- Users maintain control over their data

## 📊 Data Migration

When users first log in with existing localStorage data:

1. **Automatic Migration**: The system automatically detects existing localStorage data
2. **One-Time Transfer**: Data is migrated to Supabase on first authentication
3. **Backup Preserved**: localStorage data remains as a backup
4. **Sync Enabled**: Future changes sync between local and cloud storage

## 🛠️ Troubleshooting

### Common Issues

**1. Environment Variables Not Loading**
- Make sure `.env.local` is in the root directory
- Restart your dev server after changing environment variables
- Check that variable names start with `VITE_`

**2. Database Connection Errors**
- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is running
- Ensure the database schema has been applied

**3. Authentication Not Working**
- Check that email confirmation is enabled in Supabase settings
- Verify your site URL is correctly configured
- Check browser console for error messages

**4. RLS Policy Errors**
- Make sure the database schema was applied correctly
- Check that RLS policies are enabled on all tables
- Verify user is properly authenticated

### Error Messages

**"Missing Supabase environment variables"**
- Check your `.env.local` file has the correct variables
- Restart your development server

**"Invalid JWT"**
- Your anon key might be incorrect
- Copy the key again from Supabase dashboard

**"Row Level Security policy violation"**
- The RLS policies might not be set up correctly
- Re-run the schema SQL script

## 🔄 Data Flow

### Authentication Flow
```
User Login → Supabase Auth → JWT Token → Protected Routes
```

### Data Sync Flow
```
User Action → localStorage (immediate) → Supabase (background) → Other Devices
```

### Offline Support
```
No Internet → localStorage Only → Sync When Online
```

## 🎯 Production Deployment

### Environment Variables for Production
Update your production environment with:
- `VITE_SUPABASE_URL`: Your production Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Your production anon key
- `GEMINI_API_KEY`: Your Gemini API key

### Site URL Configuration
In Supabase dashboard:
1. Go to **Authentication** → **Settings**
2. Update **Site URL** to your production domain
3. Add your domain to **Redirect URLs**

### Database Backup
- Supabase automatically backs up your database
- You can also export data from the dashboard
- Consider setting up additional backup strategies for critical data

## 📞 Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure the database schema was applied properly
4. Check Supabase dashboard logs for authentication issues

The authentication system is designed to be:
- **Secure**: Industry-standard JWT authentication
- **Privacy-focused**: Your data stays in your control
- **Offline-friendly**: Works without internet connection
- **Scalable**: Supports multiple users and devices

Your users can now securely access their incident documentation from any device while maintaining complete privacy and data ownership.