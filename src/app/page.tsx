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
  ChevronRight,
  Home,
  Info,
  Layers,
  ArrowRight,
  Sun,
  Moon
} from "lucide-react";
import { AgentChatPlaceholder } from "@/components/agent/agent-chat-placeholder";
import { HealthCenterCard } from "@/components/health/health-center-card";
import { MapWrapper } from "@/components/health/map-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { WalletCard } from "@/components/wallet/wallet-card";
import { Input } from "@/components/ui/input";
import type { HealthCenter, BoliviaDepartment, HospitalType } from "@/types/health";
import { BOLIVIA_HOSPITALS, BOLIVIA_DEPARTMENTS_CONFIG } from "@/data/bolivia-hospitals";

type ActiveTab = "home" | "triage" | "wallet" | "health-centers" | "visual-summary";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [centers, setCenters] = useState<HealthCenter[]>(BOLIVIA_HOSPITALS);
  const [selectedDepartment, setSelectedDepartment] = useState<BoliviaDepartment | "Todos">("Todos");
  const [selectedHospitalType, setSelectedHospitalType] = useState<HospitalType | "Todos">("Todos");
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Fal.ai state
  const [summaryPrompt, setSummaryPrompt] = useState("");
  const [visualSummary, setVisualSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Theme Sync on Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark =
        localStorage.getItem("theme") === "dark" ||
        (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  // Listeners for cross-tab triggers
  useEffect(() => {
    const handleAgentSearch = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { city, department, type } = customEvent.detail || {};

      if (department) {
        setSelectedDepartment(department as BoliviaDepartment);
      }
      if (type) {
        setSelectedHospitalType(type as HospitalType);
      }
      if (city) {
        setKeywordSearch(city);
      }
      setSelectedCenterId(null);
      setActiveTab("health-centers");
    };

    const handleTriggerWallet = () => {
      setActiveTab("wallet");
    };

    const handleGenerateFalInfo = (e: Event) => {
      const customEvent = e as CustomEvent;
      const promptText = customEvent.detail.prompt;
      setSummaryPrompt(promptText);
      setActiveTab("visual-summary");

      setIsGeneratingSummary(true);
      setVisualSummary(null);
      fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          userId: "demo-user",
          style: "infographic",
        }),
      })
        .then(res => {
          if (!res.ok) throw new Error("Error");
          return res.json();
        })
        .then(data => {
          setVisualSummary(data.imageUrl || "/placeholder-summary.png");
        })
        .catch(err => {
          console.error(err);
          setVisualSummary("/placeholder-summary.png");
        })
        .finally(() => {
          setIsGeneratingSummary(false);
        });
    };

    window.addEventListener("search-health-centers", handleAgentSearch);
    window.addEventListener("trigger-wallet-payment", handleTriggerWallet);
    window.addEventListener("generate-fal-infographic", handleGenerateFalInfo);

    return () => {
      window.removeEventListener("search-health-centers", handleAgentSearch);
      window.removeEventListener("trigger-wallet-payment", handleTriggerWallet);
      window.removeEventListener("generate-fal-infographic", handleGenerateFalInfo);
    };
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
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
    <div className="min-h-screen bg-gradient-to-b from-sana-50/30 to-background dark:from-slate-950 dark:to-slate-900 text-foreground flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-xs border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-sana-600 dark:text-sana-500" />
            <div>
              <h1 className="text-xl font-bold text-sana-800 dark:text-sana-100">SanaIA</h1>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                Workspace Integrado • Bolivia 2026
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex gap-1.5 items-center px-3 shadow-xs text-xs border-sana-200 text-sana-700 hover:bg-sana-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              onClick={toggleDarkMode}
              title={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-4 w-4 text-yellow-500" />
                  Modo Claro
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-slate-700 dark:text-slate-400" />
                  Modo Oscuro
                </>
              )}
            </Button>
            <nav className="flex items-center gap-1.5 border-l pl-3 border-border">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs text-sana-700 dark:text-slate-300">Iniciar sesión</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-sana-600 hover:bg-sana-700 dark:bg-sana-700 dark:hover:bg-sana-600 text-white text-xs">Registrarse</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 grid gap-6 lg:grid-cols-4 items-start">

        {/* LEFT COLUMN: Navigation Sidebar */}
        <section className="space-y-3 lg:order-1 order-2">

          {/* Home / presentation button */}
          <button
            onClick={() => setActiveTab("home")}
            className={`text-left p-3.5 rounded-xl border transition-all duration-300 flex items-center gap-3 w-full shadow-sm group ${activeTab === "home"
              ? "bg-sana-600 text-white border-sana-700 ring-2 ring-sana-500/20 dark:bg-sana-700 dark:border-sana-800"
              : "bg-white hover:bg-white border-sana-100 hover:border-sana-300 dark:bg-slate-900 dark:hover:bg-slate-800/80 dark:border-slate-800"
              }`}
          >
            <div className={`p-2 rounded-lg ${activeTab === "home" ? "bg-sana-700 text-white dark:bg-sana-800" : "bg-sana-50 text-sana-600 group-hover:bg-sana-100 dark:bg-slate-800 dark:text-sana-400"}`}>
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h5 className={`text-xs font-bold ${activeTab === "home" ? "text-white" : "text-gray-800 dark:text-slate-200"}`}>Inicio</h5>
              <p className={`text-[10px] ${activeTab === "home" ? "text-sana-100" : "text-muted-foreground"} mt-0.5`}>
                Presentación e info general.
              </p>
            </div>
          </button>

          <div className="flex flex-col gap-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between items-start gap-2 shadow-xs group ${isActive
                    ? "bg-white dark:bg-slate-900 border-sana-600 dark:border-sana-500 ring-2 ring-sana-500/20"
                    : "bg-white/70 hover:bg-white border-sana-100 hover:border-sana-300 dark:bg-slate-900/60 dark:hover:bg-slate-900 dark:border-slate-800/80"
                    }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${isActive ? "bg-sana-600 text-white dark:bg-sana-700" : "bg-sana-50 text-sana-600 group-hover:bg-sana-100 dark:bg-slate-800 dark:text-sana-450"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 text-[9px] font-bold text-slate-750 px-1.5 py-0.5">
                      {item.dev}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1">
                      {item.title}
                      {isActive && <ChevronRight className="h-3 w-3 text-sana-600 dark:text-sana-400 animate-pulse" />}
                    </h5>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* System status card */}
          <Card className="shadow-xs border-sana-100 dark:border-slate-800 mt-2 bg-white/70 dark:bg-slate-900/60">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-sana-800 dark:text-slate-200 uppercase tracking-wider">Servicios Activos</CardTitle>
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
                  <span className="text-gray-650 dark:text-slate-400 font-medium">{service.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${service.mock ? "bg-yellow-400" : "bg-green-500"}`} />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* RIGHT COLUMN: Active Workspace Area */}
        <section className="lg:col-span-3 space-y-6 lg:order-2 order-1">

          {/* Welcome / Home view */}
          {activeTab === "home" && (
            <div className="animate-fadeIn space-y-6">
              <Card className="border-sana-100 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900">
                <div className="bg-gradient-to-r from-sana-600 to-sana-700 dark:from-sana-800 dark:to-sana-900 p-8 text-white relative">
                  <div className="max-w-2xl">
                    <span className="rounded-full bg-sana-500/30 border border-sana-400/20 px-3 py-1 text-xs font-semibold text-sana-100">
                      Cursor Buildathon Bolivia 2026
                    </span>
                    <h2 className="text-3xl font-extrabold mt-4">Bienvenido a SanaIA</h2>
                    <p className="text-sana-100 text-sm mt-2 leading-relaxed">
                      SanaIA es una PWA de salud inteligente e integrada que conecta asistencia médica conversacional, pagos rápidos de emergencia y disponibilidad hospitalaria en una sola interfaz limpia y lista para producción.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button
                        onClick={() => setActiveTab("triage")}
                        className="bg-white dark:bg-slate-100 text-sana-700 dark:text-slate-800 hover:bg-sana-50 dark:hover:bg-slate-200 font-bold text-xs flex gap-1.5 items-center"
                      >
                        Comenzar Consulta
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => window.open("tel:118")}
                        variant="destructive"
                        className="font-bold text-xs flex gap-1.5 items-center"
                      >
                        Llamar a Emergencias (118)
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Presentation list */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <Layers className="h-4 w-4 text-sana-600 dark:text-sana-400" />
                      ¿Cómo funciona el sistema?
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 rounded-xl border border-sana-100 dark:border-slate-800 bg-sana-50/10 dark:bg-slate-900/50 space-y-1">
                        <h4 className="text-xs font-bold text-sana-700 dark:text-sana-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sana-500" />
                          Triage por Inteligencia Artificial
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Utiliza el asistente virtual potenciado por Zavu SDK y Whisper para realizar consultas por voz o texto de tus síntomas. El agente te guiará y recomendará acciones inmediatas.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl border border-sana-100 dark:border-slate-800 bg-sana-50/10 dark:bg-slate-900/50 space-y-1">
                        <h4 className="text-xs font-bold text-sana-700 dark:text-sana-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sana-500" />
                          Billetera de Emergencia Integrada
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Conectado con Wallbit API para mantener un saldo virtual en bolivianos (BOB) exclusivo para pagos rápidos de emergencias médicas, previniendo demoras de desembolso bancario.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl border border-sana-100 dark:border-slate-800 bg-sana-50/10 dark:bg-slate-900/50 space-y-1">
                        <h4 className="text-xs font-bold text-sana-700 dark:text-sana-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sana-500" />
                          Búsqueda y Scraping en Tiempo Real
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          La combinación de Exa y Firecrawl permite rastrear sitios oficiales y base de datos de centros médicos en La Paz y otras ciudades de Bolivia, verificando especialidades y disponibilidad.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl border border-sana-100 dark:border-slate-800 bg-sana-50/10 dark:bg-slate-900/50 space-y-1">
                        <h4 className="text-xs font-bold text-sana-700 dark:text-sana-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sana-500" />
                          Resúmenes Visuales (fal.ai)
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Generación automática de diagramas de triage e infografías comprensibles a través del modelo de imágenes de fal.ai para facilitar la lectura del reporte médico del paciente.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tech stack */}
                  <div className="border-t border-border pt-6">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <Info className="h-4 w-4 text-sana-600 dark:text-sana-400" />
                      Arquitectura Tecnológica del MVP
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      Este proyecto está construido sobre un stack moderno y enfocado en la velocidad de respuesta, ideal para aplicaciones progresivas (PWA) de asistencia crítica:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["Next.js 14 (App Router)", "TypeScript", "Tailwind CSS", "Supabase Auth & DB", "Zavu AI SDK", "Wallbit API", "Firecrawl Scraper", "Exa Semantic Search", "ElevenLabs Voice API", "fal.ai SDK"].map((tech) => (
                        <span key={tech} className="rounded-md bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-350 px-2 py-1">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
              <Card className="shadow-md border-sana-100 dark:border-slate-800 h-fit bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-sana-800 dark:text-slate-200">Estado de Wallbit</CardTitle>
                  <CardDescription className="text-xs">Pasarela médica y fondos liquidados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-muted-foreground">Moneda Principal</span>
                    <span className="font-semibold text-gray-750 dark:text-slate-300">Bolivianos (BOB)</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-muted-foreground">Proveedor Bancario</span>
                    <span className="font-semibold text-gray-750 dark:text-slate-300">Wallbit Sandbox</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Liquidación</span>
                    <span className="text-green-600 dark:text-green-550 font-bold">Inmediata (1-2s)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "health-centers" && (
            <div className="animate-fadeIn space-y-4">
              <Card className="border-sana-100 dark:border-slate-800 shadow-md bg-card">
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-base font-bold text-sana-800 dark:text-slate-200 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-sana-600 dark:text-sana-400 animate-bounce" />
                        Mapa GPS - Centros de Salud en Bolivia
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Localización en tiempo real de clínicas y hospitales en los 9 departamentos de Bolivia
                      </CardDescription>
                    </div>

                    {/* Leyenda de Ocupación */}
                    <div className="flex items-center gap-3 text-[10px] font-semibold bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-border">
                      <span className="text-muted-foreground">Ocupación:</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> &lt;50%
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> 50-75%
                      </span>
                      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> &gt;75%
                      </span>
                    </div>
                  </div>

                  {/* Fila de Filtros */}
                  <div className="mt-4 space-y-3">
                    {/* Selector de Departamentos */}
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Selecciona un Departamento (9 Departamentos):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Todos",
                          "La Paz",
                          "Santa Cruz",
                          "Cochabamba",
                          "Oruro",
                          "Potosí",
                          "Tarija",
                          "Chuquisaca",
                          "Beni",
                          "Pando",
                        ].map((dept) => (
                          <button
                            key={dept}
                            onClick={() => {
                              setSelectedDepartment(dept as BoliviaDepartment | "Todos");
                              setSelectedCenterId(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              selectedDepartment === dept
                                ? "bg-sana-600 text-white shadow-sm ring-2 ring-sana-500/30 dark:bg-sana-700"
                                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <MapPin className="h-3 w-3" />
                            {dept}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filtros secundarios: Tipo y Búsqueda */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Tipo:</span>
                        <div className="flex gap-1 flex-wrap">
                          {(["Todos", "Público", "Privado", "Seguro Social (CNS)"] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => setSelectedHospitalType(type)}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                                selectedHospitalType === type
                                  ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-400"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 min-w-[220px]">
                        <Input
                          placeholder="Buscar por hospital, especialidad (ej: UCI)..."
                          value={keywordSearch}
                          onChange={(e) => setKeywordSearch(e.target.value)}
                          className="text-xs border-sana-200 dark:border-slate-800 h-8 bg-card dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-6">
                  {/* Mapa GPS Interactivo */}
                  <MapWrapper
                    centers={centers.filter((center) => {
                      const matchDept = selectedDepartment === "Todos" || center.department === selectedDepartment;
                      const matchType = selectedHospitalType === "Todos" || center.type === selectedHospitalType;
                      const q = keywordSearch.trim().toLowerCase();
                      const matchQuery =
                        !q ||
                        center.name.toLowerCase().includes(q) ||
                        center.city.toLowerCase().includes(q) ||
                        center.address.toLowerCase().includes(q) ||
                        center.services.some((s) => s.toLowerCase().includes(q));

                      return matchDept && matchType && matchQuery;
                    })}
                    selectedCenterId={selectedCenterId}
                    onSelectCenter={(center) => setSelectedCenterId(center.id)}
                    departmentConfig={
                      BOLIVIA_DEPARTMENTS_CONFIG[selectedDepartment] || BOLIVIA_DEPARTMENTS_CONFIG["Todos"]
                    }
                  />

                  {/* Listado de centros en la zona */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
                        Centros Médicos Encontrados ({
                          centers.filter((center) => {
                            const matchDept = selectedDepartment === "Todos" || center.department === selectedDepartment;
                            const matchType = selectedHospitalType === "Todos" || center.type === selectedHospitalType;
                            const q = keywordSearch.trim().toLowerCase();
                            const matchQuery =
                              !q ||
                              center.name.toLowerCase().includes(q) ||
                              center.city.toLowerCase().includes(q) ||
                              center.address.toLowerCase().includes(q) ||
                              center.services.some((s) => s.toLowerCase().includes(q));

                            return matchDept && matchType && matchQuery;
                          }).length
                        })
                      </h4>
                      {selectedDepartment !== "Todos" && (
                        <span className="text-xs text-sana-600 dark:text-sana-400 font-semibold">
                          Viendo {selectedDepartment} ({BOLIVIA_DEPARTMENTS_CONFIG[selectedDepartment].capital})
                        </span>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {centers.filter((center) => {
                        const matchDept = selectedDepartment === "Todos" || center.department === selectedDepartment;
                        const matchType = selectedHospitalType === "Todos" || center.type === selectedHospitalType;
                        const q = keywordSearch.trim().toLowerCase();
                        const matchQuery =
                          !q ||
                          center.name.toLowerCase().includes(q) ||
                          center.city.toLowerCase().includes(q) ||
                          center.address.toLowerCase().includes(q) ||
                          center.services.some((s) => s.toLowerCase().includes(q));

                        return matchDept && matchType && matchQuery;
                      }).length === 0 ? (
                        <div className="col-span-2 py-10 text-center text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-border">
                          No se encontraron centros médicos que coincidan con la búsqueda en {selectedDepartment}.
                        </div>
                      ) : (
                        centers.filter((center) => {
                          const matchDept = selectedDepartment === "Todos" || center.department === selectedDepartment;
                          const matchType = selectedHospitalType === "Todos" || center.type === selectedHospitalType;
                          const q = keywordSearch.trim().toLowerCase();
                          const matchQuery =
                            !q ||
                            center.name.toLowerCase().includes(q) ||
                            center.city.toLowerCase().includes(q) ||
                            center.address.toLowerCase().includes(q) ||
                            center.services.some((s) => s.toLowerCase().includes(q));

                          return matchDept && matchType && matchQuery;
                        }).map((center) => (
                          <div
                            key={center.id}
                            className={`transition-all rounded-xl cursor-pointer ${
                              selectedCenterId === center.id
                                ? "ring-2 ring-sana-600 dark:ring-sana-500 scale-[1.01]"
                                : ""
                            }`}
                            onClick={() => setSelectedCenterId(center.id)}
                          >
                            <HealthCenterCard center={center} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "visual-summary" && (
            <div className="animate-fadeIn grid gap-6 md:grid-cols-2">
              <Card className="border-sana-100 dark:border-slate-800 shadow-md bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-sana-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-sana-600 dark:text-sana-400" />
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
                      className="w-full h-40 text-xs border border-sana-200 dark:border-slate-850 rounded-lg p-3 focus:ring-1 focus:ring-sana-500 focus:outline-none bg-card dark:text-slate-200 resize-none"
                      required
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end p-4 border-t bg-sana-50/10 border-border">
                    <Button
                      type="submit"
                      disabled={isGeneratingSummary || !summaryPrompt.trim()}
                      className="bg-sana-600 hover:bg-sana-700 dark:bg-sana-700 dark:hover:bg-sana-600 text-white text-xs font-semibold flex gap-1.5 items-center"
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

              <Card className="border-sana-100 dark:border-slate-800 shadow-md flex flex-col justify-between overflow-hidden min-h-[300px] bg-card">
                <CardHeader className="bg-sana-50/50 dark:bg-slate-900/50 pb-3 border-b border-border">
                  <CardTitle className="text-sm font-bold text-sana-800 dark:text-slate-200">Infografía Resultante</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
                  {isGeneratingSummary ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-8 w-8 text-sana-600 dark:text-sana-500 animate-spin" />
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

      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-[11px] text-muted-foreground bg-white dark:bg-slate-950 border-border mt-auto">
        SanaIA © 2026 — Hecho con ❤️ para Bolivia
      </footer>
    </div>
  );
}
