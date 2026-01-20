// Auth me function for Netlify
export const handler = async (event, context) => {
  console.log('Auth me request received:', JSON.stringify(event));
  
  // Check authorization header
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ 
        error: 'Não autorizado',
        message: 'Token de autenticação não fornecido'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  // Mock user data (in real app, validate token)
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      user: {
        id: 1,
        username: 'admin',
        name: 'Administrador'
      }
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  };
};
