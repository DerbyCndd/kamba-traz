import { defineConfig } from "vitest/config";
import path from "node:path";

// Testes das regras que não podem partir sem ninguém ver: moedas, limites da alfândega, filtro de contactos.
export default defineConfig({
  test: { include: ["src/**/*.test.ts"] },
  // "server-only" só existe para o Next: nos testes é um módulo vazio.
  resolve: { alias: { "@": path.resolve(process.cwd(), "src"), "server-only": path.resolve(process.cwd(), "src/test/server-only.ts") } },
});
