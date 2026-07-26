import type { InfographicStyle } from "@/lib/infographic-generator";

export interface VisualSummaryRequest {
  prompt: string;
  style?: InfographicStyle;
  userId: string;
}

export interface VisualSummaryResult {
  imageUrl: string;
  prompt: string;
  generatedAt: string;
  source: "fal.ai" | "local" | "local-fallback";
  style: InfographicStyle;
}
