import { useEffect, useState } from "react";

import { PeopleService } from "../services/PeopleService";
import type { Pessoa } from "../types/Pessoa";
import { PeopleForm } from "../components/PeopleForm";
import { PeopleTable } from "../components/PeopleTable";

export function PeoplePage() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarPessoas() {
    setLoading(true);

    try {
      const dados = await PeopleService.listar();
      setPessoas(dados ?? []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar pessoas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarPessoas();
  }, []);

  return (
    <div className="p-8">

      <h1 className="mb-6 text-3xl font-bold">
        👥 Pessoas
      </h1>

      <PeopleForm onSaved={carregarPessoas} />

     {loading ? (
  <p>Carregando...</p>
) : (
  <PeopleTable pessoas={pessoas} />
)}

    </div>
  );
}