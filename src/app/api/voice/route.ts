import { NextResponse } from "next/server";
import { getElevenLabsClient, transcribeAudio } from "@/lib/elevenlabs";

/**
 * POST /api/voice
 * Dev 3: Procesamiento de audio
 *
 * - multipart/form-data con campo "audio" → transcripción Whisper
 * - JSON { text, action: "tts" } → síntesis ElevenLabs
 */

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const audio = formData.get("audio");

      if (!(audio instanceof Blob)) {
        return NextResponse.json({ error: "Campo 'audio' requerido" }, { status: 400 });
      }

      const transcription = await transcribeAudio(audio);
      return NextResponse.json(transcription);
    }

    const body = (await request.json()) as { text?: string; action?: string };

    if (body.action === "tts" && body.text) {
      const client = getElevenLabsClient();
      const audioBuffer = await client.textToSpeech({ text: body.text });

      return new NextResponse(audioBuffer, {
        headers: { "Content-Type": "audio/mpeg" },
      });
    }

    return NextResponse.json(
      { error: "Envía audio (multipart) o { action: 'tts', text }" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API /voice]", error);
    return NextResponse.json({ error: "Error en procesamiento de voz" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: "SanaIA Voice API",
    providers: ["ElevenLabs (TTS)", "Whisper (STT)"],
  });
}
