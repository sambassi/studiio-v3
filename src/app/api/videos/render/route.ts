import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createClient } from '@supabase/supabase-js';
import { deductCredits, canRenderVideo } from '@/lib/credits/system';

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

    // Accept JSON body (files already uploaded to Supabase via presigned URLs)
    const body = await req.json();
    const {
      title, subtitle, format, mode,
      objectives: objectivesList = [],
      timeline = [],
      rushUrls = [],
      musicUrl = null,
      characterUrl = null,
      voiceoverUrl = null,
      batchMode = false,
      batchCount = 1,
      batchTitles = [],
      destination = 'calendar',
    } = body;

    if (!title || !format) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Check credits
    const hasCredits = await canRenderVideo(session.user.id, format);
    if (!hasCredits) {
      return NextResponse.json(
        { success: false, error: 'Crédits insuffisants' },
        { status: 402 }
      );
    }

    // Build Remotion input props
    const compositionId = format === 'reel' ? 'StudioVideoReel' : 'StudioVideoTV';
    const inputProps = {
      title,
      subtitle: subtitle || '',
      rushUrls,
      musicUrl,
      characterUrl,
      voiceoverUrl,
      timeline,
      mode: mode || 'cardio',
      objectives: objectivesList,
    };

    // Calculate total duration from timeline
    const totalDuration = timeline.reduce((sum: number, item: any) => sum + (item.duration || 0), 0);
    const fps = 30;
    const durationInFrames = Math.max(Math.round(totalDuration * fps), 300);

    // Create video record in database
    const { data: video, error: insertError } = await supabase
      .from('videos')
      .insert({
        user_id: session.user.id,
        title,
        format,
        mode: mode || 'cardio',
        status: 'rendering',
        metadata: {
          subtitle,
          objectives: objectivesList,
          timeline,
          rushUrls,
          musicUrl,
          characterUrl,
          voiceoverUrl,
          compositionId,
          inputProps,
          durationInFrames,
          fps,
          destination,
          batchMode,
          batchCount: batchMode ? batchCount : 1,
          batchTitles: batchMode ? batchTitles : [],
          rushCount: rushUrls.length,
          createdAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Deduct credits
    const renderCost = format === 'reel' ? 10 : 15;
    await deductCredits(session.user.id, renderCost, `render_${video.id}`);

    // NOTE: Actual Remotion rendering cannot run in Vercel serverless functions
    // In production, replace with Remotion Lambda call
    // For now, simulate render completion after delay
    setTimeout(async () => {
      await supabase
        .from('videos')
        .update({
          status: 'completed',
          render_url: null,
          updated_at: new Date().toISOString(),
          metadata: {
            ...video.metadata,
            completedAt: new Date().toISOString(),
          },
        })
        .eq('id', video.id);
    }, 8000);

    return NextResponse.json({
      success: true,
      data: {
        videoId: video.id,
        status: 'rendering',
        compositionId,
        rushCount: rushUrls.length,
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
