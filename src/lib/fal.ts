import type { VisualSummaryRequest, VisualSummaryResult } from "@/types/summary";
import { buildFalPrompt, generateInfographicSvg } from "@/lib/infographic-generator";

/**
 * Cliente fal.ai — Resúmenes visuales e infografías médicas.
 * Con API key: genera imagen vía fal.ai Flux.
 * Sin API key: genera infografía SVG local inteligente.
 */

const FAL_API_KEY = process.env.FAL_API_KEY;
const FAL_MODEL = process.env.FAL_MODEL ?? "fal-ai/flux/schnell";

export class FalClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? FAL_API_KEY ?? "";
    if (!this.apiKey || this.apiKey.startsWith("your-")) {
      this.apiKey = "";
    }
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async generateVisualSummary(
    request: VisualSummaryRequest
  ): Promise<VisualSummaryResult> {
    const style = request.style ?? "infographic";

    if (!this.apiKey) {
      return {
        imageUrl: generateInfographicSvg(request.prompt, style),
        prompt: request.prompt,
        generatedAt: new Date().toISOString(),
        source: "local",
        style,
      };
    }

    try {
      const imageUrl = await this.callFalApi(request.prompt, style);
      return {
        imageUrl,
        prompt: request.prompt,
        generatedAt: new Date().toISOString(),
        source: "fal.ai",
        style,
      };
    } catch (error) {
      console.warn("[SanaIA] fal.ai falló, usando generador local:", error);
      return {
        imageUrl: generateInfographicSvg(request.prompt, style),
        prompt: request.prompt,
        generatedAt: new Date().toISOString(),
        source: "local-fallback",
        style,
      };
    }
  }

  private async callFalApi(
    prompt: string,
    style: NonNullable<VisualSummaryRequest["style"]>
  ): Promise<string> {
    const falPrompt = buildFalPrompt(prompt, style);

    const response = await fetch(`https://fal.run/${FAL_MODEL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt: falPrompt,
        image_size: "landscape_16_9",
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`fal.ai ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      images?: Array<{ url: string }>;
      image?: { url: string };
    };

    const url = data.images?.[0]?.url ?? data.image?.url;
    if (!url) throw new Error("fal.ai no devolvió imagen");
    return url;
  }
}

let falClient: FalClient | null = null;

export function getFalClient(): FalClient {
  if (!falClient) falClient = new FalClient();
  return falClient;
}
