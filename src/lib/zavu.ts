import type { AgentRequest, AgentResponse } from "@/types/agent";
import { generateId } from "@/utils";

/**
 * Cliente SDK Zavu — Dev 3 (Agente conversacional)
 *
 * Responsabilidades del equipo:
 * - Integrar el SDK oficial de Zavu cuando esté disponible
 * - Orquestar contexto médico (síntomas, triage, historial)
 * - Conectar con módulos de voz (Whisper/ElevenLabs) y billetera
 */

const ZAVU_API_KEY = process.env.ZAVU_API_KEY;
const ZAVU_BASE_URL = process.env.ZAVU_BASE_URL ?? "https://api.zavu.ai/v1";

export class ZavuClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey ?? ZAVU_API_KEY ?? "";
    this.baseUrl = baseUrl ?? ZAVU_BASE_URL;

    if (!this.apiKey) {
      console.warn("[SanaIA] ZAVU_API_KEY no configurada. El agente funcionará en modo mock.");
    }
  }

  /** Envía un mensaje al agente y obtiene respuesta */
  async sendMessage(request: AgentRequest): Promise<AgentResponse> {
    if (!this.apiKey) {
      return this.mockResponse(request);
    }

    // TODO Dev 3: Reemplazar con llamada real al SDK de Zavu
    const response = await fetch(`${this.baseUrl}/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        session_id: request.sessionId,
        user_id: request.userId,
        message: request.message,
        context: request.context,
      }),
    });

    if (!response.ok) {
      throw new Error(`Zavu API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      content: string;
      suggested_actions?: AgentResponse["suggestedActions"];
    };

    return {
      message: {
        id: generateId("msg"),
        sessionId: request.sessionId,
        role: "assistant",
        content: data.content,
        source: "text",
        timestamp: new Date().toISOString(),
      },
      suggestedActions: data.suggested_actions,
    };
  }

  /** Respuesta mock para desarrollo sin API key */
  private mockResponse(request: AgentRequest): AgentResponse {
    return {
      message: {
        id: generateId("msg"),
        sessionId: request.sessionId,
        role: "assistant",
        content: `[Mock Zavu] Recibí tu mensaje: "${request.message}". Configura ZAVU_API_KEY para respuestas reales.`,
        source: "text",
        timestamp: new Date().toISOString(),
      },
      suggestedActions: [
        {
          type: "find_hospital",
          label: "Buscar hospital cercano",
          payload: { city: "La Paz" },
        },
      ],
    };
  }
}

/** Instancia singleton del cliente Zavu para API routes */
let zavuClient: ZavuClient | null = null;

export function getZavuClient(): ZavuClient {
  if (!zavuClient) {
    zavuClient = new ZavuClient();
  }
  return zavuClient;
}
