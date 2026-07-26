import { NextResponse } from "next/server";
import { getZavuClient } from "@/lib/zavu";
import type { AgentRequest, AgentMessage } from "@/types/agent";
import { generateId } from "@/utils";
import { saveServerAgentMessage, saveServerAgentSession } from "@/lib/supabase-agent";

/**
 * POST /api/agent
 * Dev 3: Orquestación del agente Zavu + Persistencia en Supabase
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

    const sessionId = body.sessionId ?? generateId("session");
    const userId = body.userId;

    const userMessage: AgentMessage = {
      id: generateId("msg_user"),
      sessionId,
      role: "user",
      content: body.message,
      source: "text",
      timestamp: new Date().toISOString(),
    };

    // Guardar sesión y mensaje en servidor Supabase
    await saveServerAgentSession({
      id: sessionId,
      userId,
      title: body.message.slice(0, 30) + (body.message.length > 30 ? "..." : ""),
    });
    await saveServerAgentMessage(userMessage);

    const agentRequest: AgentRequest = {
      sessionId,
      message: body.message,
      userId,
      context: body.context,
    };

    const client = getZavuClient();
    const response = await client.sendMessage(agentRequest);

    // Guardar respuesta del asistente en servidor Supabase
    await saveServerAgentMessage(response.message);

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
