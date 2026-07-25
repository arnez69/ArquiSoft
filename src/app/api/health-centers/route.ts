import { NextResponse } from "next/server";
import { getExaClient, getFirecrawlClient } from "@/lib/firecrawl";
import type { HealthSearchQuery } from "@/types/health";

/**
 * GET /api/health-centers?city=La+Paz&specialty=urgencias
 * POST /api/health-centers { url } — scrape con Firecrawl
 * Dev 4: Búsqueda y scraping de centros de salud
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "La Paz";
  const specialty = searchParams.get("specialty") ?? undefined;

  const query: HealthSearchQuery = { city, specialty };

  try {
    const exa = getExaClient();
    const result = await exa.searchHealthCenters(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /health-centers GET]", error);
    return NextResponse.json({ error: "Error en búsqueda de centros" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { url } = (await request.json()) as { url?: string };

    if (!url) {
      return NextResponse.json({ error: "url requerida" }, { status: 400 });
    }

    const firecrawl = getFirecrawlClient();
    const scraped = await firecrawl.scrapeUrl(url);

    return NextResponse.json(scraped);
  } catch (error) {
    console.error("[API /health-centers POST]", error);
    return NextResponse.json({ error: "Error al scrapear URL" }, { status: 500 });
  }
}
