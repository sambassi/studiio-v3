import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

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
        // Don't fail the request if media deletion fails
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
