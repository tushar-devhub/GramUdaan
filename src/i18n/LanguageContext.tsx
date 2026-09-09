import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { en, type TranslationKey } from "./translations/en";
import { hi } from "./translations/hi";

export type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, paramsOrFallback?: Record<string, string | number> | string) => string;
}

const STORAGE_KEY = "gramudaan_language_preference";

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "hi" || saved === "en") return saved;
    } catch {
      // Ignore localStorage errors
    }
    return "hi"; // Default to Hindi for rural entrepreneur focus
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore localStorage errors
    }
  };

  const t = (key: TranslationKey, paramsOrFallback?: Record<string, string | number> | string): string => {
    const dict = language === "hi" ? hi : en;
    let str = dict[key] || en[key] || (typeof paramsOrFallback === "string" ? paramsOrFallback : key);
    if (paramsOrFallback && typeof paramsOrFallback === "object") {
      Object.entries(paramsOrFallback).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: "hi" as Language,
      setLanguage: () => {},
      t: (key: TranslationKey, paramsOrFallback?: Record<string, string | number> | string) => {
        let str = hi[key] || en[key] || (typeof paramsOrFallback === "string" ? paramsOrFallback : key);
        if (paramsOrFallback && typeof paramsOrFallback === "object") {
          Object.entries(paramsOrFallback).forEach(([k, v]) => {
            str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
          });
        }
        return str;
      },
    };
  }
  return context;
}
