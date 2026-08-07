import { useState } from "react";

import { PeopleService } from "../services/PeopleService";

type Props = {
  onSaved: () => void;
};

export function PeopleForm({ onSaved }: Props) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!nome || !email) {
      alert("Informe o nome e o e-mail.");
      return;
    }

    try {
      setSalvando(true);

      await PeopleService.criar({
        nome,
        email,
        telefone,
      });

      setNome("");
      setEmail("");
      setTelefone("");

      onSaved();

      alert("Pessoa cadastrada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar pessoa.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">

      <h2 className="mb-4 text-xl font-semibold">
        Nova Pessoa
      </h2>

      <div className="grid gap-4">

        <input
          className="rounded border p-3"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <input
          className="rounded border p-3"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="rounded border p-3"
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />

        <button
          onClick={salvar}
          disabled={salvando}
          className="rounded bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>

      </div>

    </div>
  );
}