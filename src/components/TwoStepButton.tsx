"use client";
import { useEffect, useRef, useState, useTransition } from "react";

/** Botão que pede uma segunda confirmação antes de executar a acção (Server Action). */
export function TwoStepButton({ label, action, className = "danger" }: {
  label: string; action: () => Promise<unknown>; className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      className={"btn small " + className}
      disabled={pending}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          timer.current = setTimeout(() => setArmed(false), 3500);
        } else {
          clearTimeout(timer.current);
          setArmed(false);
          start(async () => { await action(); });
        }
      }}
    >
      {pending ? "A processar…" : armed ? "Confirmar?" : label}
    </button>
  );
}
