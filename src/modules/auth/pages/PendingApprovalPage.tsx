import { Clock3, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/AuthService";
import { toast } from "sonner";

export function PendingApprovalPage() {
  const navigate = useNavigate();

  async function handleLogout() {
    await AuthService.logout();

    toast.success("Sessão encerrada com sucesso.");

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-lg sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Clock3 className="h-8 w-8 text-amber-600" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-800">
          Cadastro em análise
        </h1>

        <p className="mt-3 leading-relaxed text-slate-500">
          Sua conta foi criada com sucesso e está aguardando a aprovação
          de um administrador.
        </p>

        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Assim que sua conta for aprovada, você poderá acessar o
          sistema normalmente.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}