import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json(
        { error: 'ID video requis' },
        { status: 400 }
      );
    }

    const { data: video, error } = await supabase
      .from('videos')
      .select('id, title, status, format, mode, render_url, created_at, updated_at, error_message')
      .eq('id', videoId)
      .eq('user_id', session.user.id)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { error: 'Video non trouvee' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: video.id,
      title: video.title,
      status: video.status,
      format: video.format,
      mode: video.mode,
      renderUrl: video.render_url,
      createdAt: video.created_at,
      updatedAt: video.updated_at,
      errorMessage: video.error_message,
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
