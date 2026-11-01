import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, ExternalLink, Smartphone, X } from "lucide-react";
import {
  isInstalledPwa,
  nativeInstallAvailable,
  requestNativeInstall,
  subscribeInstallPrompt,
} from "@/shared/pwa/install";

const DISMISS_UNTIL_KEY = "ebd_install_dismiss_until_v1";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function isMobileBrowser(): boolean {
  const ua = navigator.userAgent;
  return /Android|iPhone|iPad|iPod/i.test(ua) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth < 768);
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isInAppBrowser(): boolean {
  return /; wv\)|\bwv\b|Instagram|FBAN|FBAV|GSA\/|Line\/|WhatsApp/i.test(navigator.userAgent);
}

function isSnoozed(): boolean {
  try {
    const until = Number(window.localStorage.getItem(DISMISS_UNTIL_KEY) || "0");
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

function postpone() {
  try {
    window.localStorage.setItem(DISMISS_UNTIL_KEY, String(Date.now() + SEVEN_DAYS));
  } catch {
    // Navegação privada pode bloquear o armazenamento.
  }
}

/**
 * Aparece após entrar no EBD Manager pelo navegador do celular.
 * Nunca aparece ao iniciar pelo ícone instalado; não impede o uso do app.
 */
export function InstallAppModal() {
  const [open, setOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(nativeInstallAvailable);
  const [installing, setInstalling] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isMobileBrowser() || isInstalledPwa() || isSnoozed()) return;
    const timer = window.setTimeout(() => {
      if (!isInstalledPwa() && !isSnoozed()) setOpen(true);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    return subscribeInstallPrompt(() => {
      setNativeAvailable(nativeInstallAvailable());
      if (isInstalledPwa()) setOpen(false);
    });
  }, []);

  function close() {
    postpone();
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const buttons = Array.from(dialogRef.current.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)"
      ));
      if (!buttons.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function install() {
    if (!nativeAvailable) {
      setShowInstructions(true);
      return;
    }
    setInstalling(true);
    const result = await requestNativeInstall();
    setInstalling(false);
    if (result === "accepted") {
      close();
    } else if (result === "unavailable") {
      setShowInstructions(true);
    } else {
      close();
    }
  }

  if (!open || isInstalledPwa()) return null;

  const ios = isIOS();
  const embedded = isInAppBrowser();
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-[3px]"
        onClick={close}
        aria-label="Fechar convite de instalação"
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ebd-install-title"
        aria-describedby="ebd-install-description"
        className="relative w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[28px] border border-slate-100 bg-white p-6 text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 rounded-full p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Agora não"
        >
          <X size={20} />
        </button>
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[22px] bg-blue-50 shadow-inner">
          <img
            src="/icons/ebd-192.png"
            alt=""
            className="h-16 w-16 rounded-2xl object-contain"
          />
        </div>
        <h2 id="ebd-install-title" className="text-2xl font-extrabold tracking-tight text-slate-900">
          Instale o EBD Manager
        </h2>
        <p id="ebd-install-description" className="mt-2 text-sm leading-6 text-slate-600">
          Tenha sua Escola Bíblica na tela inicial do celular e acesse o aplicativo com um toque.
        </p>
        <div className="mt-5 space-y-2 rounded-2xl bg-blue-50/75 p-4 text-left text-sm text-slate-700">
          <p className="flex items-center gap-2"><CheckCircle2 size={18} className="shrink-0 text-emerald-600" /> Acesso rápido às aulas e chamadas</p>
          <p className="flex items-center gap-2"><CheckCircle2 size={18} className="shrink-0 text-emerald-600" /> Abre com aparência de aplicativo</p>
          <p className="flex items-center gap-2"><CheckCircle2 size={18} className="shrink-0 text-emerald-600" /> Instalação gratuita</p>
        </div>

        {!showInstructions ? (
          <button
            type="button"
            onClick={() => void install()}
            disabled={installing}
            autoFocus
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3.5 font-bold text-white shadow-md hover:bg-blue-800 disabled:opacity-60"
          >
            {nativeAvailable ? <Download size={19} /> : <Smartphone size={19} />}
            {installing ? "Abrindo instalação..." : nativeAvailable ? "Instalar agora" : "Como instalar no celular"}
          </button>
        ) : (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-slate-50 p-4 text-left">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <ExternalLink size={16} /> {ios ? "Instalar pelo Safari" : "Instalar pelo Chrome"}
            </h3>
            {ios ? (
              <ol className="list-inside list-decimal space-y-2 text-sm leading-6 text-slate-700">
                <li>Abra este endereço no Safari.</li>
                <li>Toque em Compartilhar.</li>
                <li>Escolha “Adicionar à Tela de Início” e confirme.</li>
              </ol>
            ) : (
              <ol className="list-inside list-decimal space-y-2 text-sm leading-6 text-slate-700">
                {embedded && <li>No menu deste navegador, toque em “Abrir no Chrome”.</li>}
                <li>No Chrome, toque no menu de três pontos (⋮).</li>
                <li>Selecione “Instalar aplicativo” ou “Adicionar à tela inicial”.</li>
                <li>Confirme a instalação.</li>
              </ol>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={close}
          className="mt-3 w-full rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
        >
          {showInstructions ? "Entendi, fazer depois" : "Agora não"}
        </button>
        <p className="mt-1 text-[11px] text-slate-400">Você pode continuar usando pelo navegador normalmente.</p>
      </section>
    </div>
  );
}
