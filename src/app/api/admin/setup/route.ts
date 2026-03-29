import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const setupKey = req.headers.get('x-setup-key');
    const sessionValid = await getServerSession(authOptions);

    // Check if setup key is valid
    const validSetupKey =
      setupKey === process.env.ADMIN_SETUP_KEY &&
      process.env.ADMIN_SETUP_KEY;

    // Check if user is admin
    const isAdmin =
      sessionValid?.user?.email &&
      (sessionValid.user.email === 'contact.artboost@gmail.com' ||
        sessionValid.user.email === 'bassicustomshoes@gmail.com');

    // Check if any admin exists
    const { count: adminCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    const noAdminExists = adminCount === 0;

    // Authorization check
    if (!validSetupKey && !isAdmin && !noAdminExists) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Setup bassicustomshoes@gmail.com - unlimited free user
    const { data: basicUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'bassicustomshoes@gmail.com')
      .single();

    if (basicUser) {
      // Update existing user
      await supabase
        .from('users')
        .update({
          credits: 999999,
          plan: 'free',
          role: 'user',
          updated_at: new Date().toISOString(),
        })
        .eq('id', basicUser.id);
    } else {
      // Create new user
      const passwordHash = await bcrypt.hash('temporary_password_' + Date.now(), 12);
      await supabase
        .from('users')
        .insert({
          id: uuidv4(),
          name: 'Basic User',
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
      // Update existing admin
      await supabase
        .from('users')
        .update({
          credits: 999999,
          plan: 'enterprise',
          role: 'admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', adminUser.id);
    } else {
      // Create new admin user
      const passwordHash = await bcrypt.hash('temporary_password_' + Date.now(), 12);
      await supabase
        .from('users')
        .insert({
          id: uuidv4(),
          name: 'Admin',
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
      message: 'Setup completed successfully',
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
