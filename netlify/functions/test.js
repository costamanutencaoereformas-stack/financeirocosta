// Super simple test function
export const handler = async (event, context) => {
  console.log('Test function called:', JSON.stringify(event));
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Netlify Functions!',
      method: event.httpMethod,
      path: event.path,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  };
};
