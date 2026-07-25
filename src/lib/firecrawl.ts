import type { HealthCenter, HealthSearchQuery, HealthSearchResult } from "@/types/health";
import { generateId } from "@/utils";

/**
 * Clientes Firecrawl + Exa — Dev 4 (Scraping y búsqueda de centros de salud)
 *
 * Responsabilidades del equipo:
 * - Firecrawl: scrapear sitios oficiales de hospitales/clínicas
 * - Exa: búsqueda semántica de disponibilidad y servicios
 * - Normalizar resultados al tipo HealthCenter
 */

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v1";
const EXA_API_KEY = process.env.EXA_API_KEY;
const EXA_BASE_URL = "https://api.exa.ai";

export class FirecrawlClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? FIRECRAWL_API_KEY ?? "";
    if (!this.apiKey) {
      console.warn("[SanaIA] FIRECRAWL_API_KEY no configurada.");
    }
  }

  /** Scrapea una URL y extrae contenido estructurado */
  async scrapeUrl(url: string): Promise<{ markdown: string; metadata: Record<string, unknown> }> {
    if (!this.apiKey) {
      return {
        markdown: `[Mock Firecrawl] Contenido de ${url}`,
        metadata: { source: url, mock: true },
      };
    }

    const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl error: ${response.status}`);
    }

    const data = (await response.json()) as {
      data: { markdown: string; metadata: Record<string, unknown> };
    };

    return data.data;
  }
}

export class ExaClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? EXA_API_KEY ?? "";
    if (!this.apiKey) {
      console.warn("[SanaIA] EXA_API_KEY no configurada.");
    }
  }

  /** Búsqueda semántica de centros de salud */
  async searchHealthCenters(query: HealthSearchQuery): Promise<HealthSearchResult> {
    if (!this.apiKey) {
      return this.mockSearch(query);
    }

    const searchQuery = `hospitales clínicas ${query.city} Bolivia ${query.specialty ?? "urgencias"} disponibilidad`;

    const response = await fetch(`${EXA_BASE_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        query: searchQuery,
        numResults: 10,
        type: "auto",
      }),
    });

    if (!response.ok) {
      throw new Error(`Exa search error: ${response.status}`);
    }

    const data = (await response.json()) as {
      results: Array<{ title: string; url: string; text?: string }>;
    };

    const centers: HealthCenter[] = data.results.map((r) => ({
      id: generateId("hc"),
      name: r.title,
      address: "Por confirmar",
      city: query.city,
      latitude: -16.5,
      longitude: -68.15,
      occupancyPercent: 50,
      services: query.specialty ? [query.specialty] : ["urgencias"],
      sourceUrl: r.url,
      lastUpdated: new Date().toISOString(),
    }));

    return { centers, query, searchedAt: new Date().toISOString() };
  }

  private mockSearch(query: HealthSearchQuery): HealthSearchResult {
    return {
      centers: [
        {
          id: "hc_mock_1",
          name: "Hospital Central Mock",
          address: "Av. Principal s/n",
          city: query.city,
          latitude: -16.5,
          longitude: -68.15,
          occupancyPercent: 35,
          services: ["urgencias", "UCI", "pediatría"],
          lastUpdated: new Date().toISOString(),
        },
      ],
      query,
      searchedAt: new Date().toISOString(),
    };
  }
}

let firecrawlClient: FirecrawlClient | null = null;
let exaClient: ExaClient | null = null;

export function getFirecrawlClient(): FirecrawlClient {
  if (!firecrawlClient) firecrawlClient = new FirecrawlClient();
  return firecrawlClient;
}

export function getExaClient(): ExaClient {
  if (!exaClient) exaClient = new ExaClient();
  return exaClient;
}
