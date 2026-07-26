/**
 * Tipos del módulo de agente conversacional (Zavu).
 * Dev 3: implementar handlers de streaming y contexto médico aquí.
 */

export interface AgentMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  source: "text" | "voice";
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AgentConfig {
  apiKey: string;
  baseUrl?: string;
  /** Modelo o perfil del agente médico */
  agentProfile?: "triage" | "general" | "emergency";
}

export interface AgentRequest {
  sessionId: string;
  message: string;
  userId: string;
  /** Contexto adicional: síntomas, ubicación, historial */
  context?: Record<string, unknown>;
}

export interface AgentResponse {
  message: AgentMessage;
  /** Acciones sugeridas: reservar cita, activar billetera, etc. */
  suggestedActions?: AgentAction[];
}

export interface AgentAction {
  type:
    | "book_appointment"
    | "check_wallet"
    | "find_hospital"
    | "call_emergency"
    | "start_symptoms"
    | "general_info"
    | "input_pain"
    | "input_type"
    | "input_foods"
    | "input_example"
    | "continue_triage"
    | "restart_triage"
    | "generate_infographic";
  payload: Record<string, unknown>;
  label: string;
}

export interface AgentSession {
  id: string;
  userId: string;
  title: string;
  messages: AgentMessage[];
  createdAt: string;
  updatedAt: string;
}
