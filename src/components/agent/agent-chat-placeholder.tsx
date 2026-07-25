"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Mic, Send, Volume2, VolumeX, MicOff, AlertCircle } from "lucide-react";
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
  payload: Record<string, unknown>;
}

export function AgentChatPlaceholder() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_init",
      role: "assistant",
      content: "Hola, soy tu asistente médico de emergencias SanaIA. ¿En qué puedo ayudarte hoy? Cuéntame tus síntomas o si necesitas asistencia.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
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
          sessionId: "demo-session",
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
          setInput("Necesito encontrar un centro de salud cercano para emergencias");
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
      // Trigger a custom event that page.tsx can listen to
      const event = new CustomEvent("search-health-centers", {
        detail: { city: action.payload.city || "La Paz" }
      });
      window.dispatchEvent(event);
    }
    handleSendMessage(action.label);
  };

  return (
    <Card className="flex h-[550px] flex-col shadow-lg border-sana-100">
      <CardHeader className="bg-gradient-to-r from-sana-600 to-sana-700 text-white rounded-t-lg pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <MessageCircle className="h-5 w-5" />
            Asistente SanaIA
          </CardTitle>
          <span className="rounded-full bg-sana-500/50 px-2.5 py-0.5 text-xs font-semibold border border-sana-400/30">
            Zavu Agente Activo
          </span>
        </div>
        <CardDescription className="text-sana-100 text-xs">
          Triage inteligente con IA para evaluar síntomas en tiempo real
        </CardDescription>
      </CardHeader>

      {/* Messages area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-sana-50/30">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative group ${
                msg.role === "user"
                  ? "bg-sana-600 text-white rounded-br-none"
                  : "bg-white text-foreground rounded-bl-none border border-sana-100"
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
              
              {msg.role === "assistant" && (
                <button
                  onClick={() => speakText(msg.content, msg.id)}
                  className="absolute -right-8 top-1 p-1 rounded-full hover:bg-sana-100 text-sana-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
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
            <span className="text-[10px] text-muted-foreground mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start">
            <div className="bg-white border border-sana-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex space-x-1.5 items-center h-4">
                <span className="w-2 h-2 bg-sana-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-sana-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-sana-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Suggested actions */}
        {suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {suggestedActions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="bg-white border-sana-200 text-sana-700 hover:bg-sana-50 hover:text-sana-800 text-xs font-semibold rounded-full shadow-sm"
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
      <CardFooter className="border-t p-3 bg-white flex gap-2">
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
            placeholder={isRecording ? "Escuchando..." : "Describe tus síntomas aquí..."}
            className="flex-1 text-sm border-sana-200 focus-visible:ring-sana-500"
            disabled={isRecording}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="bg-sana-600 hover:bg-sana-700">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
