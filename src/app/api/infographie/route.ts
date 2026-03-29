import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth/config';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get user credits
    const { data: user } = await supabase
      .from('users')
      .select('id, credits')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Accept JSON body (files already uploaded via presigned URLs)
    const body = await req.json();
    const {
      title, subtitle, theme, cards = [],
      duration = 30, batch = false,
      destination = 'calendar', salesPhrase = '',
      characterUrl = null, musicUrl = null,
      logoUrl = null, voixOffUrl = null,
      mixVideoUrl = null, photoAfficheUrl = null,
      batchPhotos = [],
    } = body;

    const creditsNeeded = batch ? 50 : 25;

    if (user.credits < creditsNeeded) {
      return NextResponse.json(
        { success: false, error: 'Crédits insuffisants' },
        { status: 402 }
      );
    }

    const videoId = uuidv4();
    const { data: infoVideo, error } = await supabase
      .from('info_videos')
      .insert({
        id: videoId,
        user_id: session.user.id,
        title,
        subtitle,
        theme,
        info_cards: cards,
        character_url: characterUrl,
        music_url: musicUrl,
        logo_url: logoUrl,
        voix_off_url: voixOffUrl,
        mix_video_url: mixVideoUrl,
        duration,
        status: 'rendering',
        metadata: {
          batch,
          destination,
          salesPhrase,
          photoAfficheUrl,
          batchPhotos,
          created_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création' },
        { status: 500 }
      );
    }

    // Deduct credits
    await supabase
      .from('users')
      .update({ credits: user.credits - creditsNeeded, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    await supabase.from('credit_transactions').insert({
      id: uuidv4(),
      user_id: user.id,
      amount: -creditsNeeded,
      type: 'render',
      reference_id: videoId,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: infoVideo,
      message: 'Vidéo mise en file d\'attente pour rendu',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
