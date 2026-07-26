"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SanaAuthContainer } from "@/components/auth/sana-auth-container";

export default function RegisterPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleAuthenticated = () => {
    router.push("/");
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <SanaAuthContainer
      onAuthenticated={handleAuthenticated}
      isDarkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
    />
  );
}
