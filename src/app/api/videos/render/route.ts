import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { supabase } from '@/lib/db/supabase';
import { deductCredits, canRenderVideo } from '@/lib/credits/system';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autoris\u00e9' },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const format = formData.get('format') as 'reel' | 'tv';
    const mode = formData.get('mode') as string;
    const objective = formData.get('objective') as string;
    const timelineJson = formData.get('timeline') as string;
    const textCardsJson = formData.get('textCards') as string;

    if (!title || !format || !objective) {
      return NextResponse.json(
        { success: false, error: 'Param\u00e8tres manquants' },
        { status: 400 }
      );
    }

    // Check credits
    const hasCredits = await canRenderVideo(session.user.id, format);
    if (!hasCredits) {
      return NextResponse.json(
        { success: false, error: 'Cr\u00e9dits insuffisants' },
        { status: 402 }
      );
    }

    // Parse timeline and text cards
    let timeline = [];
    let textCards: string[] = [];
    try {
      timeline = JSON.parse(timelineJson || '[]');
      textCards = JSON.parse(textCardsJson || '[]');
    } catch {
      // fallback to empty
    }

    // Count uploaded video files
    const videoFiles: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('video_') && value instanceof File) {
        videoFiles.push(key);
      }
    }

    // Create video record in database
    const { data: video, error: insertError } = await supabase
      .from('videos')
      .insert({
        user_id: session.user.id,
        title,
        format,
        status: 'rendering',
        metadata: {
          subtitle,
          mode,
          objective,
          timeline,
          textCards,
          videoCount: videoFiles.length,
          createdAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Deduct credits
    const renderCost = format === 'reel' ? 10 : 15;
    await deductCredits(session.user.id, renderCost, `render_${video.id}`);

    // In a production setup, this would:
    // 1. Upload video files to cloud storage (S3/GCS)
    // 2. Queue a rendering job (Bull/Redis)
    // 3. Remotion Lambda or server-side rendering
    // 4. Webhook callback on completion
    // 5. Update video status to 'completed' with output URL

    // For now, simulate by setting status to 'completed' after a delay
    // In production, remove this and use actual rendering pipeline
    setTimeout(async () => {
      await supabase
        .from('videos')
        .update({
          status: 'completed',
          metadata: {
            ...video.metadata,
            completedAt: new Date().toISOString(),
            outputUrl: null, // Would be the actual video URL
          },
        })
        .eq('id', video.id);
    }, 5000);

    return NextResponse.json({
      success: true,
      data: {
        videoId: video.id,
        status: 'rendering',
        estimatedTime: '2-5 minutes',
      },
    });
  } catch (error: any) {
    console.error('Render error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors du rendu' },
      { status: 500 }
    );
  }
}
