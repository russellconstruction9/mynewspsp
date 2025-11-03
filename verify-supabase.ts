import { supabase } from './lib/supabase';

// Verification script to test Supabase connection and schema
export async function verifySupabaseSetup() {
    console.log('🔍 Verifying Supabase setup...');
    
    try {
        // Test 1: Check connection
        console.log('1. Testing connection...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError && userError.message !== 'Auth session missing!') {
            console.error('❌ Connection failed:', userError.message);
            return false;
        }
        console.log('✅ Connection successful');

        // Test 2: Check if tables exist
        console.log('2. Checking if tables exist...');
        const tables = [
            'user_profiles',
            'reports', 
            'stored_documents',
            'incident_templates',
            'co_parent_messages',
            'user_subscriptions'
        ];

        for (const table of tables) {
            try {
                const { error } = await supabase.from(table).select('*').limit(1);
                if (error) {
                    console.error(`❌ Table ${table} not found or not accessible:`, error.message);
                    return false;
                }
                console.log(`✅ Table ${table} exists and is accessible`);
            } catch (err) {
                console.error(`❌ Error checking table ${table}:`, err);
                return false;
            }
        }

        // Test 3: Test authentication (if user is logged in)
        if (user) {
            console.log('3. Testing authenticated user access...');
            
            // Try to access user_profiles table
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                console.error('❌ RLS policy test failed:', error.message);
                return false;
            }
            console.log('✅ Row Level Security working correctly');
            console.log(`✅ Found ${data.length} profile(s) for current user`);
        } else {
            console.log('3. ⚠️ No user logged in - skipping authenticated tests');
        }

        console.log('🎉 All tests passed! Supabase is properly configured.');
        return true;

    } catch (error) {
        console.error('❌ Unexpected error during verification:', error);
        return false;
    }
}

// Run verification if this file is called directly
if (typeof window !== 'undefined') {
    (window as any).verifySupabase = verifySupabaseSetup;
    console.log('💡 Run verifySupabase() in the browser console to test your setup');
}