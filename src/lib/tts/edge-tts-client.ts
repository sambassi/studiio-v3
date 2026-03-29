/**
 * Client-side Edge TTS using browser's native WebSocket.
 * Connects directly to Microsoft's speech service from the browser.
 * No server-side proxy needed — bypasses Vercel serverless limitations.
 */

const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_TOKEN}`;

function generateId(): string {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface TTSOptions {
  voice?: string;
  rate?: string;
  pitch?: string;
}

/**
 * Synthesize speech using Microsoft Edge TTS directly from the browser.
 * Returns an audio Blob (MP3).
 */
export function synthesizeSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Blob> {
  const {
    voice = 'fr-FR-DeniseNeural',
    rate = '+0%',
    pitch = '+0Hz',
  } = options;

  return new Promise((resolve, reject) => {
    const connectionId = generateId();
    const audioChunks: ArrayBuffer[] = [];

    let ws: WebSocket;
    try {
      ws = new WebSocket(`${WS_URL}&ConnectionId=${connectionId}`);
    } catch (err) {
      reject(new Error('Impossible de se connecter au service TTS'));
      return;
    }

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('TTS timeout (25s)'));
    }, 25000);

    ws.onopen = () => {
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
      const ssml =
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="fr-FR">` +
        `<voice name="${voice}">` +
        `<prosody rate="${rate}" pitch="${pitch}">` +
        escapeXml(text) +
        `</prosody></voice></speak>`;

      const ssmlMsg =
        `X-RequestId:${connectionId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml;
      ws.send(ssmlMsg);
    };

    ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        // Binary message — extract audio after "Path:audio\r\n" header
        event.data.arrayBuffer().then((buffer) => {
          const view = new Uint8Array(buffer);
          // Find the separator "Path:audio\r\n"
          const separator = new TextEncoder().encode('Path:audio\r\n');
          let sepIndex = -1;
          for (let i = 0; i < view.length - separator.length; i++) {
            let match = true;
            for (let j = 0; j < separator.length; j++) {
              if (view[i + j] !== separator[j]) {
                match = false;
                break;
              }
            }
            if (match) {
              sepIndex = i + separator.length;
              break;
            }
          }
          if (sepIndex > 0 && sepIndex < view.length) {
            audioChunks.push(buffer.slice(sepIndex));
          }
        });
      } else if (typeof event.data === 'string') {
        // Text message — check for turn.end
        if (event.data.includes('Path:turn.end')) {
          clearTimeout(timeout);
          ws.close();
          if (audioChunks.length === 0) {
            reject(new Error('Aucune donnée audio reçue'));
          } else {
            const blob = new Blob(audioChunks, { type: 'audio/mpeg' });
            resolve(blob);
          }
        }
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Erreur de connexion au service TTS'));
    };

    ws.onclose = () => {
      clearTimeout(timeout);
      // If we have audio chunks but haven't resolved yet
      if (audioChunks.length > 0) {
        const blob = new Blob(audioChunks, { type: 'audio/mpeg' });
        resolve(blob);
      }
    };
  });
}

/** Available French voices */
export const EDGE_VOICES = [
  { id: 'fr-FR-DeniseNeural', label: 'Denise (Femme)', gender: 'female' },
  { id: 'fr-FR-HenriNeural', label: 'Henri (Homme)', gender: 'male' },
  { id: 'fr-FR-CoralieNeural', label: 'Coralie (Femme)', gender: 'female' },
  { id: 'fr-FR-RemyMultilingualNeural', label: 'Rémy (Homme)', gender: 'male' },
  { id: 'fr-FR-VivienneMultilingualNeural', label: 'Vivienne (Femme)', gender: 'female' },
  { id: 'fr-FR-AlainNeural', label: 'Alain (Homme)', gender: 'male' },
  { id: 'fr-FR-BrigitteNeural', label: 'Brigitte (Femme)', gender: 'female' },
  { id: 'fr-FR-CelesteNeural', label: 'Céleste (Femme)', gender: 'female' },
  { id: 'fr-FR-ClaudeNeural', label: 'Claude (Homme)', gender: 'male' },
  { id: 'fr-FR-EloiseNeural', label: 'Éloïse (Femme)', gender: 'female' },
];
