"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, Mic, Send, Volume2, VolumeX, MicOff,
  Activity, HeartPulse, Flame, Utensils,
  ShieldAlert, Sparkles, PlusCircle, History, ChevronLeft, Heart
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAgentSessions,
  getAgentSessionMessages,
  saveLocalSession,
  saveLocalMessage,
  saveActiveSessionId,
  getActiveSessionId,
} from "@/lib/supabase-agent";
import type { AgentSession, AgentMessage } from "@/types/agent";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SuggestedAction {
  type: string;
  label: string;
  payload: Record<string, any>;
}

const WELCOME_MESSAGE =
  "¡Hola! 👋 Soy **SanaIA**, tu asistente de salud disponible las 24 horas.\n\n" +
  "Puedo ayudarte a:\n" +
  "• Evaluar síntomas y orientarte en un triage clínico\n" +
  "• Recomendarte el departamento y tipo de hospital (Público o Privado) adecuado\n" +
  "• Darte consejos médicos generales\n\n" +
  "¿Cómo te sientes hoy? Cuéntame con confianza.";

const INITIAL_ACTIONS: SuggestedAction[] = [
  { type: "start_symptoms", label: "No me siento bien", payload: {} },
  { type: "start_symptoms", label: "Tengo dolor o malestar", payload: {} },
  { type: "find_hospital", label: "Buscar centro médico", payload: {} },
  { type: "general_info", label: "Consejos de salud", payload: {} },
];

export function AgentChatPlaceholder() {
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const active = getActiveSessionId();
      if (active) return active;
    }
    return `session_${Date.now()}`;
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_init",
      role: "assistant",
      content: WELCOME_MESSAGE,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>(INITIAL_ACTIONS);

  // Historial de sesiones estilo ChatGPT/Gemini
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Triage state collected from agent metadata
  const [triageData, setTriageData] = useState<{
    symptoms?: string;
    painIndex?: number;
    painType?: string;
    foods?: string;
    severity?: "Emergencia" | "Urgencia" | "No urgente";
    presumptiveDiagnosis?: string;
    step?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Cargar sesión activa al montar el componente (al cambiar de pestañas en la app)
  useEffect(() => {
    async function initSessionAndList() {
      const activeId = getActiveSessionId();
      if (activeId) {
        setSessionId(activeId);
        const savedMsgs = await getAgentSessionMessages(activeId);
        if (savedMsgs.length > 0) {
          setMessages(
            savedMsgs.map((m) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: m.timestamp,
            }))
          );
          // Restaurar metadata de triage si existe
          const lastBotMsg = [...savedMsgs].reverse().find((m) => m.metadata?.triageData);
          if (lastBotMsg?.metadata?.triageData) {
            setTriageData(lastBotMsg.metadata.triageData as any);
          }
        }
      }

      const sessionsList = await getAgentSessions("demo-user");
      setSessions(sessionsList);
    }

    initSessionAndList();
  }, []);

  // Recargar la lista de sesiones cuando cambia el estado de mensajes
  useEffect(() => {
    async function updateList() {
      const sessionsList = await getAgentSessions("demo-user");
      setSessions(sessionsList);
    }
    updateList();
  }, [messages.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = "es-BO";
        recognition.interimResults = false;

        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleStartNewSession = () => {
    const newId = `session_${Date.now()}`;
    setSessionId(newId);
    saveActiveSessionId(newId);
    setTriageData(null);
    const initMsg: Message = {
      id: `msg_init_${Date.now()}`,
      role: "assistant",
      content: WELCOME_MESSAGE,
      timestamp: new Date().toISOString(),
    };
    setMessages([initMsg]);
    setSuggestedActions(INITIAL_ACTIONS);

    // Guardar en local la nueva sesión
    saveLocalSession({
      id: newId,
      userId: "demo-user",
      title: "Nueva consulta",
    });
  };

  const handleSelectSession = async (sId: string) => {
    setSessionId(sId);
    saveActiveSessionId(sId);
    setIsLoading(true);
    try {
      const msgs = await getAgentSessionMessages(sId);
      if (msgs.length > 0) {
        setMessages(
          msgs.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: m.timestamp,
          }))
        );

        // Restaurar panel de triage si hay metadata guardada
        const lastBotMsg = [...msgs].reverse().find((m) => m.metadata?.triageData);
        if (lastBotMsg?.metadata?.triageData) {
          setTriageData(lastBotMsg.metadata.triageData as any);
        } else {
          setTriageData(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = `msg_user_${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    // Guardar inmediatamente en localStorage del cliente
    const agentUserMsg: AgentMessage = {
      id: userMsgId,
      sessionId,
      role: "user",
      content: textToSend,
      source: "text",
      timestamp: userMessage.timestamp,
    };
    saveLocalSession({
      id: sessionId,
      userId: "demo-user",
      title: textToSend.slice(0, 30) + (textToSend.length > 30 ? "..." : ""),
    });
    saveLocalMessage(agentUserMsg);
    saveActiveSessionId(sessionId);

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setSuggestedActions([]);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          userId: "demo-user",
          sessionId,
        }),
      });

      if (!res.ok) throw new Error("Error al consultar el agente");

      const data = await res.json();
      const botMessage: Message = {
        id: data.message.id,
        role: "assistant",
        content: data.message.content,
        timestamp: data.message.timestamp,
      };

      // Guardar mensaje del bot en localStorage del cliente
      const agentBotMsg: AgentMessage = {
        id: data.message.id,
        sessionId,
        role: "assistant",
        content: data.message.content,
        source: "text",
        timestamp: data.message.timestamp,
        metadata: data.message.metadata,
      };
      saveLocalMessage(agentBotMsg);

      setMessages((prev) => [...prev, botMessage]);

      if (data.message.metadata?.triageData) {
        setTriageData(data.message.metadata.triageData);
      }

      if (data.suggestedActions) {
        setSuggestedActions(data.suggestedActions);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_error_${Date.now()}`,
          role: "assistant",
          content: "Disculpa, ha ocurrido un error al conectar con el servidor de Zavu.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      if (isRecording) {
        setIsRecording(false);
      } else {
        setIsRecording(true);
        setTimeout(() => {
          setInput("Tengo un dolor muy fuerte en el estómago desde hace dos horas");
          setIsRecording(false);
        }, 2000);
      }
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string, msgId: string) => {
    if (typeof window === "undefined") return;

    if (isSpeaking === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    setIsSpeaking(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSuggestedAction = (action: SuggestedAction) => {
    if (action.type === "find_hospital") {
      handleSendMessage("Quiero buscar centros médicos en Bolivia");
      return;
    }

    if (action.type === "select_department") {
      const dept = action.payload.department;
      handleSendMessage(`Estoy en el departamento de ${dept}`);
      return;
    }

    if (action.type === "select_hospital_type") {
      const { department, hospitalType } = action.payload;
      const event = new CustomEvent("search-health-centers", {
        detail: { department: department || "La Paz", type: hospitalType || "Público" },
      });
      window.dispatchEvent(event);
      handleSendMessage(`Ver ${hospitalType}s en ${department}`);
      return;
    }

    if (action.type === "restart_triage") {
      handleStartNewSession();
      return;
    }

    if (action.type === "generate_infographic") {
      triggerFalGeneration(action.payload.prompt as string);
      return;
    }

    if (action.type === "start_symptoms") {
      handleSendMessage("Quiero contarte mis síntomas");
      return;
    }

    if (action.type === "general_info") {
      handleSendMessage("Quiero consejos de salud general");
      return;
    }

    if (action.type === "continue_triage") {
      handleSendMessage("Quiero continuar con la evaluación detallada");
      return;
    }

    if (action.type === "input_pain" && action.payload.value) {
      handleSendMessage(String(action.payload.value));
      return;
    }

    if (action.type === "input_type" && action.payload.value) {
      handleSendMessage(String(action.payload.value));
      return;
    }

    if (action.type === "input_foods" && action.payload.value) {
      handleSendMessage(String(action.payload.value));
      return;
    }

    if (action.type === "input_example" && action.payload.value) {
      handleSendMessage(String(action.payload.value));
      return;
    }

    if (action.type === "check_wallet") {
      handleSendMessage("Quiero revisar mi billetera de emergencias");
      return;
    }

    handleSendMessage(action.label);
  };

  const triggerFalGeneration = (promptText: string) => {
    const event = new CustomEvent("generate-fal-infographic", {
      detail: { prompt: promptText },
    });
    window.dispatchEvent(event);
  };

  const getPainColor = (index?: number) => {
    if (!index) return "bg-gray-200";
    if (index <= 3) return "bg-emerald-500";
    if (index <= 7) return "bg-amber-500";
    return "bg-rose-600 animate-pulse";
  };

  return (
    <div className="grid gap-6 md:grid-cols-3 items-stretch w-full">
      {/* LEFT: The Chat Module with Gemini/ChatGPT sidebar */}
      <Card className="flex h-[580px] flex-col shadow-lg border-sana-100 dark:border-slate-800 md:col-span-2 bg-card relative overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-sana-600 to-sana-700 dark:from-sana-850 dark:to-sana-900 text-white rounded-t-lg pb-3 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-white hover:bg-sana-500/30 h-8 w-8"
                title="Historial de chats (Gemini / ChatGPT)"
              >
                <History className="h-4 w-4" />
              </Button>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <MessageCircle className="h-5 w-5" />
                Asistente SanaIA
              </CardTitle>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleStartNewSession}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold h-7 px-2.5 flex items-center gap-1 border border-white/20"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Nueva Consulta
              </Button>
              <span className="hidden sm:inline-block rounded-full bg-sana-500/50 px-2.5 py-0.5 text-[10px] font-semibold border border-sana-400/30">
                Zavu Agente Clínico
              </span>
            </div>
          </div>
          <CardDescription className="text-sana-100 text-xs">
            Conversación médica, triage inteligente y recomendación directa de hospitales públicos o privados.
          </CardDescription>
        </CardHeader>

        {/* Sidebar flotante estilo Gemini / ChatGPT */}
        {isSidebarOpen && (
          <div className="absolute left-0 top-[60px] bottom-0 w-64 bg-slate-900/95 backdrop-blur-md text-white border-r border-slate-800 z-20 p-3 flex flex-col justify-between animate-slideRight">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sana-400 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  Historial de Chats
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="h-6 w-6 text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={() => {
                  handleStartNewSession();
                  setIsSidebarOpen(false);
                }}
                className="w-full bg-sana-600 hover:bg-sana-700 text-white text-xs font-bold mb-3 flex items-center gap-1.5 justify-center"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                + Nueva Consulta
              </Button>

              <div className="space-y-1 overflow-y-auto max-h-[400px] pr-1">
                {sessions.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic p-2">Sin consultas previas guardadas.</p>
                ) : (
                  sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        handleSelectSession(s.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded text-xs transition-colors flex items-center gap-2 ${
                        sessionId === s.id
                          ? "bg-sana-700 text-white font-semibold"
                          : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      <MessageCircle className="h-3.5 w-3.5 shrink-0 text-sana-400" />
                      <span className="truncate">{s.title || "Consulta médica"}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-2 text-[10px] text-slate-400 text-center">
              Guardado en Supabase / LocalStorage
            </div>
          </div>
        )}

        {/* Messages area */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/55 dark:bg-slate-950/20">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-xs relative group ${
                  msg.role === "user"
                    ? "bg-sana-600 text-white rounded-br-none"
                    : "bg-white dark:bg-slate-900 text-foreground rounded-bl-none border border-sana-100 dark:border-slate-800"
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                {msg.role === "assistant" && (
                  <button
                    onClick={() => speakText(msg.content, msg.id)}
                    className="absolute -right-8 top-1 p-1 rounded-full hover:bg-sana-100 dark:hover:bg-slate-800 text-sana-600 dark:text-sana-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Leer en voz alta"
                  >
                    {isSpeaking === msg.id ? (
                      <VolumeX className="h-4 w-4 text-red-500 animate-pulse" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              <span className="text-[9px] text-muted-foreground mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-white dark:bg-slate-900 border border-sana-100 dark:border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-xs">
                <div className="flex space-x-1.5 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-sana-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-sana-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-sana-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Suggested actions (Destacando botones de Hospital Público / Privado) */}
          {suggestedActions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {suggestedActions.map((action, idx) => {
                const isSpecial = action.type === "select_hospital_type";
                return (
                  <Button
                    key={idx}
                    variant={isSpecial ? "default" : "outline"}
                    size="sm"
                    className={`text-[11px] font-bold rounded-full shadow-xs transition-all ${
                      isSpecial
                        ? "bg-sana-600 hover:bg-sana-700 text-white border-none px-4 py-1.5 scale-105"
                        : "bg-white hover:bg-sana-50 dark:bg-slate-900 dark:hover:bg-slate-850 border-sana-200 dark:border-slate-800 text-sana-700 dark:text-slate-350"
                    }`}
                    onClick={() => handleSuggestedAction(action)}
                  >
                    {action.label}
                  </Button>
                );
              })}
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input area */}
        <CardFooter className="border-t border-border p-3 bg-white dark:bg-slate-900 flex gap-2 rounded-b-lg">
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={toggleRecording}
            className={`${isRecording ? "animate-pulse" : ""} shrink-0`}
            title={isRecording ? "Detener grabación" : "Grabar mensaje"}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          <form
            className="flex-1 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRecording ? "Escuchando..." : "Escribe aquí... describe síntomas o pide ayuda"}
              className="flex-1 text-xs border-sana-200 dark:border-slate-800 focus-visible:ring-sana-500 bg-card text-foreground"
              disabled={isRecording}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="bg-sana-600 hover:bg-sana-700 shrink-0 text-white">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>

      {/* RIGHT: Triage Report Panel */}
      <Card className="flex h-[580px] flex-col shadow-lg border-sana-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="bg-slate-50 dark:bg-slate-950 pb-3 border-b border-border">
          <CardTitle className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
            <HeartPulse className="h-4.5 w-4.5 text-sana-650" />
            Reporte Clínico de Triage
          </CardTitle>
          <CardDescription className="text-[11px]">
            Variables médicas y diagnóstico presuntivo detectados.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto">
          {triageData ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Severity Status Badge */}
              <div className="p-3.5 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Severidad / Prioridad</p>
                <div className="flex items-center gap-2">
                  {triageData.severity === "Emergencia" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-450 border border-rose-250 dark:border-rose-900/30">
                      <ShieldAlert className="h-3.5 w-3.5 animate-bounce" />
                      Emergencia (Atención Inmediata)
                    </span>
                  ) : triageData.severity === "Urgencia" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-450 border border-amber-250 dark:border-amber-900/30">
                      <Activity className="h-3.5 w-3.5 animate-pulse" />
                      Urgencia (Atención Rápida)
                    </span>
                  ) : triageData.severity ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/30">
                      <Heart className="h-3.5 w-3.5" />
                      No Urgente
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium italic">Evaluando síntomas...</span>
                  )}
                </div>
              </div>

              {/* Presumptive Diagnosis */}
              <div className="p-3.5 rounded-xl border border-sana-100 dark:border-sana-950/30 bg-sana-50/15 dark:bg-sana-950/10 space-y-1">
                <p className="text-[10px] text-sana-650 dark:text-sana-400 uppercase font-bold tracking-wider">Diagnóstico Presuntivo</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                  {triageData.presumptiveDiagnosis || (
                    <span className="text-xs text-muted-foreground font-normal italic">Recopilando datos de consulta...</span>
                  )}
                </p>
              </div>

              {/* Pain Index Scale */}
              <div className="space-y-1.5 p-1">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  <span>Índice del Dolor</span>
                  <span className="font-bold text-xs text-foreground">{triageData.painIndex ? `${triageData.painIndex}/10` : "Pendiente"}</span>
                </div>
                {triageData.painIndex ? (
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getPainColor(triageData.painIndex)} transition-all duration-500`}
                        style={{ width: `${triageData.painIndex * 10}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-muted-foreground">
                      <span>Leve</span>
                      <span>Moderado</span>
                      <span>Severo</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">Esperando que el paciente indique el nivel...</p>
                )}
              </div>

              {/* Pain Sensation / Type */}
              <div className="p-3 rounded-xl border dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  Sensación / Tipo de Dolor
                </p>
                {triageData.painType ? (
                  <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-350 border border-indigo-150 dark:border-indigo-900/30 capitalize">
                    {triageData.painType}
                  </span>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">No definido aún.</p>
                )}
              </div>

              {/* Foods Consumed (24h) */}
              <div className="p-3 rounded-xl border dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                  <Utensils className="h-3.5 w-3.5 text-emerald-500" />
                  Alimentos (Últimas 24 horas)
                </p>
                <p className="text-xs text-foreground font-medium">
                  {triageData.foods || (
                    <span className="text-[11px] text-muted-foreground italic">No indicados aún.</span>
                  )}
                </p>
              </div>

              {/* Generate infographic action shortcut */}
              {triageData.presumptiveDiagnosis && (
                <Button
                  onClick={() =>
                    triggerFalGeneration(
                      `Triage clínico: ${triageData.severity}. Diagnóstico: ${triageData.presumptiveDiagnosis}. Escala de Dolor: ${triageData.painIndex}/10 de tipo ${triageData.painType}. Comidas consumidas: ${triageData.foods}.`
                    )
                  }
                  className="w-full mt-2 bg-gradient-to-r from-sana-600 to-sana-700 hover:from-sana-700 hover:to-sana-800 text-white text-xs font-bold py-2 shadow-md flex gap-2 items-center justify-center rounded-xl transition-all duration-300"
                >
                  <Sparkles className="h-4 w-4" />
                  Generar Infografía fal.ai
                </Button>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
              <div className="bg-sana-50 dark:bg-slate-950 p-4 rounded-full border dark:border-slate-800 text-sana-650">
                <HeartPulse className="h-10 w-10 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Consulta de Triage Vacía</h4>
                <p className="text-[10px] text-muted-foreground mt-1 max-w-[180px] leading-relaxed mx-auto">
                  Describe tus síntomas en el chat para iniciar el reporte automatizado.
                </p>
              </div>
              <div className="text-[9px] text-muted-foreground border dark:border-slate-800 p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 max-w-[200px]">
                <p className="font-bold mb-1 uppercase tracking-wider">Ejemplo de inicio:</p>
                <span className="italic">"Tengo un dolor muy fuerte en el estómago desde anoche..."</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
