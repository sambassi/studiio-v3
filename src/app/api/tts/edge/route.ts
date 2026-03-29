import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

export const maxDuration = 30;

// Edge TTS via WebSocket - free Microsoft TTS
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
    }

    const { text, voice = 'fr-FR-DeniseNeural', rate = '+0%' } = await req.json();

    if (!text || text.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Texte requis (max 5000 caractères)' },
        { status: 400 }
      );
    }

    try {
      // edge-tts exports a simple tts(text, options) => Promise<Buffer>
      const { tts } = await import('edge-tts/out/index.js');
      const audioBuffer = await tts(text, { voice, rate });

      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'attachment; filename="voix-off.mp3"',
        },
      });
    } catch (ttsError: any) {
      console.error('edge-tts error:', ttsError?.message || ttsError);

      return NextResponse.json(
        {
          success: false,
          error: 'Service TTS temporairement indisponible. Utilisez l\'option upload pour votre voix off.',
          details: ttsError?.message,
          fallback: true,
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('TTS Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur TTS' },
      { status: 500 }
    );
  }
}

// GET - List available voices
export async function GET() {
  const voices = [
    { id: 'fr-FR-DeniseNeural', name: 'Denise', gender: 'Female', lang: 'fr-FR' },
    { id: 'fr-FR-HenriNeural', name: 'Henri', gender: 'Male', lang: 'fr-FR' },
    { id: 'fr-FR-CoralieNeural', name: 'Coralie', gender: 'Female', lang: 'fr-FR' },
    { id: 'fr-FR-RemyMultilingualNeural', name: 'Rémy', gender: 'Male', lang: 'fr-FR' },
    { id: 'fr-FR-VivienneMultilingualNeural', name: 'Vivienne', gender: 'Female', lang: 'fr-FR' },
    { id: 'fr-FR-AlainNeural', name: 'Alain', gender: 'Male', lang: 'fr-FR' },
    { id: 'fr-FR-BrigitteNeural', name: 'Brigitte', gender: 'Female', lang: 'fr-FR' },
    { id: 'fr-FR-CelesteNeural', name: 'Céleste', gender: 'Female', lang: 'fr-FR' },
    { id: 'fr-FR-ClaudeNeural', name: 'Claude', gender: 'Male', lang: 'fr-FR' },
    { id: 'fr-FR-EloiseNeural', name: 'Éloïse', gender: 'Female', lang: 'fr-FR' },
  ];

  return NextResponse.json({ success: true, voices });
}
