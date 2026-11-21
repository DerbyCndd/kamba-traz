import { defineConfig } from "vitest/config";
import path from "node:path";

// Testes das regras que não podem partir sem ninguém ver: moedas, limites da alfândega, filtro de contactos.
export default defineConfig({
  test: { include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
});
