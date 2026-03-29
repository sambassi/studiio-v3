import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { randomUUID } from 'crypto';

export const maxDuration = 30;

// Edge TTS trusted client token (well-known, used by edge-tts clients)
const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_TOKEN}`;

/**
 * Direct implementation of Microsoft Edge TTS WebSocket protocol.
 * No dependency on edge-tts package - uses ws directly.
 */
async function synthesizeSpeech(text: string, voice: string, rate: string): Promise<Buffer> {
  const WebSocket = (await import('ws')).default;
  const connectionId = randomUUID().replace(/-/g, '');

  return new Promise((resolve, reject) => {
    const audioChunks: Buffer[] = [];
    const ws = new WebSocket(`${WS_URL}&ConnectionId=${connectionId}`);

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('TTS timeout after 25s'));
    }, 25000);

    ws.on('open', () => {
      // 1. Send speech config
      const configMsg =
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: 'false',
                  wordBoundaryEnabled: 'false',
                },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
              },
            },
          },
        });
      ws.send(configMsg);

      // 2. Send SSML
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="fr-FR">` +
        `<voice name="${voice}">` +
        `<prosody rate="${rate}">` +
        escapeXml(text) +
        `</prosody></voice></speak>`;

      const ssmlMsg =
        `X-RequestId:${connectionId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml;
      ws.send(ssmlMsg);
    });

    ws.on('message', (data: Buffer | string) => {
      if (Buffer.isBuffer(data)) {
        // Binary message - extract audio after header separator
        const separator = Buffer.from('Path:audio\r\n');
        const sepIndex = data.indexOf(separator);
        if (sepIndex !== -1) {
          const audioData = data.slice(sepIndex + separator.length);
          if (audioData.length > 0) {
            audioChunks.push(audioData);
          }
        }
      } else {
        // Text message - check for turn.end
        const msg = data.toString();
        if (msg.includes('Path:turn.end')) {
          clearTimeout(timeout);
          ws.close();
          const audioBuffer = Buffer.concat(audioChunks);
          if (audioBuffer.length === 0) {
            reject(new Error('No audio data received'));
          } else {
            resolve(audioBuffer);
          }
        }
      }
    });

    ws.on('error', (err: Error) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket error: ${err.message}`));
    });

    ws.on('close', () => {
      clearTimeout(timeout);
      // If we haven't resolved yet, check if we have audio
      if (audioChunks.length > 0) {
        resolve(Buffer.concat(audioChunks));
      }
    });
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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
      const audioBuffer = await synthesizeSpeech(text, voice, rate);

      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'attachment; filename="voix-off.mp3"',
        },
      });
    } catch (ttsError: any) {
      console.error('Edge TTS error:', ttsError?.message || ttsError);

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
