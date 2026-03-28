import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token et mot de passe requis' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe doit contenir au moins 6 caract\u00e8res' },
        { status: 400 }
      );
    }

    // Find the reset token
    const { data: resetData, error: resetError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .single();

    if (resetError || !resetData) {
      return NextResponse.json(
        { success: false, error: 'Lien de r\u00e9initialisation invalide ou expir\u00e9' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date(resetData.expires_at) < new Date()) {
      // Delete expired token
      await supabase
        .from('password_resets')
        .delete()
        .eq('id', resetData.id);

      return NextResponse.json(
        { success: false, error: 'Le lien de r\u00e9initialisation a expir\u00e9. Veuillez en demander un nouveau.' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resetData.user_id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise \u00e0 jour du mot de passe' },
        { status: 500 }
      );
    }

    // Delete used token
    await supabase
      .from('password_resets')
      .delete()
      .eq('id', resetData.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
