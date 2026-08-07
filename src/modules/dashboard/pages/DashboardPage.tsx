import { PeopleService } from "@/modules/people/services/PeopleService";

export function DashboardPage() {
  async function criarPessoaTeste() {
    try {
      const pessoa = await PeopleService.criar({
  nome: "Dalton Rocha",
  email: "dalton@teste.com",
  telefone: "(11)99999-9999",
});

      console.log(pessoa);

      alert("Pessoa criada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao criar pessoa.");
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

      <button
        onClick={criarPessoaTeste}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        Criar Pessoa de Teste
      </button>
    </div>
  );
}