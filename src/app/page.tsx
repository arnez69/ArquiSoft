"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  HeartPulse,
  MapPin,
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
  Moon,
  Download,
  AlertCircle,
  LogOut,
  ChevronLeft,
  MessageCircle,
  Users,
  CheckCircle2,
  PhoneCall,
  Stethoscope,
} from "lucide-react";
import { AgentChatPlaceholder } from "@/components/agent/agent-chat-placeholder";
import { HealthCenterCard } from "@/components/health/health-center-card";
import { MapWrapper } from "@/components/health/map-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { WalletCard } from "@/components/wallet/wallet-card";
import { Input } from "@/components/ui/input";
import type { HealthCenter, BoliviaDepartment, HospitalType } from "@/types/health";
import type { InfographicStyle } from "@/lib/infographic-generator";
import type { VisualSummaryResult } from "@/types/summary";
import { SanaAuthContainer } from "@/components/auth/sana-auth-container";
import { BOLIVIA_HOSPITALS, BOLIVIA_DEPARTMENTS_CONFIG } from "@/data/bolivia-hospitals";

type TopNav = "inicio" | "sobre-nosotros";
type ActiveTab = "home" | "triage" | "wallet" | "health-centers" | "visual-summary";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [topNav, setTopNav] = useState<TopNav>("inicio");
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");

  const [centers] = useState<HealthCenter[]>(BOLIVIA_HOSPITALS);
  const [selectedDepartment, setSelectedDepartment] = useState<BoliviaDepartment | "Todos">("Todos");
  const [selectedHospitalType, setSelectedHospitalType] = useState<HospitalType | "Todos">("Todos");
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Carrusel de fotos que cambia automáticamente cada 2 segundos (2000 ms)
  const [carouselIndex, setCarouselIndex] = useState(0);
  const CAROUSEL_SLIDES = [
    {
      src: "/images/slide1.png",
      alt: "SanaIA Health & Technology Chatbot",
      title: "Inteligencia Artificial Médica",
    },
    {
      src: "/images/slide2.png",
      alt: "Equipo de Especialistas y Médicos",
      title: "Atención Profesional",
    },
    {
      src: "/images/slide3.png",
      alt: "Personal de Salud en Hospital",
      title: "Red Hospitalaria de Bolivia",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Fal.ai state
  const [summaryPrompt, setSummaryPrompt] = useState("");
  const [summaryStyle, setSummaryStyle] = useState<InfographicStyle>("infographic");
  const [visualSummary, setVisualSummary] = useState<VisualSummaryResult | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

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
      setTopNav("inicio");
      setActiveTab("health-centers");
    };

    const handleTriggerWallet = () => {
      setTopNav("inicio");
      setActiveTab("wallet");
    };

    const handleGenerateFalInfo = (e: Event) => {
      const customEvent = e as CustomEvent;
      const promptText = customEvent.detail.prompt;
      setSummaryPrompt(promptText);
      setTopNav("inicio");
      setActiveTab("visual-summary");

      setIsGeneratingSummary(true);
      setVisualSummary(null);
      setSummaryError(null);
      fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          userId: "demo-user",
          style: summaryStyle,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error ?? "Error al generar infografía");
          }
          return res.json();
        })
        .then((data: VisualSummaryResult) => {
          setVisualSummary(data);
        })
        .catch((err: Error) => {
          console.error(err);
          setSummaryError(err.message);
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
  }, [summaryStyle]);

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
    setSummaryError(null);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: summaryPrompt,
          userId: "demo-user",
          style: summaryStyle,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Error al generar resumen visual");
      }

      const data = (await res.json()) as VisualSummaryResult;
      setVisualSummary(data);
    } catch (err) {
      console.error(err);
      setSummaryError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleDownloadInfographic = () => {
    if (!visualSummary?.imageUrl) return;
    const link = document.createElement("a");
    link.href = visualSummary.imageUrl;
    link.download = `sanaia-infografia-${Date.now()}.svg`;
    if (visualSummary.imageUrl.startsWith("http")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    link.click();
  };

  const STYLE_OPTIONS: { value: InfographicStyle; label: string }[] = [
    { value: "infographic", label: "Infografía" },
    { value: "diagram", label: "Diagrama" },
    { value: "chart", label: "Gráfico" },
  ];

  const workspaceMenuItems = [
    {
      id: "triage" as ActiveTab,
      icon: HeartPulse,
      title: "Triage inteligente",
      description: "Agente Zavu evalúa síntomas y prioriza atención médica.",
    },
    {
      id: "wallet" as ActiveTab,
      icon: Shield,
      title: "Billetera de emergencias",
      description: "Fondos listos para pagos médicos urgentes vía Wallbit.",
    },
    {
      id: "health-centers" as ActiveTab,
      icon: MapPin,
      title: "Centros de salud",
      description: "Disponibilidad de clínicas con GPS en 9 departamentos de Bolivia.",
    },
    {
      id: "visual-summary" as ActiveTab,
      icon: Sparkles,
      title: "Resúmenes visuales",
      description: "Infografías médicas autogeneradas con fal.ai.",
    },
  ];

  if (!isAuthenticated) {
    return (
      <SanaAuthContainer
        onAuthenticated={() => setIsAuthenticated(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  const isWorkspaceView = activeTab !== "home" && topNav === "inicio";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-950 dark:to-slate-900 text-foreground flex flex-col transition-colors duration-300">
      {/* Header Superior Dinámico */}
      <header className="sticky top-0 z-40 border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-xs border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="flex items-center gap-2 cursor-pointer shrink-0"
              onClick={() => {
                setTopNav("inicio");
                setActiveTab("home");
              }}
            >
              <Activity className="h-8 w-8 text-sana-600 dark:text-sana-400" />
              <div>
                <h1 className="text-xl font-bold text-sana-800 dark:text-sana-100 tracking-tight">SanaIA</h1>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Health & Technology Bolivia 2026
                </p>
              </div>
            </div>

            {/* Pestañas superiores en pantalla de Inicio / Sobre Nosotros */}
            {!isWorkspaceView ? (
              <nav className="ml-8 flex items-center gap-2">
                <button
                  onClick={() => {
                    setTopNav("inicio");
                    setActiveTab("home");
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    topNav === "inicio" && activeTab === "home"
                      ? "bg-sana-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Inicio
                </button>
                <button
                  onClick={() => {
                    setTopNav("sobre-nosotros");
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    topNav === "sobre-nosotros"
                      ? "bg-sana-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Sobre nosotros
                </button>
              </nav>
            ) : (
              /* En la pantalla del Workspace (IA), se muestran las 4 pestañas ordenadas horizontalmente en una sola línea */
              <nav className="ml-4 flex items-center gap-2 flex-nowrap whitespace-nowrap overflow-x-auto">
                {workspaceMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                        isActive
                          ? "bg-sana-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.title}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAuthenticated(false)}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:bg-red-50 border-red-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      {/* CONTENIDO DE LA PÁGINA */}
      <main className="flex-1 w-full">
        {/* VISTA 1: INICIO (PANTALLA DE BIENVENIDA CON BANNER ESTILO CLÍNICA FOIANINI Y CARRUSEL DE 2s) */}
        {topNav === "inicio" && activeTab === "home" && (
          <div className="animate-fadeIn">
            {/* HERO BANNER ESTILO CLÍNICA FOIANINI CON GRADIENTE Y CARRUSEL AUTOMÁTICO CADA 2 SEG */}
            <div className="relative bg-gradient-to-r from-sana-700 via-sana-800 to-slate-900 text-white py-12 px-4 sm:px-8 overflow-hidden shadow-lg border-b border-sana-800">
              <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* LADO IZQUIERDO: TÍTULO PRINCIPAL Y PUNTOS */}
                <div className="lg:col-span-6 space-y-6 z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sana-500/30 border border-sana-400/30 text-xs font-semibold text-sana-100">
                    <Stethoscope className="h-3.5 w-3.5 text-sana-300" />
                    Plataforma Médica Integrada 2026
                  </div>

                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                    SanaIA
                  </h1>

                  <ul className="space-y-3 text-sm sm:text-base font-semibold text-sana-100">
                    <li className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sana-400 shadow-xs" />
                      Triage inteligente
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sana-400 shadow-xs" />
                      Billetera de emergencias
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sana-400 shadow-xs" />
                      Centros de salud
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sana-400 shadow-xs" />
                      Resúmenes activos
                    </li>
                  </ul>
                </div>

                {/* LADO DERECHO: CARRUSEL ROTATIVO AUTOMÁTICO CADA 2 SEGUNDOS */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
                  <div className="relative w-full max-w-md h-72 sm:h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 bg-slate-900 group">
                    {CAROUSEL_SLIDES.map((slide, idx) => (
                      <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                          idx === carouselIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slide.src}
                          alt={slide.alt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                          <p className="text-white text-xs font-bold drop-shadow-md">
                            {slide.title}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Indicadores de diapositiva (Puntos) */}
                    <div className="absolute bottom-3 right-3 z-20 flex gap-1.5">
                      {CAROUSEL_SLIDES.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCarouselIndex(idx)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            idx === carouselIndex
                              ? "bg-white w-6"
                              : "bg-white/50 hover:bg-white/80"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN INFERIOR CON UN ÚNICO BOTÓN PRINCIPAL: "Dime, ¿qué tienes?" */}
            <div className="mx-auto max-w-7xl px-4 py-16 text-center space-y-8">
              <div className="max-w-xl mx-auto space-y-3">
                <h2 className="text-2xl font-black text-slate-850 dark:text-slate-100">
                  ¿Necesitas orientación médica rápida?
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Haz clic en el botón a continuación para abrir nuestro Asistente Clínico Inteligente SanaIA y consultar síntomas o buscar hospitales.
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    setTopNav("inicio");
                    setActiveTab("triage");
                  }}
                  className="bg-sana-600 hover:bg-sana-700 dark:bg-sana-700 dark:hover:bg-sana-600 text-white font-extrabold text-lg px-10 py-7 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 border-2 border-sana-400/30"
                >
                  <MessageCircle className="h-6 w-6 animate-pulse" />
                  Dime, ¿qué tienes?
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 2: SOBRE NOSOTROS */}
        {topNav === "sobre-nosotros" && (
          <div className="animate-fadeIn mx-auto max-w-7xl px-4 py-10 sm:px-6 space-y-8">
            <Card className="border-sana-100 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
              <div className="bg-gradient-to-r from-sana-700 to-sana-850 p-8 text-white">
                <h2 className="text-3xl font-extrabold flex items-center gap-3">
                  <Users className="h-8 w-8 text-sana-300" />
                  Sobre SanaIA
                </h2>
                <p className="text-sana-100 text-sm mt-2 max-w-2xl leading-relaxed">
                  Plataforma médica de salud inteligente diseñada para conectar asistencia clínica conversacional, financiamiento rápido y disponibilidad geográfica de hospitales en Bolivia.
                </p>
              </div>

              <CardContent className="p-8 space-y-8">
                <div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-sana-600" />
                    Nuestros Servicios Integrados
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-xl border border-sana-100 dark:border-slate-800 bg-sana-50/20 dark:bg-slate-950/40 space-y-1">
                      <h4 className="text-xs font-bold text-sana-700 dark:text-sana-400">1. Triage Inteligente (Zavu Agent)</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Evaluación médica conversacional para catalogar síntomas en niveles de urgencia y generar reportes.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-sana-100 dark:border-slate-800 bg-sana-50/20 dark:bg-slate-950/40 space-y-1">
                      <h4 className="text-xs font-bold text-sana-700 dark:text-sana-400">2. Billetera de Emergencia (Wallbit)</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Pasarela virtual con saldo instantáneo en bolivianos (BOB) para pagos urgentes de atención de salud.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-sana-100 dark:border-slate-800 bg-sana-50/20 dark:bg-slate-950/40 space-y-1">
                      <h4 className="text-xs font-bold text-sana-700 dark:text-sana-400">3. Centros de Salud en 9 Departamentos</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Mapa GPS interactivo de Bolivia con estado de ocupación de hospitales públicos, privados y CNS.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-sana-100 dark:border-slate-800 bg-sana-50/20 dark:bg-slate-950/40 space-y-1">
                      <h4 className="text-xs font-bold text-sana-700 dark:text-sana-400">4. Infografías Médicas (fal.ai)</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Resúmenes visuales autogenerados para facilitar la explicación al médico o al familiar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider mb-3">
                    Tecnologías Utilizadas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Next.js 14 App Router",
                      "TypeScript",
                      "Tailwind CSS",
                      "Supabase Database & Auth",
                      "Zavu Medical AI SDK",
                      "Wallbit Payments API",
                      "Leaflet OpenStreetMap GPS",
                      "fal.ai Infographic Generation",
                    ].map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 px-3 py-1"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VISTA 3: PANTALLA DE LA IA / WORKSPACE INTEGRADO */}
        {isWorkspaceView && (
          <div className="animate-fadeIn mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-4">
            {/* Barra superior para regresar fácilmente al Inicio */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("home")}
                className="text-xs font-bold text-sana-700 dark:text-sana-400 hover:bg-sana-50 dark:hover:bg-slate-900 flex items-center gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Volver al Portal Principal
              </Button>
              <span className="text-xs font-bold text-muted-foreground">
                Workspace de Inteligencia Artificial SanaIA
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-4 items-start">
              {/* LADO IZQUIERDO: SERVICIOS ACTIVOS (Sin las tarjetas duplicadas) */}
              <section className="space-y-3 lg:order-1 order-2">
                {/* Tarjeta de SERVICIOS ACTIVOS */}
                <Card className="shadow-xs border-sana-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider">
                      SERVICIOS ACTIVOS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2 text-[10px]">
                    {[
                      { name: "Supabase DB", status: "green" },
                      { name: "Zavu SDK", status: "yellow" },
                      { name: "Wallbit Payments", status: "yellow" },
                      { name: "ElevenLabs (Voz)", status: "yellow" },
                      { name: "Firecrawl Scraper", status: "yellow" },
                      { name: "Exa Search", status: "yellow" },
                      { name: "fal.ai Infographics", status: "yellow" },
                    ].map((service) => (
                      <div key={service.name} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-slate-300 font-medium">{service.name}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            service.status === "green" ? "bg-emerald-500" : "bg-amber-400"
                          }`}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>

              {/* LADO DERECHO: Área principal del Workspace (Triage, Billetera, Centros o Infografías) */}
              <section className="lg:col-span-3 space-y-6 lg:order-2 order-1">
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
                    <Card className="shadow-md border-sana-100 dark:border-slate-800 h-fit bg-card rounded-2xl">
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
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Inmediata (1-2s)</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === "health-centers" && (
                  <div className="animate-fadeIn space-y-4">
                    <Card className="border-sana-100 dark:border-slate-800 shadow-md bg-card rounded-2xl">
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

                        {/* Selector de Departamentos */}
                        <div className="mt-4 space-y-3">
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
                    <Card className="border-sana-100 dark:border-slate-800 shadow-md bg-card rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold text-sana-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Sparkles className="h-4.5 w-4.5 text-sana-600 dark:text-sana-400" />
                          Generador de Infografías
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Genera resúmenes visuales de triage médico con fal.ai
                        </CardDescription>
                      </CardHeader>
                      <form onSubmit={handleGenerateSummary}>
                        <CardContent className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {STYLE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setSummaryStyle(opt.value)}
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors ${
                                  summaryStyle === opt.value
                                    ? "bg-sana-600 text-white border-sana-600"
                                    : "bg-white dark:bg-slate-900 text-muted-foreground border-sana-200 dark:border-slate-700 hover:border-sana-400"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            placeholder="Ej: Paciente masculino de 45 años ingresa con presión arterial alta (140/90) y cefalea intensa. Triage clasificado como Código Amarillo: se recomienda evaluación médica y reposo."
                            value={summaryPrompt}
                            onChange={(e) => setSummaryPrompt(e.target.value)}
                            className="w-full h-40 text-xs border border-sana-200 dark:border-slate-850 rounded-lg p-3 focus:ring-1 focus:ring-sana-500 focus:outline-none bg-card dark:text-slate-200 resize-none"
                            required
                          />
                          {summaryError && (
                            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3 text-xs text-red-700 dark:text-red-400">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              {summaryError}
                            </div>
                          )}
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

                    <Card className="border-sana-100 dark:border-slate-800 shadow-md flex flex-col justify-between overflow-hidden min-h-[300px] bg-card rounded-2xl">
                      <CardHeader className="bg-sana-50/50 dark:bg-slate-900/50 pb-3 border-b border-border flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold text-sana-800 dark:text-slate-200">Infografía Resultante</CardTitle>
                        {visualSummary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadInfographic}
                            className="text-xs h-7 gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Descargar
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
                        {isGeneratingSummary ? (
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="h-8 w-8 text-sana-600 dark:text-sana-500 animate-spin" />
                            <p className="text-[11px] text-muted-foreground animate-pulse font-semibold">
                              Generando infografía médica...
                            </p>
                          </div>
                        ) : visualSummary ? (
                          <div className="w-full space-y-3">
                            <div className="relative w-full flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={visualSummary.imageUrl}
                                alt="Infografía Médica SanaIA"
                                className="rounded-lg w-full max-h-[280px] object-contain shadow-md border border-sana-100 dark:border-slate-800"
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                              <span>
                                Fuente:{" "}
                                <span className="font-semibold text-sana-600 dark:text-sana-400">
                                  {visualSummary.source === "fal.ai" ? "fal.ai" : "Generador SanaIA"}
                                </span>
                              </span>
                              <span>
                                {new Date(visualSummary.generatedAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center space-y-2">
                            <ImageIcon className="h-10 w-10 text-muted-foreground/60 mx-auto" />
                            <p className="text-xs text-muted-foreground max-w-[240px]">
                              Escribe el triage clínico en el panel izquierdo y haz clic en &quot;Generar Infografía&quot; para visualizar.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-[11px] text-muted-foreground bg-white dark:bg-slate-950 border-border mt-auto">
        SanaIA © 2026 — Health & Technology Bolivia
      </footer>
    </div>
  );
}
