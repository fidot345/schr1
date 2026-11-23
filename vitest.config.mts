import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // No test sends a real mail; tests of Resend replace the package.
    env: { MAIL_TRANSPORT: "log" },
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
});
