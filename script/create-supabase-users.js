import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://uxncnpfywehwwsdjejtp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bmNucGZ5d2Vod3dzZGplanRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAzNzc5OCwiZXhwIjoyMDgwNjEzNzk4fQ.seWtDBWMXqRlRFk840E2bZ9aqdaDMQwFo2_iaCdWrtE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUsers() {
  try {
    console.log('Creating users in Supabase...');
    
    // Create admin user
    console.log('Creating admin user...');
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@financeirototal.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Administrador',
        role: 'admin'
      }
    });

    if (adminError) {
      console.log('Admin user creation failed:', adminError.message);
      
      // Check if user already exists
      if (adminError.message.includes('already registered')) {
        console.log('Admin user already exists');
      }
    } else {
      console.log('Admin user created successfully:', adminData);
    }

    // Create regular user
    console.log('Creating regular user...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'user@financeirototal.com',
      password: 'user123',
      email_confirm: true,
      user_metadata: {
        name: 'Usuário Teste',
        role: 'user'
      }
    });

    if (userError) {
      console.log('Regular user creation failed:', userError.message);
      
      // Check if user already exists
      if (userError.message.includes('already registered')) {
        console.log('Regular user already exists');
      }
    } else {
      console.log('Regular user created successfully:', userData);
    }

    // Test login with both users
    console.log('\n=== Testing login ===');
    
    // Test admin login
    console.log('Testing admin login...');
    const { data: adminLogin, error: adminLoginError } = await supabase.auth.signInWithPassword({
      email: 'admin@financeirototal.com',
      password: 'admin123'
    });
    
    if (adminLoginError) {
      console.log('Admin login failed:', adminLoginError.message);
    } else {
      console.log('Admin login successful:', adminLogin.user?.email);
    }

    // Test regular user login
    console.log('Testing regular user login...');
    const { data: userLogin, error: userLoginError } = await supabase.auth.signInWithPassword({
      email: 'user@financeirototal.com',
      password: 'user123'
    });
    
    if (userLoginError) {
      console.log('Regular user login failed:', userLoginError.message);
    } else {
      console.log('Regular user login successful:', userLogin.user?.email);
    }

    console.log('\n=== Users created and tested successfully ===');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createUsers();
