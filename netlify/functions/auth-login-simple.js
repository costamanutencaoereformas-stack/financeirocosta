// Mock user data for testing
const mockUsers = [
  { id: 1, username: 'admin', password: 'admin123', name: 'Administrador' },
  { id: 2, username: 'user', password: 'user123', name: 'Usuário Teste' }
];

// Main handler function for Netlify
export const handler = async (event, context) => {
  console.log('Auth login request received:', JSON.stringify(event));
  
  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        message: 'Only POST method is allowed'
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      }
    };
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    body = {};
  }

  const { username, password } = body;
  
  if (!username || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'Credenciais inválidas',
        message: 'Usuário e senha são obrigatórios'
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      }
    };
  }

  // Check mock users
  const user = mockUsers.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Mock session/token
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    console.log('Login successful for user:', user.username);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name
        },
        token
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      }
    };
  } else {
    console.log('Login failed for user:', username);
    
    return {
      statusCode: 401,
      body: JSON.stringify({ 
        error: 'Credenciais inválidas',
        message: 'Usuário ou senha incorretos'
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      }
    };
  }
};
