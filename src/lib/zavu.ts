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

interface TriageState {
  step: 'init' | 'symptoms' | 'pain_index' | 'pain_type' | 'foods' | 'completed';
  symptoms?: string;
  painIndex?: number;
  painType?: string;
  foods?: string;
  severity?: 'Emergencia' | 'Urgencia' | 'No urgente';
  presumptiveDiagnosis?: string;
}

const mockSessions = new Map<string, TriageState>();

export class ZavuClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey ?? ZAVU_API_KEY ?? "";
    this.baseUrl = baseUrl ?? ZAVU_BASE_URL;

    if (!this.apiKey || this.apiKey.startsWith("your-")) {
      console.warn("[SanaIA] ZAVU_API_KEY no configurada o de prueba. El agente funcionará en modo mock.");
      this.apiKey = "";
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
    let state = mockSessions.get(request.sessionId);
    if (!state) {
      state = { step: 'init' };
      mockSessions.set(request.sessionId, state);
    }

    const messageText = request.message.trim().toLowerCase();
    
    // Check for reset
    if (
      messageText === 'reiniciar' || 
      messageText === 'reset' || 
      messageText === 'empezar de nuevo' || 
      messageText === 'iniciar nueva consulta'
    ) {
      state = { step: 'init' };
      mockSessions.set(request.sessionId, state);
      return {
        message: {
          id: generateId("msg"),
          sessionId: request.sessionId,
          role: "assistant",
          content: "Protocolo de triage reiniciado de forma segura. Hola, soy tu asistente médico virtual de SanaIA. Por favor, describe detalladamente la localización y el inicio de tu síntoma principal.",
          source: "text",
          timestamp: new Date().toISOString(),
          metadata: {
            triageData: {
              step: 'init',
              symptoms: '',
              painIndex: 0,
              painType: '',
              foods: '',
              severity: null,
              presumptiveDiagnosis: ''
            }
          }
        },
        suggestedActions: []
      };
    }

    let responseContent = "";
    let nextSuggestedActions: any[] = [];

    if (state.step === 'init') {
      state.symptoms = request.message;
      state.step = 'pain_index';
      
      // Clinical empathy and check for cardiac/breathing signs instantly
      const isRedFlag = request.message.toLowerCase().includes("pecho") || 
                        request.message.toLowerCase().includes("respirar") || 
                        request.message.toLowerCase().includes("ahogo") ||
                        request.message.toLowerCase().includes("desmayo");

      responseContent = `He registrado el síntoma: "${request.message}". Mantén la calma, estoy aquí para guiarte en este proceso clínico.\n\n${
        isRedFlag ? "⚠️ ATENCIÓN: Por sospecha de compromiso respiratorio o cardiovascular, mantente en reposo absoluto. " : ""
      }Para evaluar objetivamente tu estado, por favor indícame la intensidad del dolor según la Escala Visual Analógica (EVA) del 1 al 10, donde 1 representa un dolor casi imperceptible y 10 es un dolor incapacitante/insoportable.`;
      
      nextSuggestedActions = [
        { type: "input_pain", label: "Dolor Leve (1-3)", payload: { value: 3 } },
        { type: "input_pain", label: "Dolor Moderado (4-7)", payload: { value: 6 } },
        { type: "input_pain", label: "Dolor Severo (8-10)", payload: { value: 9 } },
      ];
    } else if (state.step === 'pain_index') {
      const matches = request.message.match(/\b([1-9]|10)\b/);
      let parsedIndex = matches ? parseInt(matches[1], 10) : 5;
      state.painIndex = parsedIndex;
      state.step = 'pain_type';
      
      responseContent = `Dolor tipificado clínicamente como nivel ${parsedIndex}/10 (EVA).\n\nPara afinar la sospecha diagnóstica, ¿cómo describirías la cualidad fisiológica del dolor? ¿Es un carácter de **ardor / quemazón**, se siente como una **opresión o peso constante**, se presenta como **punzadas intermitentes**, o es de tipo **cólico (retortijones que van y vienen)**?`;
      
      nextSuggestedActions = [
        { type: "input_type", label: "Ardor / Quemazón", payload: { value: "ardor" } },
        { type: "input_type", label: "Opresivo (presión)", payload: { value: "opresión" } },
        { type: "input_type", label: "Punzante (pinchazos)", payload: { value: "punzante" } },
        { type: "input_type", label: "Cólico (retortijones)", payload: { value: "cólico" } },
      ];
    } else if (state.step === 'pain_type') {
      state.painType = request.message;
      state.step = 'foods';
      
      responseContent = `Entendido. Registrado carácter doloroso: "${request.message}".\n\nProcederemos con la **anamnesis nutricional**: ¿Qué alimentos o líquidos has ingerido en las últimas 24 horas? Indícame si consumiste grasas, lácteos, comida rápida o si has estado en ayunas. Esto es clave para evaluar patologías del tracto digestivo superior o de la vesícula.`;
      
      nextSuggestedActions = [
        { type: "input_foods", label: "Dieta blanda / sana", payload: { value: "dieta blanda" } },
        { type: "input_foods", label: "Grasas / Frituras / Condimentos", payload: { value: "comidas grasas/frito" } },
        { type: "input_foods", label: "Ayuno prolongado (nada)", payload: { value: "ayunas" } },
      ];
    } else if (state.step === 'foods') {
      state.foods = request.message;
      state.step = 'completed';

      // Advanced Clinical Triage Logic (Manchester Triage Protocol simulation)
      const isEmergency = 
        (state.painIndex && state.painIndex >= 8) || 
        state.painType?.toLowerCase().includes("opresión") ||
        state.painType?.toLowerCase().includes("oprime") ||
        state.symptoms?.toLowerCase().includes("pecho") ||
        state.symptoms?.toLowerCase().includes("respirar") ||
        state.symptoms?.toLowerCase().includes("desmayo") ||
        state.symptoms?.toLowerCase().includes("corazon") ||
        state.symptoms?.toLowerCase().includes("infarto");

      state.severity = isEmergency ? "Emergencia" : "Urgencia";

      // Medical hypothesis formulation
      let diag = "Gastroenteritis aguda";
      const symptomsLower = (state.symptoms || "").toLowerCase();
      const typeLower = (state.painType || "").toLowerCase();
      const foodsLower = (state.foods || "").toLowerCase();

      if (symptomsLower.includes("pecho") || typeLower.includes("opresión")) {
        diag = "Sospecha de Síndrome Coronario Agudo (SICA) - Requiere ECG de 12 derivaciones inmediato";
      } else if (
        symptomsLower.includes("barriga") || 
        symptomsLower.includes("abdomen") || 
        symptomsLower.includes("estómago") ||
        symptomsLower.includes("colon")
      ) {
        if (foodsLower.includes("grasa") || foodsLower.includes("frito") || foodsLower.includes("pollo") || foodsLower.includes("mayonesa")) {
          diag = "Sospecha de Colecistitis Aguda o Cólico Biliar por transgresión grasa";
        } else if (typeLower.includes("ardor") || typeLower.includes("arde") || typeLower.includes("quemazón")) {
          diag = "Dispepsia Ácida / Gastritis Aguda erosiva secundaria a transgresión alimentaria";
        } else if (typeLower.includes("cólico") || typeLower.includes("retortijones")) {
          diag = "Espasmo Intestinal / Gastroenterocolitis aguda de probable etiología infecciosa";
        } else {
          diag = "Abdomen doloroso agudo a correlacionar clínicamente";
        }
      } else {
        if (typeLower.includes("ardor")) {
          diag = "Reflujo Gastroesofágico / Dispepsia no investigada";
        } else {
          diag = "Síndrome Doloroso Somático / Dolor abdominal inespecífico";
        }
      }
      state.presumptiveDiagnosis = diag;

      responseContent = `🏥 **REPORTE DE CLASIFICACIÓN CLÍNICA PRELIMINAR**\n\n` +
        `• **Prioridad de Atención**: **${state.severity}**\n` +
        `• **Sospecha Diagnóstica**: *${state.presumptiveDiagnosis}*\n` +
        `• **Gravedad del Dolor (EVA)**: ${state.painIndex}/10\n` +
        `• **Cualidad del Dolor**: ${state.painType}\n` +
        `• **Anamnesis Nutricional (24h)**: ${state.foods}\n\n` +
        `⚠️ **INDICACIÓN MÉDICA CRÍTICA:** Se recomienda **evitar la automedicación** (antiespasmódicos o analgésicos fuertes) antes de la evaluación física, ya que esto podría enmascarar un cuadro de resolución quirúrgica (como apendicitis o colecistitis). Por favor, presiona el botón para generar tu infografía fal.ai y dirígete al centro de salud recomendado.`;
      
      nextSuggestedActions = [
        { type: "find_hospital", label: "Buscar hospital cercano", payload: { city: "La Paz" } },
        { type: "generate_infographic", label: "Generar Infografía fal.ai", payload: { prompt: `Triage de ${state.severity}: ${state.presumptiveDiagnosis}. Dolor ${state.painIndex}/10 de tipo ${state.painType}. Comidas: ${state.foods}.` } },
        { type: "restart_triage", label: "Iniciar nueva consulta", payload: {} },
      ];
    } else {
      responseContent = `El reporte de triage clínico ya ha sido cerrado para esta sesión. Si presentas nuevos síntomas, por favor presiona 'Iniciar nueva consulta' para abrir un nuevo protocolo clínico.`;
      nextSuggestedActions = [
        { type: "find_hospital", label: "Buscar hospital cercano", payload: { city: "La Paz" } },
        { type: "restart_triage", label: "Iniciar nueva consulta", payload: {} },
      ];
    }

    // Save updated state
    mockSessions.set(request.sessionId, state);

    return {
      message: {
        id: generateId("msg"),
        sessionId: request.sessionId,
        role: "assistant",
        content: responseContent,
        source: "text",
        timestamp: new Date().toISOString(),
        metadata: {
          triageData: {
            symptoms: state.symptoms,
            painIndex: state.painIndex,
            painType: state.painType,
            foods: state.foods,
            severity: state.severity,
            presumptiveDiagnosis: state.presumptiveDiagnosis,
            step: state.step
          }
        }
      },
      suggestedActions: nextSuggestedActions,
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
