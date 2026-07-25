import { NextResponse } from "next/server";
import { getFalClient } from "@/lib/fal";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.prompt || !body.userId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: prompt, userId" },
        { status: 400 }
      );
    }

    const fal = getFalClient();
    const result = await fal.generateVisualSummary({
      prompt: body.prompt,
      userId: body.userId,
      style: body.style,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /summary]", error);
    return NextResponse.json(
      { error: "Error al generar el resumen visual" },
      { status: 500 }
    );
  }
}
