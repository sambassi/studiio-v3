import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FREE_CREDITS = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe doit contenir au moins 6 caract\u00e8res' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Un compte avec cet email existe d\u00e9j\u00e0' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: uuidv4(),
        name,
        email,
        password_hash: passwordHash,
        credits: FREE_CREDITS,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la cr\u00e9ation du compte' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: newUser.id, email: newUser.email, name: newUser.name },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
