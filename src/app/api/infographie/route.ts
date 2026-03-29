import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, credits')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const theme = formData.get('theme') as string;
    const cards = JSON.parse(formData.get('cards') as string);
    const duration = parseInt(formData.get('duration') as string) || 30;
    const batch = formData.get('batch') === 'true';

    // Handle media files
    let characterUrl: string | null = null;
    let musicUrl: string | null = null;
    let logoUrl: string | null = null;
    let voixOffUrl: string | null = null;
    let mixVideoUrl: string | null = null;

    const uploadFile = async (file: File | null, folder: string) => {
      if (!file) return null;
      const buffer = await file.arrayBuffer();
      const filename = `${user.id}/${folder}/${Date.now()}_${file.name}`;

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

    const character = formData.get('character') as File | null;
    const mixVideo = formData.get('mixVideo') as File | null;
    const musicFile = formData.get('music') as File | null;
    const voixOffFile = formData.get('voixOff') as File | null;
    const logoFile = formData.get('logo') as File | null;

    [characterUrl, musicUrl, logoUrl, voixOffUrl, mixVideoUrl] = await Promise.all([
      uploadFile(character, 'characters'),
      uploadFile(musicFile, 'music'),
      uploadFile(logoFile, 'logos'),
      uploadFile(voixOffFile, 'voix-off'),
      uploadFile(mixVideo, 'mix-videos'),
    ]);

    // Calculate credits needed (basic cost for now)
    const creditsNeeded = batch ? 50 : 25;

    if (user.credits < creditsNeeded) {
      return NextResponse.json(
        { success: false, error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Create info video record
    const videoId = uuidv4();
    const { data: infoVideo, error } = await supabase
      .from('info_videos')
      .insert({
        id: videoId,
        user_id: user.id,
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
        { success: false, error: 'Failed to create video' },
        { status: 500 }
      );
    }

    // Deduct credits
    await supabase
      .from('users')
      .update({
        credits: user.credits - creditsNeeded,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Log credit transaction
    await supabase
      .from('credit_transactions')
      .insert({
        id: uuidv4(),
        user_id: user.id,
        amount: -creditsNeeded,
        type: 'render',
        reference_id: videoId,
        created_at: new Date().toISOString(),
      });

    // TODO: Queue render job to external service (FFmpeg, etc.)
    // For now, just return the created video

    return NextResponse.json({
      success: true,
      data: infoVideo,
      message: 'Vidéo mise en file d\'attente pour rendu',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
