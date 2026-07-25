/**
 * Cliente ElevenLabs + Whisper — Dev 3 (Módulo de voz)
 *
 * Responsabilidades del equipo:
 * - Text-to-Speech con ElevenLabs para respuestas del agente
 * - Speech-to-Text con Whisper (OpenAI) para entrada de voz del paciente
 * - Streaming de audio en /api/voice
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface TextToSpeechOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
}

export interface SpeechToTextResult {
  text: string;
  language?: string;
  durationSeconds?: number;
}

export class ElevenLabsClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? ELEVENLABS_API_KEY ?? "";
    if (!this.apiKey) {
      console.warn("[SanaIA] ELEVENLABS_API_KEY no configurada.");
    }
  }

  /** Convierte texto a audio (Dev 3: retornar ArrayBuffer para streaming) */
  async textToSpeech(options: TextToSpeechOptions): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error("ElevenLabs: API key no configurada");
    }

    const voiceId = options.voiceId ?? "21m00Tcm4TlvDq8ikWAM"; // Rachel — voz por defecto
    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey,
        },
        body: JSON.stringify({
          text: options.text,
          model_id: options.modelId ?? "eleven_multilingual_v2",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS error: ${response.status}`);
    }

    return response.arrayBuffer();
  }
}

/** Transcripción con Whisper (OpenAI) — Dev 3 */
export async function transcribeAudio(audioBlob: Blob): Promise<SpeechToTextResult> {
  if (!OPENAI_API_KEY) {
    return {
      text: "[Mock Whisper] Transcripción no disponible. Configura OPENAI_API_KEY.",
      language: "es",
    };
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");
  formData.append("model", "whisper-1");
  formData.append("language", "es");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Whisper API error: ${response.status}`);
  }

  const data = (await response.json()) as { text: string };
  return { text: data.text, language: "es" };
}

let elevenLabsClient: ElevenLabsClient | null = null;

export function getElevenLabsClient(): ElevenLabsClient {
  if (!elevenLabsClient) {
    elevenLabsClient = new ElevenLabsClient();
  }
  return elevenLabsClient;
}
