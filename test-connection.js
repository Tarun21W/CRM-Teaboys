// Test Supabase Connection
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qvmhhirbxtdhnftpdtgg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bWhoaXJieHRkaG5mdHBkdGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTIxNjgsImV4cCI6MjA3Njg2ODE2OH0.0Ssumw-wwn8UL8xOG_nx3rBkIXE3wB35YtxkckaxPEE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n')
  
  try {
    // Test 1: Check connection
    console.log('✅ Supabase client created successfully')
    console.log('📍 URL:', supabaseUrl)
    
    // Test 2: Try to fetch from a table (will fail if tables don't exist yet)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(1)
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('\n⚠️  Tables not created yet')
        console.log('👉 Follow SETUP_DATABASE.md to create tables')
      } else {
        console.log('\n❌ Error:', error.message)
      }
    } else {
      console.log('\n✅ Connection successful!')
      console.log('✅ Tables exist!')
      if (data && data.length > 0) {
        console.log('✅ Sample data found:', data)
      } else {
        console.log('ℹ️  Tables exist but no data yet')
      }
    }
    
  } catch (err) {
    console.error('\n❌ Connection failed:', err.message)
  }
}

testConnection()
