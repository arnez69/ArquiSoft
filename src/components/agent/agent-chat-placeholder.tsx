"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, Mic, Send, Volume2, VolumeX, MicOff,
  AlertCircle, Activity, HeartPulse, Flame, Utensils,
  ShieldAlert, Sparkles, RefreshCw, Heart
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  "• Evaluar síntomas y orientarte\n" +
  "• Darte consejos médicos generales\n" +
  "• Encontrar centros de salud cercanos\n\n" +
  "¿Cómo te sientes hoy? Cuéntame con confianza.";

const INITIAL_ACTIONS: SuggestedAction[] = [
  { type: "start_symptoms", label: "No me siento bien", payload: {} },
  { type: "start_symptoms", label: "Tengo dolor o malestar", payload: {} },
  { type: "find_hospital", label: "Buscar centro médico", payload: { city: "La Paz" } },
  { type: "general_info", label: "Consejos de salud", payload: {} },
];

export function AgentChatPlaceholder() {
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
  const sessionIdRef = useRef(`session_${Date.now()}`);

  // Triage state collected from agent metadata
  const [triageData, setTriageData] = useState<{
    symptoms?: string;
    painIndex?: number;
    painType?: string;
    foods?: string;
    severity?: 'Emergencia' | 'Urgencia' | 'No urgente';
    presumptiveDiagnosis?: string;
    step?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speech Recognition setup (Whisper fallback if not available)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = "es-BO";
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

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
          sessionId: sessionIdRef.current,
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

      setMessages((prev) => [...prev, botMessage]);

      // Extract triage data from assistant message metadata
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
      // Mock recording behavior if browser doesn't support speech recognition API
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
      const event = new CustomEvent("search-health-centers", {
        detail: { city: action.payload.city || "La Paz" },
      });
      window.dispatchEvent(event);
      handleSendMessage("Necesito encontrar un centro médico cercano");
      return;
    }

    if (action.type === "restart_triage") {
      setTriageData(null);
      sessionIdRef.current = `session_${Date.now()}`;
      handleSendMessage("Iniciar nueva consulta");
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
      detail: { prompt: promptText }
    });
    window.dispatchEvent(event);
  };

  // Get color based on pain level
  const getPainColor = (index?: number) => {
    if (!index) return "bg-gray-200";
    if (index <= 3) return "bg-emerald-500";
    if (index <= 7) return "bg-amber-500";
    return "bg-rose-600 animate-pulse";
  };

  return (
    <div className="grid gap-6 md:grid-cols-3 items-stretch w-full">
      {/* LEFT: The Chat Module */}
      <Card className="flex h-[580px] flex-col shadow-lg border-sana-100 dark:border-slate-800 md:col-span-2 bg-card">
        <CardHeader className="bg-gradient-to-r from-sana-600 to-sana-700 dark:from-sana-850 dark:to-sana-900 text-white rounded-t-lg pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <MessageCircle className="h-5 w-5" />
              Asistente SanaIA
            </CardTitle>
            <span className="rounded-full bg-sana-500/50 px-2.5 py-0.5 text-[10px] font-semibold border border-sana-400/30">
              Zavu Agente Clínico
            </span>
          </div>
          <CardDescription className="text-sana-100 text-xs">
            Conversación natural, consejos médicos y orientación a centros de salud.
          </CardDescription>
        </CardHeader>

        {/* Messages area */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/55 dark:bg-slate-950/20">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-xs relative group ${msg.role === "user"
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
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-white dark:bg-slate-900 border border-sana-100 dark:border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-xs">
                <div className="flex space-x-1.5 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-sana-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-sana-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-sana-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Suggested actions */}
          {suggestedActions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {suggestedActions.map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-sana-50 dark:bg-slate-900 dark:hover:bg-slate-850 border-sana-200 dark:border-slate-800 text-sana-700 dark:text-slate-350 text-[11px] font-semibold rounded-full shadow-xs transition-colors"
                  onClick={() => handleSuggestedAction(action)}
                >
                  {action.label}
                </Button>
              ))}
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
              placeholder={isRecording ? "Escuchando..." : "Escribe aquí... saluda, describe síntomas o pide ayuda"}
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
                  onClick={() => triggerFalGeneration(`Triage clínico: ${triageData.severity}. Diagnóstico: ${triageData.presumptiveDiagnosis}. Escala de Dolor: ${triageData.painIndex}/10 de tipo ${triageData.painType}. Comidas consumidas: ${triageData.foods}.`)}
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
