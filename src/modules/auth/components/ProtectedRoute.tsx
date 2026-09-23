import {
  Navigate,
} from "react-router-dom";

import {
  LoadingSpinner,
} from "@/shared/components/ui/LoadingSpinner";

import {
  useAuth,
} from "../hooks/useAuth";


type Props = {
  children: React.ReactNode;
};


export function ProtectedRoute({
  children,
}: Props) {

  const {
    user,
    pessoa,
    senhaTemporaria,
    loading,
  } =
    useAuth();


  if (
    loading &&
    !pessoa
  ) {

    return (
      <LoadingSpinner
        text="Abrindo EBD Manager..."
      />
    );
  }


  if (
    !user &&
    !loading
  ) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  /*
   * Conta Google autenticada, mas ainda sem vínculo.
   * Em vez de exibir erro, leva para a experiência
   * simples de entrada por número da classe.
   */
  if (
    user &&
    !pessoa
  ) {

    return (
      <Navigate
        to="/entrar-classe"
        replace
      />
    );
  }


  if (
    pessoa?.status ===
    "PENDENTE"
  ) {

    return (
      <Navigate
        to="/aguardando-aprovacao"
        replace
      />
    );
  }


  if (
    senhaTemporaria
  ) {

    return (
      <Navigate
        to="/alterar-senha"
        replace
      />
    );
  }


  if (
    pessoa?.status ===
      "INATIVO" ||
    pessoa?.status ===
      "BLOQUEADO"
  ) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  return (
    <>
      {children}
    </>
  );
}
