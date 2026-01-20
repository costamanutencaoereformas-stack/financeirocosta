import express from 'express';
import serverless from 'serverless-http';

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

// Auth me endpoint
app.get('/', (req, res) => {
  // Mock authenticated user check
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Não autorizado',
      message: 'Token de autenticação não fornecido'
    });
  }

  // Mock user data (in real app, validate token)
  res.json({
    success: true,
    user: {
      id: 1,
      username: 'admin',
      name: 'Administrador'
    }
  });
});

export const handler = serverless(app);
