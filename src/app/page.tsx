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
  Image as ImageIcon,
  ChevronRight
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

type ActiveTab = "triage" | "wallet" | "health-centers" | "visual-summary";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("triage");
  const [centers, setCenters] = useState<HealthCenter[]>(INITIAL_DEMO_CENTERS);
  const [citySearch, setCitySearch] = useState("La Paz");
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Fal.ai state
  const [summaryPrompt, setSummaryPrompt] = useState("");
  const [visualSummary, setVisualSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Listeners for cross-tab triggers
  useEffect(() => {
    const handleAgentSearch = (e: Event) => {
      const customEvent = e as CustomEvent;
      const city = customEvent.detail.city;
      setCitySearch(city);
      handleSearchCenters(city, "");
      setActiveTab("health-centers");
    };

    const handleTriggerWallet = () => {
      setActiveTab("wallet");
    };

    window.addEventListener("search-health-centers", handleAgentSearch);
    window.addEventListener("trigger-wallet-payment", handleTriggerWallet);
    
    return () => {
      window.removeEventListener("search-health-centers", handleAgentSearch);
      window.removeEventListener("trigger-wallet-payment", handleTriggerWallet);
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

  const menuItems = [
    {
      id: "triage" as ActiveTab,
      icon: HeartPulse,
      title: "Triage inteligente",
      description: "Agente Zavu evalúa síntomas y prioriza atención médica.",
      dev: "Dev 3",
    },
    {
      id: "wallet" as ActiveTab,
      icon: Shield,
      title: "Billetera de emergencias",
      description: "Fondos listos para pagos médicos urgentes vía Wallbit.",
      dev: "Dev 2",
    },
    {
      id: "health-centers" as ActiveTab,
      icon: MapPin,
      title: "Centros de salud",
      description: "Disponibilidad de clínicas con Firecrawl y Exa.",
      dev: "Dev 4",
    },
    {
      id: "visual-summary" as ActiveTab,
      icon: Sparkles,
      title: "Resúmenes visuales",
      description: "Infografías médicas autogeneradas con fal.ai.",
      dev: "Dev 4",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sana-50/30 to-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-sana-600" />
            <div>
              <h1 className="text-xl font-bold text-sana-800">SanaIA</h1>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                Workspace Integrado • Bolivia 2026
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              size="sm"
              className="flex gap-1.5 items-center font-bold px-3 shadow-sm text-xs"
              onClick={() => window.open("tel:118")}
            >
              <Phone className="h-3.5 w-3.5 animate-pulse" />
              Llamar Emergencia (118)
            </Button>
            <nav className="flex items-center gap-1.5 border-l pl-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs text-sana-700">Iniciar sesión</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-sana-600 hover:bg-sana-700 text-white text-xs">Registrarse</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 grid gap-6 lg:grid-cols-4 items-start">
        
        {/* LEFT COLUMN: Active Function Workspace (takes 3 cols on large screens) */}
        <section className="lg:col-span-3 space-y-6">
          
          {activeTab === "triage" && (
            <div className="animate-fadeIn">
              <AgentChatPlaceholder />
            </div>
          )}

          {activeTab === "wallet" && (
            <div className="animate-fadeIn grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <WalletCard />
              </div>
              <Card className="shadow-md border-sana-100 h-fit">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-sana-800">Estado de Wallbit</CardTitle>
                  <CardDescription className="text-xs">Pasarela médica y fondos liquidados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Moneda Principal</span>
                    <span className="font-semibold text-gray-700">Bolivianos (BOB)</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Proveedor Bancario</span>
                    <span className="font-semibold text-gray-700">Wallbit Sandbox</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Liquidación</span>
                    <span className="text-green-600 font-bold">Inmediata (1-2s)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "health-centers" && (
            <div className="animate-fadeIn space-y-4">
              <Card className="border-sana-100 shadow-md">
                <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-bold text-sana-800 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-sana-600" />
                      Buscador de Centros de Salud
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Consulta la disponibilidad en tiempo real con Exa y Firecrawl
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 max-w-md w-full">
                    <Input
                      placeholder="Ciudad (ej: La Paz)"
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="text-xs border-sana-200 h-9 flex-1"
                    />
                    <Input
                      placeholder="Especialidad (ej: UCI)"
                      value={specialtySearch}
                      onChange={(e) => setSpecialtySearch(e.target.value)}
                      className="text-xs border-sana-200 h-9 flex-1"
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
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {centers.length === 0 ? (
                      <div className="col-span-2 py-8 text-center text-xs text-muted-foreground">
                        No se encontraron clínicas ni hospitales para mostrar.
                      </div>
                    ) : (
                      centers.map((center) => (
                        <HealthCenterCard key={center.id} center={center} />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "visual-summary" && (
            <div className="animate-fadeIn grid gap-6 md:grid-cols-2">
              <Card className="border-sana-100 shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-sana-800 flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-sana-600" />
                    Generador de Infografías
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Genera resúmenes visuales de triage médico usando fal.ai
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleGenerateSummary}>
                  <CardContent className="space-y-4">
                    <textarea
                      placeholder="Ej: Paciente masculino de 45 años ingresa con presión arterial alta (140/90) y cefalea intensa. Triage clasificado como Código Amarillo: se recomienda evaluación médica y reposo."
                      value={summaryPrompt}
                      onChange={(e) => setSummaryPrompt(e.target.value)}
                      className="w-full h-40 text-xs border border-sana-200 rounded-lg p-3 focus:ring-1 focus:ring-sana-500 focus:outline-none resize-none"
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

              <Card className="border-sana-100 shadow-md flex flex-col justify-between overflow-hidden min-h-[300px]">
                <CardHeader className="bg-sana-50/50 pb-3 border-b">
                  <CardTitle className="text-sm font-bold text-sana-800">Infografía Resultante</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center p-6 bg-slate-50">
                  {isGeneratingSummary ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-8 w-8 text-sana-600 animate-spin" />
                      <p className="text-[11px] text-muted-foreground animate-pulse font-semibold">
                        Diseñando infografía médica en fal.ai...
                      </p>
                    </div>
                  ) : visualSummary ? (
                    <div className="relative w-full h-full max-h-[300px] flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={visualSummary}
                        alt="Infografía Médica SanaIA"
                        className="rounded-lg max-h-[260px] object-contain shadow-md"
                      />
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/60 mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        Escribe el triage clínico en el panel izquierdo y haz clic en "Generar Infografía" para visualizar.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

        </section>

        {/* RIGHT COLUMN: Team Integration Navigation Sidebar (takes 1 col) */}
        <section className="space-y-4">
          <div className="bg-sana-600/5 p-4 rounded-xl border border-sana-500/10 mb-2">
            <h4 className="text-xs font-bold text-sana-800 uppercase tracking-wider mb-1">
              Áreas de Integración
            </h4>
            <p className="text-[10px] text-muted-foreground">
              Haz clic en cada sección del equipo para activar su respectiva función interactiva en el panel principal.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between items-start gap-2 shadow-xs group ${
                    isActive
                      ? "bg-white border-sana-600 ring-2 ring-sana-500/20"
                      : "bg-white/70 hover:bg-white border-sana-100 hover:border-sana-300"
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${isActive ? "bg-sana-600 text-white" : "bg-sana-50 text-sana-600 group-hover:bg-sana-100"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded bg-slate-100 border text-[9px] font-bold text-slate-700 px-1.5 py-0.5">
                      {item.dev}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      {item.title}
                      {isActive && <ChevronRight className="h-3 w-3 text-sana-600 animate-pulse" />}
                    </h5>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* System status card placed directly below in the sidebar */}
          <Card className="shadow-xs border-sana-100 mt-2 bg-white/70">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-sana-800 uppercase tracking-wider">Servicios Activos</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2 text-[10px]">
              {[
                { name: "Supabase DB", mock: false },
                { name: "Zavu SDK", mock: true },
                { name: "Wallbit Payments", mock: true },
                { name: "ElevenLabs (Voz)", mock: true },
                { name: "Firecrawl Scraper", mock: true },
                { name: "Exa Search", mock: true },
                { name: "fal.ai Infographics", mock: true }
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">{service.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${service.mock ? "bg-yellow-400" : "bg-green-500"}`} />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-[11px] text-muted-foreground bg-white mt-auto">
        SanaIA © 2026 — Hecho con ❤️ para Bolivia
      </footer>
    </div>
  );
}
