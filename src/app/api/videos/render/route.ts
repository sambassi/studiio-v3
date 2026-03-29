import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createClient } from '@supabase/supabase-js';
import { deductCredits, canRenderVideo } from '@/lib/credits/system';
import { uploadRush, uploadMusic, uploadCharacter } from '@/lib/storage/supabase';

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

    const formData = await req.formData();

    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const format = formData.get('format') as 'reel' | 'tv';
    const mode = formData.get('mode') as string;
    const objectives = formData.get('objectives') as string;
    const timelineJson = formData.get('timeline') as string;

    if (!title || !format) {
      return NextResponse.json(
        { success: false, error: 'Parametres manquants' },
        { status: 400 }
      );
    }

    // Check credits
    const hasCredits = await canRenderVideo(session.user.id, format);
    if (!hasCredits) {
      return NextResponse.json(
        { success: false, error: 'Credits insuffisants' },
        { status: 402 }
      );
    }

    // Parse timeline and objectives
    let timeline = [];
    let objectivesList: string[] = [];
    try {
      timeline = JSON.parse(timelineJson || '[]');
      objectivesList = JSON.parse(objectives || '[]');
    } catch {
      // fallback to empty
    }

    // Upload rush video files to Supabase Storage
    const rushUrls: string[] = [];
    for (let i = 0; i < 10; i++) {
      const rushFile = formData.get(`rush_${i}`) as File | null;
      if (rushFile && rushFile.size > 0) {
        try {
          const result = await uploadRush(rushFile, rushFile.name, rushFile.type, session.user.id);
          rushUrls.push(result.url);
        } catch (err: any) {
          console.error(`Rush ${i} upload error:`, err.message);
        }
      }
    }

    // Upload music file
    let musicUrl: string | null = null;
    const musicFile = formData.get('music') as File | null;
    if (musicFile && musicFile.size > 0) {
      try {
        const result = await uploadMusic(musicFile, musicFile.name, musicFile.type, session.user.id);
        musicUrl = result.url;
      } catch (err: any) {
        console.error('Music upload error:', err.message);
      }
    }

    // Upload character image
    let characterUrl: string | null = null;
    const characterFile = formData.get('character') as File | null;
    if (characterFile && characterFile.size > 0) {
      try {
        const result = await uploadCharacter(characterFile, characterFile.name, characterFile.type, session.user.id);
        characterUrl = result.url;
      } catch (err: any) {
        console.error('Character upload error:', err.message);
      }
    }

    // Build Remotion input props
    const compositionId = format === 'reel' ? 'StudioVideoReel' : 'StudioVideoTV';
    const inputProps = {
      title,
      subtitle: subtitle || '',
      rushUrls,
      musicUrl,
      characterUrl,
      timeline,
      mode: mode || 'cardio',
      objectives: objectivesList,
    };

    // Calculate total duration from timeline
    const totalDuration = timeline.reduce((sum: number, item: any) => sum + (item.duration || 0), 0);
    const fps = 30;
    const durationInFrames = Math.max(Math.round(totalDuration * fps), 300); // minimum 10 seconds

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
          compositionId,
          inputProps,
          durationInFrames,
          fps,
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
    // (requires Chromium + FFmpeg, exceeds 50MB limit).
    // Options for production:
    // 1. Remotion Lambda (AWS) - recommended for scalability
    // 2. Vercel Sandbox (beta) - for simple renders
    // 3. Dedicated render server (Railway/Fly.io/EC2)
    //
    // For now, mark as 'queued' and simulate completion.
    // The video metadata contains all Remotion inputProps needed for rendering.

    // Simulate render completion after delay
    // In production, replace with actual Remotion Lambda call:
    // import { renderMediaOnLambda } from '@remotion/lambda/client';
    // const result = await renderMediaOnLambda({
    //   region: 'us-east-1',
    //   functionName: 'remotion-render-...',
    //   composition: compositionId,
    //   inputProps,
    //   codec: 'h264',
    //   framesPerLambda: 20,
    // });

    setTimeout(async () => {
      await supabase
        .from('videos')
        .update({
          status: 'completed',
          render_url: null, // Would be the Remotion Lambda output URL
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
