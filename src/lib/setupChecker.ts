import { supabase } from '@/integrations/supabase/client';

/**
 * Comprehensive Supabase setup checker
 * Run this to diagnose connection issues
 */
export async function checkSupabaseSetup(): Promise<{
  isConfigured: boolean;
  isReachable: boolean;
  canQuery: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let isConfigured = false;
  let isReachable = false;
  let canQuery = false;

  // Check 1: Environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    issues.push('VITE_SUPABASE_URL is not set in .env file');
    recommendations.push('Create or update .env file with VITE_SUPABASE_URL');
  }

  if (!supabaseKey) {
    issues.push('VITE_SUPABASE_PUBLISHABLE_KEY is not set in .env file');
    recommendations.push('Add VITE_SUPABASE_PUBLISHABLE_KEY to .env file');
  }

  if (supabaseUrl && supabaseKey) {
    isConfigured = true;

    // Check 2: Network reachability
    try {
      const healthUrl = `${supabaseUrl}/rest/v1/`;
      const response = await fetch(healthUrl, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey,
        },
      });

      if (response.ok || response.status === 401 || response.status === 400) {
        // 401/400 means we reached the server but auth/request failed - that's ok for health check
        isReachable = true;
      } else {
        issues.push(`Supabase endpoint returned status ${response.status}`);
        recommendations.push('Check if Supabase project is active in dashboard');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        issues.push('Cannot reach Supabase server - Network error');
        
        // Check if it's a local URL
        if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
          recommendations.push('Start local Supabase: supabase start');
          recommendations.push('Make sure Docker is running');
        } else {
          recommendations.push('Check your internet connection');
          recommendations.push('Verify Supabase project exists at https://supabase.com/dashboard');
          recommendations.push('The project may have been deleted or paused');
        }
      } else if (errorMessage.includes('DNS') || errorMessage.includes('ENOTFOUND')) {
        issues.push('DNS resolution failed - Project does not exist');
        recommendations.push('Create a new Supabase project at https://supabase.com/dashboard');
        recommendations.push('Update VITE_SUPABASE_URL in .env with your new project URL');
      } else {
        issues.push(`Network error: ${errorMessage}`);
      }
    }

    // Check 3: Database query
    if (isReachable) {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        
        if (!error) {
          canQuery = true;
        } else {
          issues.push(`Database query failed: ${error.message}`);
          
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            recommendations.push('Run database migrations');
            recommendations.push('Go to Supabase Dashboard → SQL Editor and run migration files');
          } else if (error.message.includes('permission') || error.message.includes('RLS')) {
            recommendations.push('Check Row Level Security (RLS) policies');
            recommendations.push('Ensure profiles table has proper policies configured');
          }
        }
      } catch (error) {
        issues.push(`Query test error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  return {
    isConfigured,
    isReachable,
    canQuery,
    issues,
    recommendations,
  };
}

/**
 * Display setup status in console with colored output
 */
export async function displaySetupStatus(): Promise<void> {
  console.log('\n🔍 Checking Supabase Setup...\n');
  
  const status = await checkSupabaseSetup();
  
  console.log('Configuration:', status.isConfigured ? '✅ Complete' : '❌ Missing');
  console.log('Reachability:', status.isReachable ? '✅ Online' : '❌ Offline');
  console.log('Database:', status.canQuery ? '✅ Accessible' : '❌ Not Accessible');
  
  if (status.issues.length > 0) {
    console.log('\n❌ Issues Found:');
    status.issues.forEach(issue => console.log(`   • ${issue}`));
  }
  
  if (status.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    status.recommendations.forEach(rec => console.log(`   • ${rec}`));
  }
  
  if (status.isConfigured && status.isReachable && status.canQuery) {
    console.log('\n✅ Supabase is fully configured and operational!');
  } else {
    console.log('\n📋 See SUPABASE_SETUP_REQUIRED.md for detailed setup instructions.');
  }
}
