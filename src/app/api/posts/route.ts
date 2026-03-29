import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth/config';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 30; // Allow up to 30 seconds for file uploads

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Use service role for storage operations (bucket access)
const supabaseStorage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorise' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const month = url.searchParams.get('month');
    const status = url.searchParams.get('status');

    let query = supabase
      .from('posts')
      .select('*')
      .eq('user_id', session.user.id);

    if (month) {
      const monthStart = `${month}-01`;
      const [year, monthNum] = month.split('-');
      const monthEnd = new Date(parseInt(year), parseInt(monthNum), 0)
        .toISOString()
        .split('T')[0];
      query = query
        .gte('scheduled_date', monthStart)
        .lte('scheduled_date', monthEnd);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: posts, error } = await query.order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la recuperation des posts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: posts || [],
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

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
    const caption = formData.get('caption') as string;
    const platforms = JSON.parse(formData.get('platforms') as string || '[]');
    const scheduledDate = formData.get('scheduled_date') as string;
    const scheduledTime = formData.get('scheduled_time') as string;
    const postStatus = (formData.get('status') as string) || 'draft';
    const mediaType = formData.get('media_type') as string;
    const title = formData.get('title') as string;

    if (!caption || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Handle media file if present, or reuse existing URL (for duplication)
    let mediaUrl: string | null = null;
    const existingMediaUrl = formData.get('existing_media_url') as string;
    if (existingMediaUrl) {
      mediaUrl = existingMediaUrl;
    }
    try {
      const media = formData.get('media');
      if (media && typeof media === 'object' && 'size' in media && (media as File).size > 0) {
        const file = media as File;
        const buffer = await file.arrayBuffer();
        const filename = `${session.user.id}/${Date.now()}_${file.name}`;

        // Ensure bucket exists
        await supabaseStorage.storage.createBucket('posts', {
          public: true,
          fileSizeLimit: 100 * 1024 * 1024,
        }).catch(() => {}); // Ignore if already exists

        const { error: uploadError } = await supabaseStorage.storage
          .from('posts')
          .upload(filename, Buffer.from(buffer), {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabaseStorage.storage
            .from('posts')
            .getPublicUrl(filename);
          mediaUrl = publicUrl;
        }
      }
    } catch (uploadErr) {
      console.error('Media upload exception:', uploadErr);
      // Continue without media - don't block post creation
    }

    const postId = uuidv4();
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        id: postId,
        user_id: session.user.id,
        title: title || null,
        caption,
        platforms,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        status: postStatus,
        media_url: mediaUrl,
        media_type: mediaType || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la creation du post' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
