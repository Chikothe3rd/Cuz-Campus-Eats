import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/log';

/**
 * Test Supabase connectivity and configuration
 * Useful for debugging connection issues
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}> {
  try {
    logger.info('Testing Supabase connection...');

    // Test 1: Check if client is initialized
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase client not initialized',
      };
    }

    // Test 2: Try a simple query (check if we can reach the database)
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      logger.error('Supabase connection test failed', { error });
      return {
        success: false,
        message: `Database query failed: ${error.message}`,
        details: { code: error.code, hint: error.hint },
      };
    }

    // Test 3: Check auth session
    const { data: sessionData } = await supabase.auth.getSession();
    
    logger.info('Supabase connection test passed', {
      canQueryDb: true,
      hasSession: !!sessionData.session,
    });

    return {
      success: true,
      message: 'Supabase connection successful',
      details: {
        canQueryDatabase: true,
        hasActiveSession: !!sessionData.session,
        userId: sessionData.session?.user?.id,
      },
    };
  } catch (err) {
    logger.error('Supabase connection test error', { err });
    return {
      success: false,
      message: `Connection test error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Test authentication functionality
 */
export async function testSupabaseAuth(email: string, password: string): Promise<{
  success: boolean;
  message: string;
  userId?: string;
}> {
  try {
    logger.info('Testing Supabase auth...', { email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Auth test failed', { error });
      return {
        success: false,
        message: `Auth failed: ${error.message}`,
      };
    }

    if (!data.user) {
      return {
        success: false,
        message: 'No user returned from auth',
      };
    }

    logger.info('Auth test passed', { userId: data.user.id });

    return {
      success: true,
      message: 'Authentication successful',
      userId: data.user.id,
    };
  } catch (err) {
    logger.error('Auth test error', { err });
    return {
      success: false,
      message: `Auth test error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
