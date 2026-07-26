"use client";

import { useState } from "react";
import { SanaLoginView } from "./sana-login-view";
import { SanaForgotPasswordView } from "./sana-forgot-password-view";
import { SanaRegisterView } from "./sana-register-view";
import { Moon, Sun, ShieldCheck } from "lucide-react";

export type AuthScreenMode = "login" | "forgot-password" | "register";

interface SanaAuthContainerProps {
  onAuthenticated: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function SanaAuthContainer({
  onAuthenticated,
  isDarkMode,
  onToggleDarkMode,
}: SanaAuthContainerProps) {
  const [currentScreen, setCurrentScreen] = useState<AuthScreenMode>("login");

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 flex flex-col justify-between p-4 sm:p-6 font-sans ${
      isDarkMode 
        ? "bg-[#070C14] text-slate-100" 
        : "bg-gradient-to-br from-teal-50/50 via-slate-50 to-emerald-50/40 text-gray-900"
    }`}>
      {/* TOP BAR: Dark Mode toggle & status */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2 px-2">
        <div className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition ${
          isDarkMode 
            ? "bg-teal-950/60 border-teal-800/60 text-teal-300" 
            : "bg-teal-50 border-teal-200/80 text-teal-800"
        }`}>
          <ShieldCheck className="h-4 w-4 text-teal-500" />
          <span>Acceso Seguro SanaIA PWA 2026</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDarkMode}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold shadow-sm transition ${
              isDarkMode 
                ? "bg-[#111C2E] border-[#1F2E48] text-slate-200 hover:bg-[#1A2840]" 
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {isDarkMode ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                Modo Claro
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-teal-700" />
                Modo Oscuro
              </>
            )}
          </button>
        </div>
      </header>

      {/* CENTER CONTENT SCREEN */}
      <main className="w-full flex items-center justify-center my-auto py-6">
        {currentScreen === "login" && (
          <SanaLoginView
            onLoginSuccess={onAuthenticated}
            onGoToRegister={() => setCurrentScreen("register")}
            onGoToForgotPassword={() => setCurrentScreen("forgot-password")}
            isDarkMode={isDarkMode}
          />
        )}

        {currentScreen === "forgot-password" && (
          <SanaForgotPasswordView
            onBackToLogin={() => setCurrentScreen("login")}
            isDarkMode={isDarkMode}
          />
        )}

        {currentScreen === "register" && (
          <SanaRegisterView
            onBackToLogin={() => setCurrentScreen("login")}
            onRegisterSuccess={onAuthenticated}
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className={`w-full max-w-6xl mx-auto py-4 text-center border-t text-xs flex items-center justify-center transition ${
        isDarkMode 
          ? "border-[#1F2E48] text-slate-400" 
          : "border-teal-100/80 text-gray-500"
      }`}>
        <div>
          <span>SanaAI 2026 - Arquisoft</span>
        </div>
      </footer>
    </div>
  );
}
