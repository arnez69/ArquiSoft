import type { AgentRequest, AgentResponse, AgentAction } from "@/types/agent";
import { generateId } from "@/utils";

/**
 * Cliente SDK Zavu — Dev 3 (Agente conversacional)
 * Modo mock con conversación natural, detección de intención y consejos clínicos.
 */

const ZAVU_API_KEY = process.env.ZAVU_API_KEY;
const ZAVU_BASE_URL = process.env.ZAVU_BASE_URL ?? "https://api.zavu.ai/v1";

type ConversationStep =
  | "greeting"
  | "awaiting_symptoms"
  | "symptoms"
  | "pain_index"
  | "pain_type"
  | "foods"
  | "completed";

interface TriageState {
  step: ConversationStep;
  symptoms?: string;
  painIndex?: number;
  painType?: string;
  foods?: string;
  severity?: "Emergencia" | "Urgencia" | "No urgente";
  presumptiveDiagnosis?: string;
  userName?: string;
}

const mockSessions = new Map<string, TriageState>();

const GREETINGS = [
  "hola", "buenos dias", "buenos días", "buenas tardes", "buenas noches",
  "hey", "hi", "hello", "que tal", "qué tal", "como estas", "cómo estás",
  "saludos", "buen dia", "buen día",
];

const EMERGENCY_KEYWORDS = [
  "infarto", "ataque al corazon", "ataque al corazón", "no puedo respirar",
  "dificultad respirar", "desmayo", "desmayé", "sangre abundante", "hemorragia",
  "convulsion", "convulsión", "inconsciente", "accidente grave", "emergencia",
  "auxilio", "911", "110", "morir", "muerte",
];

const SYMPTOM_KEYWORDS = [
  "dolor", "duele", "fiebre", "tos", "vomito", "vómito", "diarrea", "mareo",
  "mareos", "nausea", "náusea", "cansancio", "fatiga", "inflam", "hinch",
  "pecho", "estomago", "estómago", "abdomen", "barriga", "cabeza", "garganta",
  "alergia", "sarpullido", "rash", "picazon", "picazón", "ardor", "quemazón",
  "gripa", "gripe", "resfriado", "infeccion", "infección", "herida", "fractura",
  "diabetes", "presion", "presión", "hipertension", "hipertensión", "ansiedad",
  "depresion", "depresión", "palpitacion", "palpitación", "debilidad",
];

const DISEASE_PATTERNS: Array<{ pattern: RegExp; advice: string; severity: TriageState["severity"] }> = [
  {
    pattern: /gripe|resfriado|tos|congest/i,
    advice: "Descansa, mantente hidratado y evita automedicarte con antibióticos sin receta. Si la fiebre supera 38.5°C por más de 3 días o tienes dificultad para respirar, acude a un centro de salud.",
    severity: "No urgente",
  },
  {
    pattern: /diarrea|vomito|vómito|deshidrat/i,
    advice: "Toma líquidos en pequeños sorbos (suero oral o agua). Evita lácteos y comidas grasas. Si hay sangre en las heces, fiebre alta o más de 24 h sin mejoría, ve a urgencias.",
    severity: "Urgencia",
  },
  {
    pattern: /dolor.*(pecho|torax|tórax)|opresi[oó]n.*pecho|brazo.*(izquierdo|left)/i,
    advice: "⚠️ Síntomas que pueden indicar un problema cardíaco. Siéntate, mantén la calma y NO conduzcas. Acude de inmediato al servicio de emergencias más cercano o llama al 110.",
    severity: "Emergencia",
  },
  {
    pattern: /dolor.*(cabeza|cefalea)|migra/i,
    advice: "Descansa en un lugar oscuro y tranquilo. Evita pantallas. Si el dolor es el peor de tu vida, viene con rigidez de cuello o confusión, acude a urgencias de inmediato.",
    severity: "Urgencia",
  },
  {
    pattern: /fiebre|temperatura/i,
    advice: "Mantente hidratado y descansa. Toma tu temperatura cada 4 horas. Si supera 39°C, dura más de 3 días o viene con dificultad respiratoria, consulta en un centro médico.",
    severity: "Urgencia",
  },
  {
    pattern: /dolor.*(estomago|estómago|abdomen|barriga)|gastritis|acidez/i,
    advice: "Evita comidas grasas, picantes y café. Come porciones pequeñas. Si el dolor es intenso (8+/10), persistente más de 6 horas o viene con fiebre, acude a un centro de salud.",
    severity: "Urgencia",
  },
  {
    pattern: /ansiedad|panico|pánico|nervios/i,
    advice: "Respira profundo: inhala 4 segundos, mantén 4, exhala 6. Si sientes opresión en el pecho o falta de aire severa, acude a urgencias para descartar causas físicas.",
    severity: "No urgente",
  },
  {
    pattern: /diabetes|glucosa|azucar|azúcar/i,
    advice: "Si tienes glucómetro, mide tu nivel. Para hipoglucemia (<70 mg/dL): consume 15 g de azúcar. Si hay confusión o desmayo, llama a emergencias de inmediato.",
    severity: "Urgencia",
  },
];

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isGreeting(text: string): boolean {
  const n = normalize(text);
  return GREETINGS.some((g) => n === g || n.startsWith(g + " ") || n.startsWith(g + ","));
}

function isEmergency(text: string): boolean {
  const n = normalize(text);
  return EMERGENCY_KEYWORDS.some((k) => n.includes(normalize(k)));
}

function hasSymptoms(text: string): boolean {
  const n = normalize(text);
  return SYMPTOM_KEYWORDS.some((k) => n.includes(normalize(k))) || n.length > 25;
}

function matchDiseaseAdvice(text: string): { advice: string; severity: TriageState["severity"] } | null {
  for (const { pattern, advice, severity } of DISEASE_PATTERNS) {
    if (pattern.test(text)) return { advice, severity };
  }
  return null;
}

function buildMetadata(state: TriageState) {
  return {
    triageData: {
      symptoms: state.symptoms,
      painIndex: state.painIndex,
      painType: state.painType,
      foods: state.foods,
      severity: state.severity,
      presumptiveDiagnosis: state.presumptiveDiagnosis,
      step: state.step,
    },
  };
}

function hospitalActions(city = "La Paz"): AgentAction[] {
  return [
    { type: "find_hospital", label: "Ver centros médicos cercanos", payload: { city } },
    { type: "check_wallet", label: "Revisar billetera de emergencias", payload: {} },
  ];
}

export class ZavuClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey ?? ZAVU_API_KEY ?? "";
    this.baseUrl = baseUrl ?? ZAVU_BASE_URL;

    if (!this.apiKey || this.apiKey.startsWith("your-")) {
      this.apiKey = "";
    }
  }

  async sendMessage(request: AgentRequest): Promise<AgentResponse> {
    if (!this.apiKey) {
      return this.mockResponse(request);
    }

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

  private mockResponse(request: AgentRequest): AgentResponse {
    let state = mockSessions.get(request.sessionId);
    if (!state) {
      state = { step: "greeting" };
      mockSessions.set(request.sessionId, state);
    }

    const msg = request.message.trim();
    const msgNorm = normalize(msg);

    // Acciones disparadas por botones de la UI
    if (msgNorm.includes("contarte mis sintomas") || msgNorm.includes("contarte mis síntomas") || msgNorm === "tengo sintomas" || msgNorm === "no me siento bien") {
      state.step = "awaiting_symptoms";
      mockSessions.set(request.sessionId, state);
      return this.reply(request, state,
        "Gracias por confiar en mí. 💙 Cuéntame con detalle qué sientes:\n\n" +
        "• ¿Qué síntoma te molesta más?\n" +
        "• ¿Desde cuándo lo tienes?\n" +
        "• ¿Ha empeorado o mejorado?\n\n" +
        "_Ejemplo: \"Tengo dolor de estómago y náuseas desde anoche después de cenar\"_",
        [
          { type: "input_example", label: "Dolor de estómago y náuseas", payload: { value: "Tengo dolor de estómago y náuseas desde anoche" } },
          { type: "input_example", label: "Fiebre y dolor de garganta", payload: { value: "Tengo fiebre de 38°C y dolor de garganta" } },
          { type: "input_example", label: "Dolor de cabeza intenso", payload: { value: "Me duele mucho la cabeza desde hace 2 días" } },
        ]
      );
    }

    if (msgNorm.includes("consejos de salud") || msgNorm.includes("salud general")) {
      return this.reply(request, state,
        "💡 **Consejos de salud preventiva:**\n\n" +
        "• Bebe al menos 2 litros de agua al día\n" +
        "• Duerme entre 7 y 8 horas\n" +
        "• Realiza actividad física moderada 30 min/día\n" +
        "• Reduce sal, azúcar y alcohol\n" +
        "• Asiste a chequeos médicos al menos una vez al año\n\n" +
        "¿Tienes algún síntoma que te preocupe?",
        [
          { type: "start_symptoms", label: "Sí, tengo síntomas", payload: {} },
          { type: "find_hospital", label: "Agendar chequeo médico", payload: { city: "La Paz" } },
        ]
      );
    }

    if (msgNorm.includes("continuar con la evaluacion") || msgNorm.includes("evaluación detallada")) {
      state.step = "symptoms";
      mockSessions.set(request.sessionId, state);
      return this.askPainIndex(request, state);
    }

    if (msgNorm.includes("centro medico cercano") || msgNorm.includes("centro médico cercano")) {
      return this.reply(request, state,
        "Te ayudo a encontrar centros de salud disponibles. Revisa el panel de **Centros de salud** a la derecha, o dime tu ciudad para buscar opciones cercanas.\n\n" +
        "Si es una emergencia, llama al **110** de inmediato.",
        hospitalActions()
      );
    }

    // Reiniciar conversación
    if (["reiniciar", "reset", "empezar de nuevo", "iniciar nueva consulta", "nueva consulta"].includes(msgNorm)) {
      state = { step: "greeting" };
      mockSessions.set(request.sessionId, state);
      return this.reply(request, state,
        "¡Perfecto! Empecemos de nuevo. 😊\n\nSoy SanaIA, tu asistente de salud. Estoy aquí para orientarte con síntomas, consejos médicos y ayudarte a encontrar el centro de salud más adecuado en Bolivia.\n\n¿En qué puedo ayudarte hoy?",
        [
          { type: "start_symptoms", label: "Tengo síntomas", payload: {} },
          { type: "find_hospital", label: "Buscar centro médico", payload: { city: "La Paz" } },
          { type: "general_info", label: "Consejos de salud general", payload: {} },
        ]
      );
    }

    // Emergencia en cualquier momento
    if (isEmergency(msg)) {
      state.severity = "Emergencia";
      state.symptoms = msg;
      state.step = "completed";
      mockSessions.set(request.sessionId, state);
      return this.reply(request, state,
        "🚨 **SITUACIÓN DE EMERGENCIA DETECTADA**\n\n" +
        "Por lo que describes, necesitas atención médica **inmediata**:\n\n" +
        "1. **Llama al 110** (emergencias Bolivia) o acude al hospital más cercano\n" +
        "2. No conduzcas — pide ayuda a alguien de confianza\n" +
        "3. Mantén la calma y permanece en reposo\n" +
        "4. Si tienes medicamentos habituales (diabetes, presión), tenlos a mano\n\n" +
        "¿Quieres que te muestre los centros de emergencia más cercanos?",
        [
          ...hospitalActions(),
          { type: "restart_triage", label: "Fue un error, reiniciar", payload: {} },
        ]
      );
    }

    // --- Fase de saludo / conversación inicial ---
    if (state.step === "greeting") {
      if (isGreeting(msg)) {
        return this.reply(request, state,
          "¡Hola! 👋 Qué gusto saludarte. Soy **SanaIA**, tu asistente de salud disponible las 24 horas.\n\n" +
          "Puedo ayudarte con:\n" +
          "• Evaluar síntomas y orientarte sobre qué hacer\n" +
          "• Darte consejos médicos generales\n" +
          "• Encontrar centros de salud y clínicas cercanas\n" +
          "• Activar tu billetera de emergencias si lo necesitas\n\n" +
          "Cuéntame, ¿cómo te sientes hoy? ¿Hay algo que te preocupe?",
          [
            { type: "start_symptoms", label: "No me siento bien", payload: {} },
            { type: "start_symptoms", label: "Tengo dolor o malestar", payload: {} },
            { type: "find_hospital", label: "Necesito un centro médico", payload: { city: "La Paz" } },
            { type: "general_info", label: "Solo quiero consejos de salud", payload: {} },
          ]
        );
      }

      if (msgNorm.includes("consejo") || msgNorm.includes("salud general") || msgNorm.includes("prevencion") || msgNorm.includes("prevención")) {
        return this.reply(request, state,
          "💡 **Consejos de salud preventiva:**\n\n" +
          "• Bebe al menos 2 litros de agua al día\n" +
          "• Duerme entre 7 y 8 horas\n" +
          "• Realiza actividad física moderada 30 min/día\n" +
          "• Reduce el consumo de sal, azúcar y alcohol\n" +
          "• Asiste a chequeos médicos al menos una vez al año\n\n" +
          "¿Tienes algún síntoma específico que te preocupe? Puedo orientarte mejor si me lo cuentas.",
          [
            { type: "start_symptoms", label: "Sí, tengo síntomas", payload: {} },
            { type: "find_hospital", label: "Agendar chequeo médico", payload: { city: "La Paz" } },
          ]
        );
      }

      if (hasSymptoms(msg)) {
        return this.handleSymptomsReport(request, state, msg);
      }

      // Mensaje genérico sin síntomas claros
      return this.reply(request, state,
        "Entiendo. Para poder orientarte mejor, cuéntame un poco más:\n\n" +
        "• ¿Tienes algún **dolor**, **fiebre** o **malestar**?\n" +
        "• ¿Desde cuándo lo sientes?\n" +
        "• ¿Hay algo que empeore o mejore el síntoma?\n\n" +
        "Puedes escribirme con tus propias palabras — estoy aquí para escucharte. 💙",
        [
          { type: "start_symptoms", label: "Tengo síntomas que contar", payload: {} },
          { type: "find_hospital", label: "Prefiero ir directo a un centro", payload: { city: "La Paz" } },
        ]
      );
    }

    // Usuario indicó que quiere reportar síntomas
    if (state.step === "awaiting_symptoms") {
      if (hasSymptoms(msg)) {
        return this.handleSymptomsReport(request, state, msg);
      }
      return this.reply(request, state,
        "Estoy aquí para escucharte. Describe con detalle lo que sientes:\n\n" +
        "_Por ejemplo: \"Tengo dolor de estómago desde ayer después de comer\", \"Me duele la cabeza y tengo fiebre\", etc._\n\n" +
        "Mientras más detalles me des, mejor podré orientarte y recomendarte el centro médico adecuado.",
        [
          { type: "input_example", label: "Dolor de estómago y náuseas", payload: { value: "Tengo dolor de estómago y náuseas desde anoche" } },
          { type: "input_example", label: "Fiebre y dolor de garganta", payload: { value: "Tengo fiebre de 38°C y dolor de garganta" } },
          { type: "find_hospital", label: "Ir directo a un centro médico", payload: { city: "La Paz" } },
        ]
      );
    }

    // Flujo de triage — escala de dolor
    if (state.step === "symptoms") {
      state.step = "pain_index";
      const matches = msg.match(/\b([1-9]|10)\b/);
      if (matches) {
        state.painIndex = parseInt(matches[1], 10);
        state.step = "pain_type";
        mockSessions.set(request.sessionId, state);
        return this.askPainType(request, state);
      }
      // Si no es número, tratar como ampliación de síntomas
      state.symptoms = (state.symptoms ? state.symptoms + ". " : "") + msg;
      mockSessions.set(request.sessionId, state);
      return this.askPainIndex(request, state);
    }

    if (state.step === "pain_index") {
      const matches = msg.match(/\b([1-9]|10)\b/);
      const parsedIndex = matches ? parseInt(matches[1], 10) : 5;
      state.painIndex = parsedIndex;
      state.step = "pain_type";
      mockSessions.set(request.sessionId, state);
      return this.askPainType(request, state);
    }

    if (state.step === "pain_type") {
      state.painType = msg;
      state.step = "foods";
      mockSessions.set(request.sessionId, state);
      return this.reply(request, state,
        `Registrado: dolor de tipo **"${msg}"**.\n\n` +
        "Una última pregunta para completar tu evaluación: ¿qué has comido o bebido en las últimas 24 horas?\n\n" +
        "_Esto ayuda a identificar posibles causas digestivas._",
        [
          { type: "input_foods", label: "Dieta normal / casera", payload: { value: "comida casera normal" } },
          { type: "input_foods", label: "Comida grasosa / frituras", payload: { value: "comidas grasas o frituras" } },
          { type: "input_foods", label: "Poco o nada (ayunas)", payload: { value: "ayunas o poca comida" } },
        ]
      );
    }

    if (state.step === "foods") {
      state.foods = msg;
      state.step = "completed";
      return this.generateFinalReport(request, state);
    }

    if (state.step === "completed") {
      return this.reply(request, state,
        "Ya completamos tu evaluación. Si tienes **nuevos síntomas** o la situación empeora, inicia una nueva consulta.\n\n" +
        "Recuerda: esta orientación **no reemplaza** una consulta médica presencial.",
        [
          ...hospitalActions(),
          { type: "restart_triage", label: "Nueva consulta", payload: {} },
        ]
      );
    }

    mockSessions.set(request.sessionId, state);
    return this.reply(request, state, "¿En qué más puedo ayudarte?", hospitalActions());
  }

  /** Detecta síntomas, da consejos y recomienda centro médico */
  private handleSymptomsReport(
    request: AgentRequest,
    state: TriageState,
    msg: string
  ): AgentResponse {
    state.symptoms = msg;
    state.step = "symptoms";

    const diseaseMatch = matchDiseaseAdvice(msg);
    const isRedFlag =
      msg.toLowerCase().includes("pecho") ||
      msg.toLowerCase().includes("respirar") ||
      msg.toLowerCase().includes("ahogo") ||
      msg.toLowerCase().includes("desmayo");

    if (diseaseMatch) {
      state.severity = diseaseMatch.severity;
    } else if (isRedFlag) {
      state.severity = "Emergencia";
    } else {
      state.severity = "Urgencia";
    }

    let content =
      `Gracias por confiarme cómo te sientes. He tomado nota de tus síntomas. 🩺\n\n`;

    if (diseaseMatch) {
      content += `**Consejo médico preliminar:**\n${diseaseMatch.advice}\n\n`;
    } else {
      content +=
        "**Consejo general:**\n" +
        "Mientras evaluamos tu caso, evita automedicarte con antibióticos o analgésicos fuertes sin indicación médica. " +
        "Mantente hidratado y en reposo relativo.\n\n";
    }

    if (state.severity === "Emergencia") {
      content +=
        "🚨 **Recomendación:** Tu situación requiere atención **inmediata**. " +
        "Acude al servicio de emergencias más cercano o llama al **110**.\n\n";
      mockSessions.set(request.sessionId, state);
      return this.reply(request, state, content, [
        ...hospitalActions(),
        { type: "continue_triage", label: "Continuar evaluación detallada", payload: {} },
      ]);
    }

    content +=
      `📋 **Prioridad estimada:** ${state.severity}\n\n` +
      "Para orientarte mejor, necesito hacerte unas preguntas breves. " +
      "Primero: ¿qué tan intenso es el dolor o malestar del **1 al 10**?\n\n" +
      "_1 = casi imperceptible · 10 = insoportable_";

    mockSessions.set(request.sessionId, state);
    return this.reply(request, state, content, [
      { type: "input_pain", label: "Leve (1-3)", payload: { value: 2 } },
      { type: "input_pain", label: "Moderado (4-7)", payload: { value: 6 } },
      { type: "input_pain", label: "Severo (8-10)", payload: { value: 9 } },
      ...hospitalActions(),
    ]);
  }

  private askPainIndex(request: AgentRequest, state: TriageState): AgentResponse {
    return this.reply(request, state,
      "¿Qué tan intenso es el dolor o malestar? Indícalo del **1 al 10**:\n\n" +
      "_1 = casi imperceptible · 10 = insoportable_",
      [
        { type: "input_pain", label: "Leve (1-3)", payload: { value: 2 } },
        { type: "input_pain", label: "Moderado (4-7)", payload: { value: 6 } },
        { type: "input_pain", label: "Severo (8-10)", payload: { value: 9 } },
      ]
    );
  }

  private askPainType(request: AgentRequest, state: TriageState): AgentResponse {
    return this.reply(request, state,
      `Dolor registrado: **${state.painIndex}/10**.\n\n` +
      "¿Cómo describirías la sensación?\n\n" +
      "_Ardor, opresión, punzadas, cólico, u otra descripción._",
      [
        { type: "input_type", label: "Ardor / Quemazón", payload: { value: "ardor" } },
        { type: "input_type", label: "Opresivo (presión)", payload: { value: "opresión" } },
        { type: "input_type", label: "Punzante", payload: { value: "punzante" } },
        { type: "input_type", label: "Cólico", payload: { value: "cólico" } },
      ]
    );
  }

  private generateFinalReport(request: AgentRequest, state: TriageState): AgentResponse {
    const isEmergency =
      (state.painIndex && state.painIndex >= 8) ||
      state.symptoms?.toLowerCase().includes("pecho") ||
      state.symptoms?.toLowerCase().includes("respirar") ||
      state.severity === "Emergencia";

    if (isEmergency) state.severity = "Emergencia";
    else if (!state.severity || state.severity === "No urgente") state.severity = "Urgencia";

    // Diagnóstico presuntivo
    const symptomsLower = (state.symptoms || "").toLowerCase();
    const typeLower = (state.painType || "").toLowerCase();
    const foodsLower = (state.foods || "").toLowerCase();

    let diag = "Cuadro clínico a correlacionar en consulta presencial";
    if (symptomsLower.includes("pecho") || typeLower.includes("opresión")) {
      diag = "Sospecha de síndrome coronario agudo — requiere ECG inmediato";
    } else if (symptomsLower.match(/estomago|estómago|abdomen|barriga/)) {
      if (foodsLower.match(/grasa|frito/)) diag = "Posible colecistitis o cólico biliar";
      else if (typeLower.match(/ardor|quemaz/)) diag = "Gastritis aguda / dispepsia ácida";
      else if (typeLower.match(/cólico/)) diag = "Gastroenterocolitis aguda";
      else diag = "Dolor abdominal agudo — evaluación presencial recomendada";
    } else if (symptomsLower.match(/gripe|resfriado|tos/)) {
      diag = "Infección respiratoria aguda (probable viral)";
    } else if (symptomsLower.match(/cabeza|cefalea/)) {
      diag = "Cefalea tensional o migrañosa";
    }
    state.presumptiveDiagnosis = diag;

    const content =
      `✅ **Evaluación completada**\n\n` +
      `• **Prioridad:** ${state.severity}\n` +
      `• **Síntomas:** ${state.symptoms}\n` +
      `• **Intensidad del dolor:** ${state.painIndex}/10\n` +
      `• **Tipo de dolor:** ${state.painType}\n` +
      `• **Alimentación (24h):** ${state.foods}\n` +
      `• **Evaluación preliminar:** _${state.presumptiveDiagnosis}_\n\n` +
      `**Recomendaciones:**\n` +
      (state.severity === "Emergencia"
        ? "🚨 Acude **de inmediato** al servicio de emergencias. Llama al **110** si no puedes trasladarte.\n"
        : state.severity === "Urgencia"
          ? "⏰ Te recomiendo acudir a un **centro de salud en las próximas 4-6 horas** para evaluación presencial.\n"
          : "📅 Puedes agendar una **consulta médica en los próximos días**. Si empeoras, acude antes.\n") +
      "• Evita automedicarte antes de la consulta\n" +
      "• Lleva esta evaluación al médico como referencia\n" +
      "• Mantente hidratado y en reposo\n\n" +
      "¿Te muestro los centros médicos disponibles cerca de ti?";

    mockSessions.set(request.sessionId, state);
    return this.reply(request, state, content, [
      ...hospitalActions(),
      { type: "generate_infographic", label: "Generar resumen visual", payload: { prompt: `Triage ${state.severity}: ${state.presumptiveDiagnosis}. Dolor ${state.painIndex}/10.` } },
      { type: "restart_triage", label: "Nueva consulta", payload: {} },
    ]);
  }

  /** Atajo para botones de inicio de síntomas */
  handleQuickAction(sessionId: string, actionType: string): TriageState | null {
    const state = mockSessions.get(sessionId);
    if (!state) return null;
    if (actionType === "start_symptoms" || actionType === "general_info") {
      state.step = "awaiting_symptoms";
      mockSessions.set(sessionId, state);
    }
    return state;
  }

  private reply(
    request: AgentRequest,
    state: TriageState,
    content: string,
    actions: AgentAction[] = []
  ): AgentResponse {
    mockSessions.set(request.sessionId, state);
    return {
      message: {
        id: generateId("msg"),
        sessionId: request.sessionId,
        role: "assistant",
        content,
        source: "text",
        timestamp: new Date().toISOString(),
        metadata: buildMetadata(state),
      },
      suggestedActions: actions,
    };
  }
}

let zavuClient: ZavuClient | null = null;

export function getZavuClient(): ZavuClient {
  if (!zavuClient) zavuClient = new ZavuClient();
  return zavuClient;
}
