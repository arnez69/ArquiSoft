"use client";

import { useState } from "react";
import { HeartPulse, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SanaLoginViewProps {
  onLoginSuccess: () => void;
  onGoToRegister: () => void;
  onGoToForgotPassword: () => void;
  isDarkMode?: boolean;
}

export function SanaLoginView({
  onLoginSuccess,
  onGoToRegister,
  onGoToForgotPassword,
  isDarkMode = false,
}: SanaLoginViewProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier || !password) {
      setError("Por favor ingresa tu correo/número y contraseña.");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      onLoginSuccess();
    } catch {
      setError("Credenciales incorrectas. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* LEFT COLUMN: Minimalist Centered Identity */}
      <div className="lg:col-span-7 space-y-8 text-center flex flex-col items-center justify-center py-4 px-2 lg:px-4">
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/30">
            <HeartPulse className="h-8 w-8 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-400"></span>
            </span>
          </div>
          <div className="text-center sm:text-left">
            <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              SanaIA
            </h1>
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-teal-500">
              SISTEMA MÉDICO INTEGRADO • ARQUISOFT
            </p>
          </div>
        </div>

        {/* Minimalist Title & Core Statement */}
        <div className="space-y-4 max-w-lg mx-auto">
          <h2 className={`text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold leading-tight tracking-tight text-center ${
            isDarkMode ? "text-slate-100" : "text-gray-900"
          }`}>
            Asistencia médica digital con <span className="text-teal-500">Inteligencia Artificial</span>.
          </h2>
          <p className={`text-sm sm:text-base leading-relaxed text-center ${
            isDarkMode ? "text-slate-400" : "text-gray-600"
          }`}>
            Plataforma inteligente diseñada para la evaluación clínica continua, triaje de síntomas y gestión de emergencias en salud.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean Login Card Container */}
      <div className="lg:col-span-5 w-full">
        <div className={`rounded-3xl p-7 shadow-xl border space-y-6 transition ${
          isDarkMode
            ? "bg-[#111C2E] border-[#1F2E48] shadow-black/40"
            : "bg-white border-teal-100 shadow-teal-950/5"
        }`}>
          <div className="space-y-1">
            <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Iniciar sesión en SanaIA
            </h2>
            <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
              Ingresa tus credenciales para acceder a tu portal médico
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-medium text-red-400 bg-red-950/40 border border-red-800/60 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
                Correo electrónico o número de celular
              </label>
              <Input
                type="text"
                placeholder="ejemplo@sanaia.bo o 70000000"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={`rounded-xl py-5 text-sm transition ${
                  isDarkMode 
                    ? "bg-[#070C14] border-[#1F2E48] text-white placeholder:text-slate-500 focus-visible:ring-teal-500" 
                    : "border-gray-200 focus-visible:ring-teal-600"
                }`}
                required
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
                Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`rounded-xl py-5 text-sm pr-10 transition ${
                    isDarkMode 
                      ? "bg-[#070C14] border-[#1F2E48] text-white placeholder:text-slate-500 focus-visible:ring-teal-500" 
                      : "border-gray-200 focus-visible:ring-teal-600"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full py-5 text-sm font-semibold shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onGoToForgotPassword}
                className="text-xs font-semibold text-teal-500 hover:text-teal-400 transition hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDarkMode ? "border-[#1F2E48]" : "border-gray-200"}`} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className={`px-2 ${isDarkMode ? "bg-[#111C2E] text-slate-500" : "bg-white text-gray-400"}`}>
                  o
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onGoToRegister}
              className={`w-full rounded-full py-5 text-sm font-semibold transition ${
                isDarkMode 
                  ? "border-teal-500 text-teal-400 hover:bg-teal-950/40" 
                  : "border-teal-600 text-teal-700 hover:bg-teal-50"
              }`}
            >
              Crear cuenta nueva
            </Button>
          </form>
        </div>

        {/* Footer branding */}
        <p className={`text-center text-xs mt-4 font-medium ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
          SanaAI 2026 - Arquisoft
        </p>
      </div>
    </div>
  );
}
