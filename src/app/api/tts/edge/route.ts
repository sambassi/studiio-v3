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

    // Use edge-tts via dynamic import
    try {
      const { MsEdgeTTS, OUTPUT_FORMAT } = await import('edge-tts');
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

      const readable = tts.toStream(text);
      const chunks: Buffer[] = [];

      for await (const chunk of readable) {
        if (chunk instanceof Buffer) {
          chunks.push(chunk);
        }
      }

      const audioBuffer = Buffer.concat(chunks);

      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'attachment; filename="voix-off.mp3"',
        },
      });
    } catch (ttsError: any) {
      console.error('edge-tts error:', ttsError);

      // Fallback: try Azure REST API if AZURE_SPEECH_KEY is set
      if (process.env.AZURE_SPEECH_KEY) {
        const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="fr-FR"><voice name="${voice}"><prosody rate="${rate}">${escapeXml(text)}</prosody></voice></speak>`;

        const ttsResponse = await fetch(
          'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/ssml+xml',
              'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
              'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
            },
            body: ssml,
          }
        );

        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer();
          return new NextResponse(Buffer.from(audioBuffer), {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Disposition': 'attachment; filename="voix-off.mp3"',
            },
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Service TTS temporairement indisponible. Utilisez l\'option upload pour votre voix off.',
          fallback: true,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur TTS' },
      { status: 500 }
    );
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
