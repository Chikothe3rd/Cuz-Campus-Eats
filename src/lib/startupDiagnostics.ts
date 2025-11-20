/**
 * Startup diagnostics - runs on app initialization
 * Provides early warning for configuration issues
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export function runStartupDiagnostics() {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check environment variables
  if (!SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is not set');
  }

  if (!SUPABASE_KEY) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY is not set');
  }

  // Check if running in dev mode
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;

  if (!isDev && !isProd) {
    warnings.push('App may be running without proper build process');
  }

  // Check for common misconfigurations
  if (SUPABASE_URL && !SUPABASE_URL.startsWith('http')) {
    errors.push('VITE_SUPABASE_URL must start with http:// or https://');
  }

  if (SUPABASE_URL && SUPABASE_URL.includes('localhost') && !SUPABASE_URL.includes('54321')) {
    warnings.push('Local Supabase typically runs on port 54321, not the URL configured');
  }

  // Log diagnostics
  if (errors.length > 0 || warnings.length > 0) {
    console.group('🔍 Startup Diagnostics');
    
    if (errors.length > 0) {
      console.error('❌ Configuration Errors:');
      errors.forEach(err => console.error(`  • ${err}`));
      console.error('\n📋 See SUPABASE_SETUP_REQUIRED.md for setup instructions');
      console.error('🔧 Visit /setup page for guided diagnostics');
    }

    if (warnings.length > 0) {
      console.warn('⚠️ Warnings:');
      warnings.forEach(warn => console.warn(`  • ${warn}`));
    }

    console.groupEnd();
  } else {
    console.log('✅ Startup diagnostics passed');
  }

  return {
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
  };
}

// Auto-run on import
const diagnosticsResult = runStartupDiagnostics();

// Show browser notification for critical errors
if (diagnosticsResult.hasErrors && typeof window !== 'undefined') {
  // Add a visual banner to the page
  setTimeout(() => {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #ef4444, #dc2626);
      color: white;
      padding: 12px 20px;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      z-index: 999999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    banner.innerHTML = `
      <strong>⚠️ Configuration Error:</strong> Supabase is not set up. 
      <a href="/setup" style="color: white; text-decoration: underline; margin-left: 8px; font-weight: 600;">
        Click here for setup guide
      </a>
      <button onclick="this.parentElement.remove()" style="
        float: right;
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 2px 8px;
        cursor: pointer;
        border-radius: 3px;
      ">×</button>
    `;
    document.body.prepend(banner);
  }, 1000);
}

export default diagnosticsResult;
