import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'L\'adresse e-mail est requise' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store reset token in database
    // First, delete any existing tokens for this user
    await supabase
      .from('password_resets')
      .delete()
      .eq('user_id', user.id);

    // Insert new token
    const { error } = await supabase
      .from('password_resets')
      .insert({
        id: uuidv4(),
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error storing reset token:', error);
      // Still return success to prevent enumeration
      return NextResponse.json({ success: true });
    }

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://studiio-saas-app.vercel.app';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    // Log the reset URL (in production, send email instead)
    console.log(`Password reset requested for ${email}`);
    console.log(`Reset URL: ${resetUrl}`);

    // TODO: Send email with reset link
    // For now, we just store the token and return success
    // In production, integrate with an email service like Resend, SendGrid, etc.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
