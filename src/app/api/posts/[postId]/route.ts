import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// PATCH - Update post (move date, change status, edit fields)
export async function PATCH(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
    }

    const postId = params.postId;
    const body = await req.json();

    // Allowed fields to update
    const allowedFields = ['scheduled_date', 'scheduled_time', 'status', 'caption', 'platforms', 'media_type'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'Aucun champ à mettre à jour' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Delete post
export async function DELETE(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorise' },
        { status: 401 }
      );
    }

    const postId = params.postId;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Get the post to verify ownership and get media_url
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Delete the post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Supabase error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression du post' },
        { status: 500 }
      );
    }

    // Delete media file if present
    if (post.media_url) {
      try {
        const filename = `${session.user.id}/${post.media_url.split('/').pop()}`;
        await supabase.storage
          .from('posts')
          .remove([filename]);
      } catch (storageError) {
        console.error('Error deleting media:', storageError);
      }
    }

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
