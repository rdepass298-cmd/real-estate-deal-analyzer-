// Test script to verify Supabase connection
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = envContent.split('\n').reduce((acc: Record<string, string>, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ FAILED: Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Attempt a simple health check by querying the auth status
const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ FAILED: Auth error:', error.message);
      process.exit(1);
    }
    
    console.log('✅ SUCCESS: Supabase connection is working!');
    console.log('Session data retrieved (may be null if no auth session)');
    process.exit(0);
  } catch (err) {
    console.error('❌ FAILED: Connection error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
};

testConnection();
