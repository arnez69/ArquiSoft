import { NextResponse } from "next/server";
import { getFalClient } from "@/lib/fal";
import type { InfographicStyle } from "@/lib/infographic-generator";

/**
 * POST /api/summary
 * Genera infografía médica con fal.ai o generador local SVG.
 *
 * Body: { prompt, userId, style?: "infographic" | "diagram" | "chart" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.prompt?.trim()) {
      return NextResponse.json({ error: "El campo 'prompt' es requerido" }, { status: 400 });
    }

    const userId = body.userId ?? "anonymous";
    const style = (body.style ?? "infographic") as InfographicStyle;

    const fal = getFalClient();
    const result = await fal.generateVisualSummary({
      prompt: body.prompt.trim(),
      userId,
      style,
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

export async function GET() {
  const fal = getFalClient();
  return NextResponse.json({
    service: "SanaIA Visual Summary API",
    provider: fal.isConfigured() ? "fal.ai" : "local-svg-generator",
    styles: ["infographic", "diagram", "chart"],
  });
}
