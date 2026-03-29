import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // 1. Check if Supabase is configured
    const supabaseOk = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // 2. Query user
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('id, email, name, credits, plan, role, password_hash')
      .eq('email', email)
      .single();

    if (queryError) {
      return NextResponse.json({
        step: 'query_user',
        supabaseOk,
        error: queryError.message,
        code: queryError.code,
      });
    }

    if (!user) {
      return NextResponse.json({ step: 'user_not_found', supabaseOk });
    }

    // 3. Check password hash
    const hasHash = !!user.password_hash;
    const hashPrefix = user.password_hash ? user.password_hash.substring(0, 7) : 'NONE';

    let passwordValid = false;
    if (user.password_hash && password) {
      passwordValid = await bcrypt.compare(password, user.password_hash);
    }

    // 4. Try to update password
    const newHash = await bcrypt.hash(password, 12);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', user.id);

    return NextResponse.json({
      step: 'complete',
      supabaseOk,
      userFound: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      credits: user.credits,
      plan: user.plan,
      role: user.role,
      hasHash,
      hashPrefix,
      passwordValid,
      updateAttempt: updateError ? `FAILED: ${updateError.message}` : 'SUCCESS',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
