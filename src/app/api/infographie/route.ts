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
        { success: false, error: 'Non autorise' },
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
        { success: false, error: 'Utilisateur non trouve' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const theme = formData.get('theme') as string;
    const cards = JSON.parse(formData.get('cards') as string || '[]');
    const duration = parseInt(formData.get('duration') as string) || 30;
    const batch = formData.get('batch') === 'true';

    const uploadFile = async (file: File | null, folder: string) => {
      if (!file || file.size === 0) return null;
      const buffer = await file.arrayBuffer();
      const filename = `${session.user!.id}/${folder}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('infographie-media')
        .upload(filename, new Uint8Array(buffer));

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('infographie-media')
        .getPublicUrl(filename);

      return publicUrl;
    };

    const [characterUrl, musicUrl, logoUrl, voixOffUrl, mixVideoUrl] = await Promise.all([
      uploadFile(formData.get('character') as File | null, 'characters'),
      uploadFile(formData.get('music') as File | null, 'music'),
      uploadFile(formData.get('logo') as File | null, 'logos'),
      uploadFile(formData.get('voixOff') as File | null, 'voix-off'),
      uploadFile(formData.get('mixVideo') as File | null, 'mix-videos'),
    ]);

    const creditsNeeded = batch ? 50 : 25;

    if (user.credits < creditsNeeded) {
      return NextResponse.json(
        { success: false, error: 'Credits insuffisants' },
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
        metadata: { batch, created_at: new Date().toISOString() },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la creation' },
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
      message: 'Video mise en file d\'attente pour rendu',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
