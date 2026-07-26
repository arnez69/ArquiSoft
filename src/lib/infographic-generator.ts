/**
 * Generador de infografías médicas locales (modo demo sin fal.ai).
 * Produce un SVG estilizado a partir del texto de triage clínico.
 */

export type InfographicStyle = "infographic" | "diagram" | "chart";

interface ParsedTriage {
  severity: "Emergencia" | "Urgencia" | "No urgente";
  severityColor: string;
  severityBg: string;
  title: string;
  bullets: string[];
  recommendation: string;
}

function detectSeverity(text: string): ParsedTriage["severity"] {
  const t = text.toLowerCase();
  if (
    t.includes("emergencia") ||
    t.includes("código rojo") ||
    t.includes("codigo rojo") ||
    t.includes("inmediat") ||
    t.includes("crítico") ||
    t.includes("critico")
  ) {
    return "Emergencia";
  }
  if (
    t.includes("urgencia") ||
    t.includes("código amarillo") ||
    t.includes("codigo amarillo") ||
    t.includes("amarillo") ||
    t.includes("evaluación médica") ||
    t.includes("evaluacion medica")
  ) {
    return "Urgencia";
  }
  return "No urgente";
}

function severityColors(severity: ParsedTriage["severity"]) {
  switch (severity) {
    case "Emergencia":
      return { color: "#dc2626", bg: "#fef2f2" };
    case "Urgencia":
      return { color: "#d97706", bg: "#fffbeb" };
    default:
      return { color: "#0d9488", bg: "#f0fdfa" };
  }
}

function extractBullets(text: string): string[] {
  const bullets: string[] = [];
  const t = text.trim();

  // Extraer datos clínicos comunes
  const bpMatch = t.match(/(\d{2,3}\s*\/\s*\d{2,3})/);
  if (bpMatch) bullets.push(`Presión arterial: ${bpMatch[1]} mmHg`);

  const ageMatch = t.match(/(\d{1,3})\s*años/);
  if (ageMatch) bullets.push(`Edad del paciente: ${ageMatch[1]} años`);

  const keywords = [
    { re: /cefalea|dolor de cabeza/i, label: "Síntoma: Cefalea" },
    { re: /fiebre|temperatura/i, label: "Síntoma: Fiebre" },
    { re: /dolor.*(pecho|torax|tórax)/i, label: "Síntoma: Dolor torácico" },
    { re: /dolor.*(estomago|estómago|abdomen|barriga)/i, label: "Síntoma: Dolor abdominal" },
    { re: /nausea|náusea|vomito|vómito/i, label: "Síntoma: Náuseas/vómito" },
    { re: /tos|gripe|resfriado/i, label: "Síntoma: Respiratorio" },
    { re: /diabetes|glucosa/i, label: "Antecedente: Diabetes/glucosa" },
    { re: /hipertension|hipertensión|presión alta/i, label: "Antecedente: Hipertensión" },
  ];

  for (const { re, label } of keywords) {
    if (re.test(t) && !bullets.includes(label)) bullets.push(label);
  }

  // Si no hay bullets específicos, usar oraciones del texto
  if (bullets.length === 0) {
    const sentences = t.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);
    bullets.push(...sentences.slice(0, 4));
  }

  return bullets.slice(0, 5);
}

function getRecommendation(severity: ParsedTriage["severity"]): string {
  switch (severity) {
    case "Emergencia":
      return "Acudir de inmediato al servicio de emergencias. Llamar al 110 / 118.";
    case "Urgencia":
      return "Evaluación médica en las próximas 4–6 horas. Evitar automedicación.";
    default:
      return "Consulta médica programada. Reposo, hidratación y monitoreo de síntomas.";
  }
}

function parseTriagePrompt(prompt: string): ParsedTriage {
  const severity = detectSeverity(prompt);
  const colors = severityColors(severity);
  const bullets = extractBullets(prompt);

  return {
    severity,
    severityColor: colors.color,
    severityBg: colors.bg,
    title: "Reporte de Triage Clínico",
    bullets,
    recommendation: getRecommendation(severity),
  };
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines.slice(0, 6);
}

/** Genera SVG de infografía médica y retorna data URL */
export function generateInfographicSvg(
  prompt: string,
  style: InfographicStyle = "infographic"
): string {
  const data = parseTriagePrompt(prompt);
  const summaryLines = wrapText(prompt, 55);
  const styleLabel =
    style === "diagram" ? "Diagrama clínico" : style === "chart" ? "Gráfico de triage" : "Infografía médica";

  const bulletY = 200;
  const bulletItems = data.bullets
    .map((b, i) => {
      const y = bulletY + i * 28;
      return `
        <circle cx="44" cy="${y - 5}" r="4" fill="${data.severityColor}"/>
        <text x="58" y="${y}" font-family="system-ui,sans-serif" font-size="13" fill="#334155">${escapeXml(b.slice(0, 60))}</text>
      `;
    })
    .join("");

  const summaryText = summaryLines
    .map(
      (line, i) =>
        `<text x="40" y="${380 + i * 18}" font-family="system-ui,sans-serif" font-size="11" fill="#64748b">${escapeXml(line)}</text>`
    )
    .join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#0d9488"/>
      <stop offset="100%" style="stop-color:#14b8a6"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="#ffffff"/>
  <rect width="800" height="80" fill="url(#headerGrad)"/>
  <text x="40" y="38" font-family="system-ui,sans-serif" font-size="22" font-weight="bold" fill="#ffffff">SanaIA</text>
  <text x="40" y="62" font-family="system-ui,sans-serif" font-size="12" fill="#ccfbf1">${styleLabel} • Bolivia 2026</text>
  <text x="760" y="45" text-anchor="end" font-family="system-ui,sans-serif" font-size="11" fill="#ccfbf1">fal.ai</text>

  <text x="40" y="115" font-family="system-ui,sans-serif" font-size="18" font-weight="bold" fill="#0f172a">${escapeXml(data.title)}</text>

  <rect x="40" y="130" width="160" height="32" rx="16" fill="${data.severityBg}" stroke="${data.severityColor}" stroke-width="1.5"/>
  <text x="120" y="151" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="bold" fill="${data.severityColor}">${data.severity}</text>

  <rect x="40" y="175" width="720" height="170" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="58" y="198" font-family="system-ui,sans-serif" font-size="12" font-weight="bold" fill="#475569">DATOS CLÍNICOS DETECTADOS</text>
  ${bulletItems}

  <rect x="40" y="360" width="720" height="115" rx="12" fill="${data.severityBg}" stroke="${data.severityColor}" stroke-width="1" opacity="0.9"/>
  <text x="58" y="385" font-family="system-ui,sans-serif" font-size="12" font-weight="bold" fill="${data.severityColor}">RECOMENDACIÓN</text>
  <text x="58" y="408" font-family="system-ui,sans-serif" font-size="13" fill="#1e293b">${escapeXml(data.recommendation)}</text>
  ${summaryText}

  <text x="760" y="485" text-anchor="end" font-family="system-ui,sans-serif" font-size="9" fill="#94a3b8">Generado por SanaIA — No reemplaza consulta médica</text>
</svg>`;

  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(svg).toString("base64")
      : btoa(unescape(encodeURIComponent(svg)));

  return `data:image/svg+xml;base64,${base64}`;
}

export function buildFalPrompt(prompt: string, style: InfographicStyle): string {
  const styleDesc =
    style === "diagram"
      ? "medical flowchart diagram with arrows and boxes"
      : style === "chart"
        ? "medical data chart with vital signs visualization"
        : "clean professional medical infographic";

  return (
    `${styleDesc}, healthcare poster design, teal and white color scheme, ` +
    `Spanish text labels, hospital triage summary, icons for symptoms, ` +
    `clear sections for severity level and medical recommendations. ` +
    `Content: ${prompt.slice(0, 400)}`
  );
}
