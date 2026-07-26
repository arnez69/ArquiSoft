import { createBrowserClient, createServerClient } from "@/lib/supabase";
import type { AgentMessage, AgentSession } from "@/types/agent";

const LOCAL_STORAGE_SESSIONS_KEY = "sanaia_agent_sessions";
const LOCAL_STORAGE_MESSAGES_KEY = "sanaia_agent_messages";
const LOCAL_STORAGE_ACTIVE_SESSION_KEY = "sanaia_active_session_id";

/**
 * Obtener todas las sesiones de chat de un usuario (Combina Supabase + localStorage)
 */
export async function getAgentSessions(userId: string): Promise<AgentSession[]> {
  const localSessions = getLocalSessions(userId);

  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from("agent_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error || !data) {
      return localSessions;
    }

    const remoteSessions: AgentSession[] = data.map((s) => ({
      id: s.id,
      userId: s.user_id,
      title: s.title || "Consulta Médica",
      messages: [],
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    // Combinar sesiones locales y remotas evitando duplicados
    const sessionMap = new Map<string, AgentSession>();
    for (const s of localSessions) {
      sessionMap.set(s.id, s);
    }
    for (const s of remoteSessions) {
      if (!sessionMap.has(s.id)) {
        sessionMap.set(s.id, s);
      }
    }

    return Array.from(sessionMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return localSessions;
  }
}

/**
 * Obtener los mensajes de una sesión específica (Combina Supabase + localStorage)
 */
export async function getAgentSessionMessages(sessionId: string): Promise<AgentMessage[]> {
  const localMessages = getLocalMessages(sessionId);

  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from("agent_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true });

    if (error || !data || data.length === 0) {
      return localMessages;
    }

    const remoteMessages: AgentMessage[] = data.map((m) => ({
      id: m.id,
      sessionId: m.session_id,
      role: m.role,
      content: m.content,
      source: m.source || "text",
      timestamp: m.timestamp,
      metadata: m.metadata || undefined,
    }));

    const msgMap = new Map<string, AgentMessage>();
    for (const m of localMessages) {
      msgMap.set(m.id, m);
    }
    for (const m of remoteMessages) {
      msgMap.set(m.id, m);
    }

    return Array.from(msgMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch {
    return localMessages;
  }
}

/**
 * Guardar o actualizar sesión en el Servidor (API Route / Server side)
 */
export async function saveServerAgentSession(session: {
  id: string;
  userId: string;
  title: string;
}): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.from("agent_sessions").upsert({
      id: session.id,
      user_id: session.userId,
      title: session.title,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[Supabase Server Agent] Error al guardar sesión:", err);
  }
}

/**
 * Guardar mensaje en el Servidor (API Route / Server side)
 */
export async function saveServerAgentMessage(message: AgentMessage): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.from("agent_messages").insert({
      id: message.id,
      session_id: message.sessionId,
      role: message.role,
      content: message.content,
      source: message.source || "text",
      timestamp: message.timestamp,
      metadata: message.metadata ?? {},
    });
  } catch (err) {
    console.warn("[Supabase Server Agent] Error al guardar mensaje:", err);
  }
}

/* --- Helpers de LocalStorage (Browser / Client side) --- */

export function getLocalSessions(userId: string): AgentSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
    if (!raw) return [];
    const sessions = JSON.parse(raw) as AgentSession[];
    return sessions.filter((s) => s.userId === userId);
  } catch {
    return [];
  }
}

export function saveLocalSession(session: { id: string; userId: string; title: string }) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
    const sessions = raw ? (JSON.parse(raw) as AgentSession[]) : [];
    const existingIndex = sessions.findIndex((s) => s.id === session.id);

    const updatedSession: AgentSession = {
      id: session.id,
      userId: session.userId,
      title: session.title,
      messages: [],
      createdAt: existingIndex >= 0 ? sessions[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      sessions[existingIndex] = updatedSession;
    } else {
      sessions.unshift(updatedSession);
    }

    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error("Error saving local session", err);
  }
}

export function getLocalMessages(sessionId: string): AgentMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as AgentMessage[];
    return all.filter((m) => m.sessionId === sessionId);
  } catch {
    return [];
  }
}

export function saveLocalMessage(message: AgentMessage) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    const all = raw ? (JSON.parse(raw) as AgentMessage[]) : [];
    if (!all.some((m) => m.id === message.id)) {
      all.push(message);
      localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(all));
    }
  } catch (err) {
    console.error("Error saving local message", err);
  }
}

export function saveActiveSessionId(sessionId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY, sessionId);
  } catch (err) {
    console.error("Error saving active session ID", err);
  }
}

export function clearActiveSessionId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function getActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY);
  } catch {
    return null;
  }
}
