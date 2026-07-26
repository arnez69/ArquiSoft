"use client";

import { useState } from "react";
import { Activity, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SanaForgotPasswordViewProps {
  onBackToLogin: () => void;
  isDarkMode?: boolean;
}

export function SanaForgotPasswordView({
  onBackToLogin,
  isDarkMode = false,
}: SanaForgotPasswordViewProps) {
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier) {
      setError("Por favor ingresa tu número de celular o correo electrónico.");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSuccess(true);
    } catch {
      setError("No pudimos encontrar una cuenta con esos datos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-md rounded-3xl p-8 shadow-xl border space-y-6 transition ${
      isDarkMode 
        ? "bg-[#111C2E] border-[#1F2E48] text-slate-100 shadow-black/40" 
        : "bg-white border-teal-100 text-gray-900 shadow-teal-950/5"
    }`}>
      {/* Header with logo & back button */}
      <div className={`flex items-center justify-between border-b pb-4 ${
        isDarkMode ? "border-[#1F2E48]" : "border-gray-100"
      }`}>
        <button
          type="button"
          onClick={onBackToLogin}
          className={`flex items-center gap-1.5 text-xs font-semibold transition ${
            isDarkMode ? "text-slate-400 hover:text-teal-400" : "text-gray-500 hover:text-teal-700"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Activity className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">SanaIA</span>
        </div>
      </div>

      {!isSuccess ? (
        <div className="space-y-6">
          <div className="space-y-2 text-left">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Encuentra tu cuenta
            </h2>
            <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
              Ingresa tu celular o correo electrónico asociado a tu cuenta de SanaIA para restablecer tu acceso.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-xs font-medium text-red-400 bg-red-950/40 border border-red-800/60 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
                Número de celular o correo electrónico
              </label>
              <Input
                type="text"
                placeholder="Ej. maria@sanaia.bo o 70123456"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={`rounded-2xl py-6 text-sm px-4 transition ${
                  isDarkMode
                    ? "bg-[#070C14] border-[#1F2E48] text-white placeholder:text-slate-500 focus-visible:ring-teal-500"
                    : "border-gray-200 placeholder:text-gray-400 focus-visible:ring-teal-600"
                }`}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full py-5 text-sm font-semibold shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando cuenta...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/20 text-teal-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Instrucciones enviadas</h3>
            <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
              Hemos enviado las instrucciones a <strong>{identifier}</strong>. Revisa tus mensajes.
            </p>
          </div>
          <Button
            type="button"
            onClick={onBackToLogin}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full py-5 text-sm font-semibold"
          >
            Regresar al Inicio de Sesión
          </Button>
        </div>
      )}

      {/* Footer info */}
      <p className={`text-center text-[11px] font-medium ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
        SanaAI 2026 - Arquisoft
      </p>
    </div>
  );
}
