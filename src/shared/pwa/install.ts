// Listener global: captura o convite nativo antes mesmo do usuário concluir o login.
// beforeinstallprompt é suportado por navegadores Chromium, não pelo Safari.
export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};

let pendingPrompt: InstallPromptEvent | null = null;
let installedInSession = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event: Event) => {
    event.preventDefault();
    pendingPrompt = event as InstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    pendingPrompt = null;
    installedInSession = true;
    notify();
  });
}

export function isInstalledPwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return installedInSession ||
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches;
}

export function nativeInstallAvailable(): boolean {
  return !!pendingPrompt && !isInstalledPwa();
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function requestNativeInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const event = pendingPrompt;
  if (!event || isInstalledPwa()) return "unavailable";
  pendingPrompt = null;
  notify();
  try {
    await event.prompt();
    const choice = await event.userChoice;
    return choice.outcome === "accepted" ? "accepted" : "dismissed";
  } catch (error) {
    console.warn("[EBD PWA] Instalação nativa indisponível", error);
    return "unavailable";
  }
}
