"use client";

import { useState } from "react";
import { Activity, ArrowLeft, HelpCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SanaRegisterViewProps {
  onBackToLogin: () => void;
  onRegisterSuccess: () => void;
  isDarkMode?: boolean;
}

export function SanaRegisterView({
  onBackToLogin,
  onRegisterSuccess,
  isDarkMode = false,
}: SanaRegisterViewProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 90 }, (_, i) => (currentYear - i).toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !identifier || !password) {
      setError("Por favor completa los campos requeridos.");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      onRegisterSuccess();
    } catch {
      setError("Ocurrió un error al registrar tu cuenta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-lg rounded-3xl p-7 shadow-xl border space-y-6 transition ${
      isDarkMode 
        ? "bg-[#111C2E] border-[#1F2E48] text-slate-100 shadow-black/40" 
        : "bg-white border-teal-100 text-gray-900 shadow-teal-950/5"
    }`}>
      {/* Header bar with back icon & SanaIA brand */}
      <div className={`flex items-center justify-between border-b pb-3 ${
        isDarkMode ? "border-[#1F2E48]" : "border-gray-100"
      }`}>
        <button
          type="button"
          onClick={onBackToLogin}
          className={`flex items-center gap-1 text-xs font-semibold transition ${
            isDarkMode ? "text-slate-400 hover:text-teal-400" : "text-gray-500 hover:text-teal-700"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Activity className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">SanaIA</span>
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-1.5 text-left">
        <h2 className="text-2xl font-extrabold tracking-tight leading-tight">
          Empieza a usar SanaIA con una cuenta médica
        </h2>
        <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
          Con tu cuenta de SanaIA puedes acceder a asistencia médica conversacional, triage con IA y billetera de emergencias.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <div className="p-3 text-xs font-medium text-red-400 bg-red-950/40 border border-red-800/60 rounded-xl">
            {error}
          </div>
        )}

        {/* Nombre & Apellido */}
        <div className="space-y-1">
          <label className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
            Nombre completo
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="text"
              placeholder="Ej. María"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`rounded-xl py-4 text-sm transition ${
                isDarkMode
                  ? "bg-[#070C14] border-[#1F2E48] text-white placeholder:text-slate-500 focus-visible:ring-teal-500"
                  : "border-gray-200 placeholder:text-gray-400 focus-visible:ring-teal-600"
              }`}
              required
            />
            <Input
              type="text"
              placeholder="Ej. Mamani"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`rounded-xl py-4 text-sm transition ${
                isDarkMode
                  ? "bg-[#070C14] border-[#1F2E48] text-white placeholder:text-slate-500 focus-visible:ring-teal-500"
                  : "border-gray-200 placeholder:text-gray-400 focus-visible:ring-teal-600"
              }`}
              required
            />
          </div>
        </div>

        {/* Fecha de nacimiento */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <label className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
              Fecha de nacimiento
            </label>
            <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 transition ${
                isDarkMode
                  ? "bg-[#070C14] border-[#1F2E48] text-slate-200"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <option value="">Día</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 transition ${
                isDarkMode
                  ? "bg-[#070C14] border-[#1F2E48] text-slate-200"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <option value="">Mes</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 transition ${
                isDarkMode
                  ? "bg-[#070C14] border-[#1F2E48] text-slate-200"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <option value="">Año</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Género */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <label className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
              Género
            </label>
            <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
          </div>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={`w-full rounded-xl border px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 transition ${
              isDarkMode
                ? "bg-[#070C14] border-[#1F2E48] text-slate-200"
                : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            <option value="">Selecciona tu género</option>
            <option value="femenino">Femenino</option>
            <option value="masculino">Masculino</option>
            <option value="otro">Otro</option>
            <option value="no_decir">Prefiero no decir</option>
          </select>
        </div>

        {/* Número de celular o correo electrónico */}
        <div className="space-y-1">
          <label className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
            Número de celular o correo electrónico
          </label>
          <Input
            type="text"
            placeholder="Ej. maria.mamani@sanaia.bo o 70123456"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={`rounded-xl py-4 text-sm transition ${
              isDarkMode
                ? "bg-[#070C14] border-[#1F2E48] text-white placeholder:text-slate-500 focus-visible:ring-teal-500"
                : "border-gray-200 placeholder:text-gray-400 focus-visible:ring-teal-600"
            }`}
            required
          />
          <p className={`text-[11px] pt-0.5 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
            Es posible que te enviemos notificaciones.{" "}
            <a href="#info" className="text-teal-500 hover:underline font-medium">
              Por qué solicitamos tu información de contacto
            </a>
          </p>
        </div>

        {/* Contraseña */}
        <div className="space-y-1">
          <label className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
            Contraseña
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Crea tu contraseña segura"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`rounded-xl py-4 text-sm pr-10 transition ${
                isDarkMode
                  ? "bg-[#070C14] border-[#1F2E48] text-white placeholder:text-slate-500 focus-visible:ring-teal-500"
                  : "border-gray-200 placeholder:text-gray-400 focus-visible:ring-teal-600"
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

        {/* Legal Disclaimer */}
        <div className={`text-[11px] space-y-1.5 pt-1 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
          <p>
            Al hacer clic en &quot;Enviar&quot;, aceptas crear una cuenta médica en SanaIA y estás de acuerdo con nuestras{" "}
            <a href="#terms" className="text-teal-500 hover:underline font-medium">
              Condiciones de Servicio
            </a>{" "}
            y{" "}
            <a href="#privacy" className="text-teal-500 hover:underline font-medium">
              Política de Privacidad de Datos Médicos
            </a>.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5 pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full py-5 text-sm font-semibold shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Enviar"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onBackToLogin}
            className={`w-full rounded-full py-5 text-sm font-semibold transition ${
              isDarkMode
                ? "border-teal-500 text-teal-400 hover:bg-teal-950/40"
                : "border-teal-600 text-teal-700 hover:bg-teal-50"
            }`}
          >
            Ya tengo una cuenta
          </Button>
        </div>
      </form>
    </div>
  );
}
