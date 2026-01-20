// Health check function for Netlify
export const handler = async (event, context) => {
  console.log('Health check requested:', JSON.stringify(event));
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      status: 'ok', 
      message: 'API is working',
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  };
};
