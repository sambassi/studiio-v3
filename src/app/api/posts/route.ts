import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
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
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get query params
    const url = new URL(req.url);
    const month = url.searchParams.get('month'); // YYYY-MM
    const status = url.searchParams.get('status');

    let query = supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id);

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
        { success: false, error: 'Failed to fetch posts' },
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
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const caption = formData.get('caption') as string;
    const platforms = JSON.parse(formData.get('platforms') as string);
    const scheduledDate = formData.get('scheduled_date') as string;
    const scheduledTime = formData.get('scheduled_time') as string;
    const status = formData.get('status') as string;
    const mediaType = formData.get('media_type') as string;
    const title = formData.get('title') as string;

    if (!caption || !platforms || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Handle media file if present
    const media = formData.get('media') as File | null;
    let mediaUrl: string | null = null;

    if (media) {
      const buffer = await media.arrayBuffer();
      const filename = `${user.id}/${Date.now()}_${media.name}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filename, new Uint8Array(buffer));

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Continue without media URL for now
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filename);
        mediaUrl = publicUrl;
      }
    }

    // Create post
    const postId = uuidv4();
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        id: postId,
        user_id: user.id,
        title: title || null,
        caption,
        platforms,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        status,
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create post' },
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
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
