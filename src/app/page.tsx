"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  HeartPulse,
  MapPin,
  Phone,
  Shield,
  Sparkles,
  Search,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react";
import { AgentChatPlaceholder } from "@/components/agent/agent-chat-placeholder";
import { HealthCenterCard } from "@/components/health/health-center-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { WalletCard } from "@/components/wallet/wallet-card";
import { Input } from "@/components/ui/input";
import type { HealthCenter } from "@/types/health";

const INITIAL_DEMO_CENTERS: HealthCenter[] = [
  {
    id: "hc_1",
    name: "Hospital del Norte",
    address: "Av. Costanera 120",
    city: "La Paz",
    latitude: -16.4897,
    longitude: -68.1193,
    occupancyPercent: 42,
    services: ["urgencias", "UCI", "pediatría"],
    sourceUrl: "https://www.hospitaldelnorte.com.bo",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "hc_2",
    name: "Clínica San Gabriel",
    address: "Calle 6 de Agosto 450",
    city: "La Paz",
    latitude: -16.5001,
    longitude: -68.1342,
    occupancyPercent: 78,
    services: ["consulta general", "laboratorio"],
    sourceUrl: "https://www.clinicasangrabriel.com.bo",
    lastUpdated: new Date().toISOString(),
  },
];

const FEATURES = [
  {
    icon: HeartPulse,
    title: "Triage inteligente",
    description: "Agente Zavu evalúa síntomas y prioriza atención.",
    dev: "Dev 3",
    targetId: "triage-section",
  },
  {
    icon: Shield,
    title: "Billetera de emergencias",
    description: "Fondos listos para pagos médicos urgentes vía Wallbit.",
    dev: "Dev 2",
    targetId: "wallet-section",
  },
  {
    icon: MapPin,
    title: "Centros de salud",
    description: "Disponibilidad en tiempo real con Firecrawl y Exa.",
    dev: "Dev 4",
    targetId: "health-centers-section",
  },
  {
    icon: Sparkles,
    title: "Resúmenes visuales",
    description: "Infografías médicas generadas con fal.ai.",
    dev: "Dev 4",
    targetId: "visual-summary-section",
  },
] as const;

export default function HomePage() {
  const [centers, setCenters] = useState<HealthCenter[]>(INITIAL_DEMO_CENTERS);
  const [citySearch, setCitySearch] = useState("La Paz");
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Fal.ai state
  const [summaryPrompt, setSummaryPrompt] = useState("");
  const [visualSummary, setVisualSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Search event handler from Zavu agent trigger
  useEffect(() => {
    const handleAgentSearch = (e: Event) => {
      const customEvent = e as CustomEvent;
      const city = customEvent.detail.city;
      setCitySearch(city);
      handleSearchCenters(city, "");
      // Scroll to health centers section
      const element = document.getElementById("health-centers-section");
      element?.scrollIntoView({ behavior: "smooth" });
    };

    window.addEventListener("search-health-centers", handleAgentSearch);
    return () => {
      window.removeEventListener("search-health-centers", handleAgentSearch);
    };
  }, []);

  const handleSearchCenters = async (cityVal = citySearch, specialtyVal = specialtySearch) => {
    setIsSearching(true);
    try {
      const queryParams = new URLSearchParams({
        city: cityVal,
        ...(specialtyVal && { specialty: specialtyVal }),
      });
      const res = await fetch(`/api/health-centers?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Error en la búsqueda de centros");
      const data = await res.json();
      if (data.centers && data.centers.length > 0) {
        setCenters(data.centers);
      } else {
        setCenters([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summaryPrompt.trim()) return;

    setIsGeneratingSummary(true);
    setVisualSummary(null);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: summaryPrompt,
          userId: "demo-user",
          style: "infographic",
        }),
      });

      if (!res.ok) throw new Error("Error al generar resumen visual");
      const data = await res.json();
      setVisualSummary(data.imageUrl || "/placeholder-summary.png");
    } catch (err) {
      console.error(err);
      setVisualSummary("/placeholder-summary.png");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleScrollToSection = (targetId: string) => {
    const element = document.getElementById(targetId);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sana-50/50 to-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-sm shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-sana-600" />
            <div>
              <h1 className="text-xl font-bold text-sana-800">SanaIA</h1>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Cursor Buildathon Bolivia 2026
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sana-700">Iniciar sesión</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-sana-600 hover:bg-sana-700 text-white">Registrarse</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-12">
        {/* Hero */}
        <section className="text-center py-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-sana-700 to-sana-500 bg-clip-text text-transparent">
            Tu asistente médico de emergencias
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-sm sm:text-base">
            PWA integral para pacientes bolivianos: triage inteligente por voz, billetera de emergencias integrada y
            disponibilidad hospitalaria en tiempo real en un solo lugar.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button 
              variant="destructive" 
              size="lg" 
              className="flex gap-2 items-center shadow-md font-bold"
              onClick={() => {
                const tel = "tel:118"; // Emergency health number Bolivia
                window.open(tel);
              }}
            >
              <Phone className="h-5 w-5 animate-pulse" />
              Llamar Emergencia (118)
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-sana-200 text-sana-700 font-semibold"
              onClick={() => handleScrollToSection("triage-section")}
            >
              Comenzar Consulta
            </Button>
          </div>
        </section>

        {/* Dashboard MVP grid */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div id="triage-section" className="lg:col-span-2 scroll-mt-20">
            <AgentChatPlaceholder />
          </div>
          <div id="wallet-section" className="space-y-6 scroll-mt-20">
            <WalletCard />
            <Card className="shadow-md border-sana-100">
              <CardHeader>
                <CardTitle className="text-md font-bold text-sana-800">Estado del Sistema</CardTitle>
                <CardDescription className="text-xs">Integraciones activas en sandbox</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                {[
                  { name: "Supabase DB", mock: false },
                  { name: "Zavu SDK", mock: true },
                  { name: "Wallbit Payments", mock: true },
                  { name: "ElevenLabs (Voz)", mock: true },
                  { name: "Firecrawl (Scraping)", mock: true },
                  { name: "Exa Search", mock: true },
                  { name: "fal.ai Infographics", mock: true }
                ].map(
                  (service) => (
                    <div key={service.name} className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">{service.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        service.mock 
                          ? "bg-yellow-50 text-yellow-800 border border-yellow-200" 
                          : "bg-green-50 text-green-800 border border-green-200"
                      }`}>
                        {service.mock ? "Mock activo" : "Conectado"}
                      </span>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Health centers */}
        <section id="health-centers-section" className="scroll-mt-20 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-sana-800 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-sana-600" />
                Centros de salud cercanos
              </h3>
              <p className="text-xs text-muted-foreground">Consulta de disponibilidad y especialidades en tiempo real</p>
            </div>
            
            {/* Search filter inline */}
            <div className="flex flex-wrap items-center gap-2 max-w-md w-full">
              <Input
                placeholder="Ciudad (ej: La Paz)"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="text-xs border-sana-200 h-9 flex-1 min-w-[120px]"
              />
              <Input
                placeholder="Especialidad (ej: UCI)"
                value={specialtySearch}
                onChange={(e) => setSpecialtySearch(e.target.value)}
                className="text-xs border-sana-200 h-9 flex-1 min-w-[120px]"
              />
              <Button
                size="sm"
                onClick={() => handleSearchCenters()}
                disabled={isSearching}
                className="bg-sana-600 hover:bg-sana-700 text-white font-semibold h-9"
              >
                {isSearching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                Buscar
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {centers.length === 0 ? (
              <Card className="col-span-2 py-8 text-center border-dashed">
                <CardContent className="text-muted-foreground text-xs">
                  No se encontraron centros de salud con los criterios de búsqueda.
                </CardContent>
              </Card>
            ) : (
              centers.map((center) => (
                <HealthCenterCard key={center.id} center={center} />
              ))
            )}
          </div>
        </section>

        {/* Visual Summary generator section (fal.ai) */}
        <section id="visual-summary-section" className="scroll-mt-20 space-y-4">
          <div className="border-t pt-8">
            <h3 className="text-xl font-bold text-sana-800 flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-sana-600" />
              Generador de Resúmenes Visuales
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Crea infografías y diagramas médicos claros a partir de tus síntomas en segundos.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-sana-100 shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Detalles del Triage / Síntomas</CardTitle>
                  <CardDescription className="text-xs">Describe lo que sientes para generar tu infografía médica</CardDescription>
                </CardHeader>
                <form onSubmit={handleGenerateSummary}>
                  <CardContent className="space-y-4">
                    <textarea
                      placeholder="Ej: Paciente con fiebre alta (39C), tos persistente y dolor en el pecho desde hace 3 días. Diagnóstico preliminar de triage requiere reposo e hidratación."
                      value={summaryPrompt}
                      onChange={(e) => setSummaryPrompt(e.target.value)}
                      className="w-full h-32 text-xs border border-sana-200 rounded-lg p-3 focus:ring-1 focus:ring-sana-500 focus:outline-none resize-none"
                      required
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end p-4 border-t bg-sana-50/10">
                    <Button
                      type="submit"
                      disabled={isGeneratingSummary || !summaryPrompt.trim()}
                      className="bg-sana-600 hover:bg-sana-700 text-white text-xs font-semibold flex gap-1.5 items-center"
                    >
                      {isGeneratingSummary ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5" />
                      )}
                      Generar Infografía
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card className="border-sana-100 shadow-md flex flex-col justify-between overflow-hidden min-h-[250px]">
                <CardHeader className="bg-sana-50/50 pb-3 border-b">
                  <CardTitle className="text-sm font-bold text-sana-800">Infografía Resultante</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center p-6 bg-slate-50">
                  {isGeneratingSummary ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-8 w-8 text-sana-600 animate-spin" />
                      <p className="text-[11px] text-muted-foreground animate-pulse font-semibold">
                        Generando diseño con Fal.ai...
                      </p>
                    </div>
                  ) : visualSummary ? (
                    <div className="relative group w-full h-full max-h-[240px] flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={visualSummary}
                        alt="Infografía Médica SanaIA"
                        className="rounded-lg max-h-[240px] object-contain shadow-md"
                      />
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/60 mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        Completa el formulario y haz clic en "Generar Infografía" para visualizar tu resumen.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team integration guide */}
        <section className="border-t pt-8">
          <h3 className="mb-4 text-xl font-bold text-sana-800">Áreas de integración del equipo</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description, dev, targetId }) => (
              <Card 
                key={title} 
                className="hover:scale-[1.02] cursor-pointer transition-all duration-300 border-sana-100 shadow-xs flex flex-col justify-between"
                onClick={() => handleScrollToSection(targetId)}
              >
                <CardHeader className="pb-3">
                  <Icon className="mb-2 h-8 w-8 text-sana-600" />
                  <CardTitle className="text-base font-bold text-sana-800">{title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="secondary" size="sm" className="w-full text-xs font-semibold bg-sana-50 text-sana-700 hover:bg-sana-100 border border-sana-200">
                    {dev} → Probar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground bg-white">
        SanaIA © 2026 — Hecho con ❤️ para Bolivia
      </footer>
    </div>
  );
}
