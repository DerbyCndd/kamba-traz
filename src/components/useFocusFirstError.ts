"use client";
import { useEffect } from "react";

/** Depois de um envio com erros, leva o foco ao primeiro campo inválido (marcado com aria-invalid). */
export function useFocusFirstError(errors: Record<string, string>) {
  useEffect(() => {
    if (!Object.keys(errors).length) return;
    document.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus();
  }, [errors]);
}
