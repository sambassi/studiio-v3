import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth/config';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const setupKey = req.headers.get('x-setup-key');
    const session = await auth();

    const validSetupKey =
      setupKey === process.env.ADMIN_SETUP_KEY &&
      !!process.env.ADMIN_SETUP_KEY;

    const isAdmin =
      session?.user?.id &&
      (session.user.email === 'contact.artboost@gmail.com');

    // Check if any admin exists
    const { count: adminCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    const noAdminExists = !adminCount || adminCount === 0;

    if (!validSetupKey && !isAdmin && !noAdminExists) {
      return NextResponse.json(
        { success: false, error: 'Non autorise' },
        { status: 401 }
      );
    }

    // Setup bassicustomshoes@gmail.com - unlimited free user
    const { data: basicUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'bassicustomshoes@gmail.com')
      .single();

    const defaultPasswordHash = await bcrypt.hash('Studiio2026!', 12);

    if (basicUser) {
      await supabase
        .from('users')
        .update({
          credits: 999999,
          plan: 'free',
          role: 'user',
          password_hash: defaultPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', basicUser.id);
    } else {
      const passwordHash = await bcrypt.hash('Studiio2026!', 12);
      await supabase.from('users').insert({
        id: uuidv4(),
        name: 'Bassi',
        email: 'bassicustomshoes@gmail.com',
        password_hash: passwordHash,
        credits: 999999,
        plan: 'free',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Setup contact.artboost@gmail.com - admin account
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'contact.artboost@gmail.com')
      .single();

    if (adminUser) {
      await supabase
        .from('users')
        .update({
          credits: 999999,
          plan: 'enterprise',
          role: 'admin',
          password_hash: defaultPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adminUser.id);
    } else {
      const passwordHash = await bcrypt.hash('Studiio2026!', 12);
      await supabase.from('users').insert({
        id: uuidv4(),
        name: 'Admin Afroboost',
        email: 'contact.artboost@gmail.com',
        password_hash: passwordHash,
        credits: 999999,
        plan: 'enterprise',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Setup termine avec succes',
      accounts: {
        admin: 'contact.artboost@gmail.com (role: admin, plan: enterprise)',
        freeUser: 'bassicustomshoes@gmail.com (role: user, plan: free, credits: illimites)',
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
