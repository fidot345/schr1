import { LogoMark } from "@/components/ui/Logo";

const ADMIN_ALT = "Schreinerei Tannrieder";

/** Login page logo, wired in payload.config.ts → admin.components.graphics.Logo. */
export function AdminLogo() {
  return <LogoMark size={96} alt={ADMIN_ALT} />;
}

/** Navigation icon, wired in payload.config.ts → admin.components.graphics.Icon. */
export function AdminIcon() {
  return <LogoMark size={24} alt={ADMIN_ALT} />;
}
