import { NextResponse } from "next/server";
import { getZavuClient } from "@/lib/zavu";
import type { AgentRequest } from "@/types/agent";
import { generateId } from "@/utils";

/**
 * POST /api/agent
 * Dev 3: Orquestación del agente Zavu
 *
 * Body: { sessionId?, message, userId, context? }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AgentRequest>;

    if (!body.message || !body.userId) {
      return NextResponse.json(
        { error: "Campos requeridos: message, userId" },
        { status: 400 }
      );
    }

    const agentRequest: AgentRequest = {
      sessionId: body.sessionId ?? generateId("session"),
      message: body.message,
      userId: body.userId,
      context: body.context,
    };

    const client = getZavuClient();
    const response = await client.sendMessage(agentRequest);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API /agent]", error);
    return NextResponse.json(
      { error: "Error al procesar mensaje del agente" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "SanaIA Agent API",
    status: "ok",
    integration: "Zavu",
  });
}
