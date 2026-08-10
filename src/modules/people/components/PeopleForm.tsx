import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PeopleService } from "../services/PeopleService";
import type { Pessoa } from "../types/Pessoa";
import { maskTelefone } from "@/shared/lib/masks";
import { peopleSchema } from "../validations/peopleSchema";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";


type Props = {
  pessoa?: Pessoa;
  onSaved: () => void;
};

export function PeopleForm({
  pessoa,
  onSaved,
}: Props) {
  const [nome, setNome] = useState(pessoa?.nome ?? "");
  const [email, setEmail] = useState(pessoa?.email ?? "");
  const [telefone, setTelefone] = useState(pessoa?.telefone ?? "");
  const [salvando, setSalvando] = useState(false);


  useEffect(() => {
    console.log("PeopleForm recebeu:", pessoa);

    if (pessoa) {
      setNome(pessoa.nome);
      setEmail(pessoa.email);
      setTelefone(pessoa.telefone);

    } else {
      setNome("");
      setEmail("");
      setTelefone("");

    }
  }, [pessoa]);

  async function salvar() {
    const validacao = peopleSchema.safeParse({
      nome,
      email,
      telefone,
    });

    if (!validacao.success) {
      toast.error(validacao.error.issues[0].message);
      return;
    }

    try {
      setSalvando(true);

      if (pessoa) {
        await PeopleService.editar(pessoa.id!, {
          nome,
          email,
          telefone,
        });

        toast.success("Pessoa atualizada com sucesso!");
      } else {
        await PeopleService.criar({
          nome,
          email,
          telefone,
          perfil: "ALUNO",
          status: "ATIVO",
        });

        toast.success("Pessoa cadastrada com sucesso!");
      }

      setNome("");
      setEmail("");
      setTelefone("");

      onSaved();


    } catch (error) {
      console.error(error);
      toast.error(
        pessoa
          ? "Erro ao atualizar pessoa."
          : "Erro ao cadastrar pessoa."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>



      <div className="space-y-4">

        <Input
          className="text-base"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <Input
          className="text-base"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          className="text-base"
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(maskTelefone(e.target.value))}
        />





        <Button

          onClick={salvar}
          disabled={salvando}
          className="w-full"
        >
          {salvando
            ? "Salvando..."
            : pessoa
              ? "Salvar Alterações"
              : "Salvar"}
        </Button>

      </div>

    </>
  );
}