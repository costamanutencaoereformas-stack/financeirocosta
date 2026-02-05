import express, { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Initialize Supabase client for server-side
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase credentials not found in environment variables');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Schema for user profile creation/update
const userProfileSchema = z.object({
  email: z.string().email(),
  fullName: z.string().optional(),
});

// Middleware to verify Supabase JWT token
async function verifySupabaseToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.substring(7);

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase não configurado no servidor' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error verifying Supabase token:', error);
    return res.status(401).json({ error: 'Erro ao verificar token' });
  }
}

// Create or update user profile in our database
router.post('/user-profile', verifySupabaseToken, async (req, res) => {
  try {
    const { email, fullName } = userProfileSchema.parse(req.body);
    const supabaseUser = req.user;

    if (!supabaseUser) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Check if user already exists in our database
    let existingUser = await storage.getUser(supabaseUser.id);

    if (existingUser) {
      // Update existing user
      const updatedUser = await storage.updateUser(supabaseUser.id, {
        fullName: fullName || existingUser.fullName,
        email: email || existingUser.email,
        username: email || existingUser.username,
      });
      return res.json({ user: updatedUser });
    } else {
      // Create new user
      const userData = supabaseUser as any;
      const newUser = await storage.createUser({
        id: supabaseUser.id,
        username: email || userData.email || supabaseUser.id,
        email: email || userData.email,
        fullName: fullName || userData.user_metadata?.full_name || email?.split('@')[0],
        role: 'viewer', // Default role
        status: 'active',
        team: null,
      });
      return res.json({ user: newUser });
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    return res.status(500).json({ error: 'Erro ao criar/atualizar perfil do usuário' });
  }
});

// Get current user profile
router.get('/me', verifySupabaseToken, async (req, res) => {
  try {
    const supabaseUser = req.user as any;

    if (!supabaseUser) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    let user = await storage.getUser(supabaseUser.id);

    if (!user) {
      // Create user if doesn't exist
      user = await storage.createUser({
        id: supabaseUser.id,
        username: supabaseUser.email || supabaseUser.id,
        email: supabaseUser.email,
        fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
        role: 'viewer',
        status: 'active',
        team: null,
      });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({ error: 'Erro ao obter perfil do usuário' });
  }
});

export default router;
