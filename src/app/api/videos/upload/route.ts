import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { uploadRush, uploadMusic, uploadCharacter } from '@/lib/storage/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file || !type) {
      return NextResponse.json(
        { error: 'Fichier et type requis' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
    const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'];
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

    let result;

    switch (type) {
      case 'rush':
        if (!allowedVideoTypes.includes(file.type)) {
          return NextResponse.json(
            { error: 'Format video non supporte. Utilisez MP4, WebM ou MOV.' },
            { status: 400 }
          );
        }
        if (file.size > 200 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Fichier trop volumineux (max 200MB)' },
            { status: 400 }
          );
        }
        result = await uploadRush(file, file.name, file.type, session.user.id);
        break;

      case 'music':
        if (!allowedAudioTypes.includes(file.type)) {
          return NextResponse.json(
            { error: 'Format audio non supporte. Utilisez MP3, WAV ou OGG.' },
            { status: 400 }
          );
        }
        if (file.size > 50 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Fichier audio trop volumineux (max 50MB)' },
            { status: 400 }
          );
        }
        result = await uploadMusic(file, file.name, file.type, session.user.id);
        break;

      case 'character':
        if (!allowedImageTypes.includes(file.type)) {
          return NextResponse.json(
            { error: 'Format image non supporte. Utilisez JPEG, PNG ou WebP.' },
            { status: 400 }
          );
        }
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Image trop volumineuse (max 10MB)' },
            { status: 400 }
          );
        }
        result = await uploadCharacter(file, file.name, file.type, session.user.id);
        break;

      default:
        return NextResponse.json(
          { error: 'Type invalide. Utilisez rush, music ou character.' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}
