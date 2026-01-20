import express from 'express';
import serverless from 'serverless-http';

// Mock user data for testing
const mockUsers = [
  { id: 1, username: 'admin', password: 'admin123', name: 'Administrador' },
  { id: 2, username: 'user', password: 'user123', name: 'Usuário Teste' }
];

const app = express();

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Login endpoint
app.post('/', async (req, res) => {
  console.log('Auth login request received:', JSON.stringify(req.body));
  
  // Only handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST method is allowed'
    });
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(JSON.stringify(req.body));
  } catch (e) {
    body = {};
  }

  const { username, password } = body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Credenciais inválidas',
      message: 'Usuário e senha são obrigatórios'
    });
  }

  // Check mock users
  const user = mockUsers.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Mock session/token
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    console.log('Login successful for user:', user.username);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      },
      token
    });
  } else {
    console.log('Login failed for user:', username);
    
    res.status(401).json({ 
      error: 'Credenciais inválidas',
      message: 'Usuário ou senha incorretos'
    });
  }
});

export const handler = serverless(app);
