import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://uxncnpfywehwwsdjejtp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bmNucGZ5d2Vod3dzZGplanRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAzNzc5OCwiZXhwIjoyMDgwNjEzNzk4fQ.seWtDBWMXqRlRFk840E2bZ9aqdaDMQwFo2_iaCdWrtE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple login function
export const handler = async (event, context) => {
  console.log('=== LOGIN DEBUG ===');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Body received:', event.body);
  
  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        message: 'Only POST method is allowed'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body);
    console.log('Parsed body:', JSON.stringify(body, null, 2));
  } catch (e) {
    console.log('JSON parse error:', e.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  const { username, password } = body;
  console.log('Extracted credentials:', { username: username || 'undefined', password: password ? 'provided' : 'undefined' });
  
  if (!username || !password) {
    console.log('Missing credentials');
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'Credenciais inválidas',
        message: 'Usuário e senha são obrigatórios'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  try {
    // Try Supabase auth first
    console.log('Trying Supabase auth...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password
    });

    if (error) {
      console.log('Supabase auth failed, trying fallback:', error.message);
      
      // Fallback to mock users for testing
      const mockUsers = [
        { id: 1, username: 'admin@financeirototal.com', password: 'admin123', name: 'Administrador' },
        { id: 2, username: 'user@financeirototal.com', password: 'user123', name: 'Usuário Teste' }
      ];
      
      console.log('Checking mock users...');
      const mockUser = mockUsers.find(u => u.username === username && u.password === password);
      console.log('Mock user found:', mockUser ? 'YES' : 'NO');
      
      if (mockUser) {
        const token = Buffer.from(`${mockUser.id}:${Date.now()}`).toString('base64');
        
        console.log('Mock login successful for user:', mockUser.username);
        
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            user: {
              id: mockUser.id,
              username: mockUser.username,
              name: mockUser.name
            },
            token,
            isMock: true
          }),
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        };
      }
      
      console.log('Both Supabase and mock auth failed');
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          error: 'Credenciais inválidas',
          message: 'Usuário ou senha incorretos'
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    console.log('Supabase login successful for user:', data.user?.email);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user: {
          id: data.user?.id,
          username: data.user?.email,
          name: data.user?.user_metadata?.name || data.user?.email
        },
        token: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        isMock: false
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };

  } catch (error) {
    console.error('Login error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erro interno',
        message: 'Ocorreu um erro ao processar o login'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};
