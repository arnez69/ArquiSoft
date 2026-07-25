/**
 * Cliente fal.ai — Dev 4 (Resúmenes visuales)
 *
 * Responsabilidades del equipo:
 * - Generar infografías/resúmenes visuales de triage
 * - Diagramas de flujo de atención médica
 * - Integrar en el dashboard del paciente
 */

const FAL_API_KEY = process.env.FAL_API_KEY;
const FAL_BASE_URL = "https://fal.run";

export interface VisualSummaryRequest {
  /** Texto del resumen médico o triage */
  prompt: string;
  /** Estilo visual: infographic, diagram, chart */
  style?: "infographic" | "diagram" | "chart";
  userId: string;
}

export interface VisualSummaryResult {
  imageUrl: string;
  prompt: string;
  generatedAt: string;
}

export class FalClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? FAL_API_KEY ?? "";
    if (!this.apiKey) {
      console.warn("[SanaIA] FAL_API_KEY no configurada.");
    }
  }

  /** Genera un resumen visual a partir de texto médico */
  async generateVisualSummary(
    request: VisualSummaryRequest
  ): Promise<VisualSummaryResult> {
    if (!this.apiKey) {
      return {
        imageUrl: "/placeholder-summary.png",
        prompt: request.prompt,
        generatedAt: new Date().toISOString(),
      };
    }

    // TODO Dev 4: Endpoint específico de fal.ai (flux, ideogram, etc.)
    const response = await fetch(`${FAL_BASE_URL}/fal-ai/flux/dev`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt: `Medical infographic, clean design: ${request.prompt}`,
        image_size: "landscape_16_9",
      }),
    });

    if (!response.ok) {
      throw new Error(`fal.ai error: ${response.status}`);
    }

    const data = (await response.json()) as { images: Array<{ url: string }> };

    return {
      imageUrl: data.images[0]?.url ?? "",
      prompt: request.prompt,
      generatedAt: new Date().toISOString(),
    };
  }
}

let falClient: FalClient | null = null;

export function getFalClient(): FalClient {
  if (!falClient) falClient = new FalClient();
  return falClient;
}
