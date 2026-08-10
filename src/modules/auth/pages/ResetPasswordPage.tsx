import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { supabase } from "@/shared/lib/supabase/client";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";

export function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function verificarSessao() {
  console.log("=== VERIFICANDO RECOVERY ===");
  console.log("URL:", window.location.href);
  console.log("HASH:", window.location.hash);
  console.log("SEARCH:", window.location.search);

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  console.log("SESSION:", session);
  console.log("SESSION ERROR:", error);

  if (session && ativo) {
    console.log("RECOVERY SESSION ENCONTRADA");
    setRecoveryReady(true);
  } else {
    console.log("NENHUMA SESSION DE RECOVERY");
  }
}

    verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AUTH EVENT:", event);

      if (event === "PASSWORD_RECOVERY" && session) {
        setRecoveryReady(true);
      }
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleReset() {
    if (!recoveryReady) {
      toast.error(
        "A sessão de recuperação ainda não foi carregada. Abra novamente o link recebido por e-mail."
      );
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error(error.message);
      return;
    }

    toast.success("Senha alterada com sucesso.");

    await supabase.auth.signOut();

    navigate("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md space-y-6">
        <h1 className="text-center text-2xl font-bold text-blue-600">
          Nova Senha
        </h1>

        <Input
          type="password"
          placeholder="Nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Input
          type="password"
          placeholder="Confirmar senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button
          onClick={handleReset}
          disabled={loading || !recoveryReady}
        >
          {loading
            ? "Salvando..."
            : !recoveryReady
              ? "Validando link..."
              : "Alterar senha"}
        </Button>
      </Card>
    </div>
  );
}