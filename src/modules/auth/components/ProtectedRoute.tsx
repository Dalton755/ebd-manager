import { Navigate, useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

type Props = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: Props) {
  const {
    user,
    pessoa,
    senhaTemporaria,
    loading,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <LoadingSpinner text="Verificando acesso..." />
    );
  }

  if (!user) {
  return <Navigate to="/login" replace />;
}

if (!pessoa) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

        <h1 className="text-xl font-bold text-slate-800">
          Não foi possível carregar seu cadastro
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Sua conta foi autenticada, mas não encontramos um cadastro
          vinculado a este usuário.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Sair da conta
        </button>

      </div>
    </div>
  );
}

if (pessoa.status === "PENDENTE") {
  return (
    <Navigate
      to="/aguardando-aprovacao"
      replace
    />
  );
}

if (senhaTemporaria) {
  return (
    <Navigate
      to="/alterar-senha"
      replace
    />
  );
}

if (
  pessoa.status === "INATIVO" ||
  pessoa.status === "BLOQUEADO"
) {
  return (
    <Navigate
      to="/login"
      replace
    />
  );
}
  return <>{children}</>;
}