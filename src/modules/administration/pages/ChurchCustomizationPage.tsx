import { useEffect, useState } from "react";
import {
  Image,
  Save,
  Upload,
  Building2,
  CheckCircle2,
} from "lucide-react";

import { supabase } from "@/shared/lib/supabase/client";
import { useAuth } from "@/app/providers/AuthProvider";

export function ChurchCustomizationPage() {
  const { plano } = useAuth();

  const [igrejaId, setIgrejaId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [arquivo, setArquivo] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const nomePlano =
    plano?.plano?.nome ?? "Semente";

  useEffect(() => {
    async function carregarIgreja() {
      try {
        setLoading(true);

        const {
          data: usuario,
          error: usuarioError,
        } = await supabase.auth.getUser();

        if (usuarioError) {
          throw usuarioError;
        }

        if (!usuario.user) {
          throw new Error("Usuário não autenticado.");
        }

        const {
          data: pessoa,
          error: pessoaError,
        } = await supabase
          .schema("ebd")
          .from("pessoas")
          .select("igreja_id")
          .eq("user_id", usuario.user.id)
          .maybeSingle();

        if (pessoaError) {
          throw pessoaError;
        }

        if (!pessoa?.igreja_id) {
          throw new Error(
            "Igreja não encontrada para este usuário."
          );
        }

        setIgrejaId(pessoa.igreja_id);

        const {
          data: igreja,
          error: igrejaError,
        } = await supabase
          .schema("ebd")
          .from("igrejas")
          .select("id, nome, logo_url")
          .eq("id", pessoa.igreja_id)
          .single();

        if (igrejaError) {
          throw igrejaError;
        }

        setNome(igreja.nome ?? "");
        setLogoUrl(igreja.logo_url ?? null);

      } catch (error) {
        console.error(
          "Erro ao carregar personalização:",
          error
        );

        setMensagem(
          "Não foi possível carregar os dados da igreja."
        );
      } finally {
        setLoading(false);
      }
    }

    carregarIgreja();
  }, []);

  function selecionarArquivo(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMensagem(
        "Selecione um arquivo de imagem."
      );

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMensagem(
        "A imagem deve ter no máximo 5 MB."
      );

      return;
    }

    setArquivo(file);

    setLogoUrl(
      URL.createObjectURL(file)
    );

    setMensagem("");
  }

  async function salvar() {
    if (!igrejaId) {
      return;
    }

    try {
      setSalvando(true);
      setMensagem("");

      let novaLogoUrl = logoUrl;

      // =====================================================
      // UPLOAD DA LOGO
      // =====================================================

      if (arquivo) {
        const extensao =
          arquivo.name
            .split(".")
            .pop()
            ?.toLowerCase() ?? "png";

        const caminho =
          `${igrejaId}/logo.${extensao}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("igrejas")
          .upload(
            caminho,
            arquivo,
            {
              upsert: true,
              contentType: arquivo.type,
            }
          );

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: urlData,
        } = supabase.storage
          .from("igrejas")
          .getPublicUrl(caminho);

        novaLogoUrl =
          `${urlData.publicUrl}?v=${Date.now()}`;
      }

      // =====================================================
      // SALVAR DADOS DA IGREJA
      // =====================================================

      const {
        error,
      } = await supabase
        .schema("ebd")
        .from("igrejas")
        .update({
          nome: nome.trim(),
          logo_url: novaLogoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", igrejaId);

      if (error) {
        throw error;
      }

      setLogoUrl(novaLogoUrl);
      setArquivo(null);

      setMensagem(
        "Personalização salva com sucesso."
      );

    } catch (error) {
      console.error(
        "Erro ao salvar personalização:",
        error
      );

      setMensagem(
        "Não foi possível salvar a personalização."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (nomePlano !== "Igreja") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <Building2 size={24} />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Personalização da igreja
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Esse recurso está disponível no Plano Igreja.
            </p>
          </div>

        </div>

      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-slate-500">
          Carregando personalização...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ================================================= */}
      {/* CABEÇALHO */}
      {/* ================================================= */}

      <div>

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Building2 size={22} />
          </div>

          <div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Personalização da igreja
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Personalize a identidade da sua EBD.
            </p>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* CARD PRINCIPAL */}
      {/* ================================================= */}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ================================================= */}
        {/* LOGO */}
        {/* ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Image size={20} />
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Logo da igreja
              </h2>

              <p className="text-xs text-slate-500">
                Imagem exibida no sistema
              </p>

            </div>

          </div>


          <div className="mt-6 flex flex-col items-center">

            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">

              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo da igreja"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-center">

                  <Image
                    size={36}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Sem logo
                  </p>

                </div>
              )}

            </div>


            <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">

              <Upload size={16} />

              Escolher imagem

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={selecionarArquivo}
              />

            </label>


            <p className="mt-3 text-center text-xs text-slate-400">
              PNG, JPG ou WebP · máximo 5 MB
            </p>

          </div>

        </div>


        {/* ================================================= */}
        {/* NOME */}
        {/* ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 size={20} />
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Identidade da igreja
              </h2>

              <p className="text-xs text-slate-500">
                Informações exibidas para os usuários
              </p>

            </div>

          </div>


          <div className="mt-6">

            <label className="text-sm font-semibold text-slate-700">
              Nome da igreja
            </label>

            <input
              type="text"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
              placeholder="Digite o nome da igreja"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

          </div>


          {/* PREVIEW */}

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">

            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pré-visualização
            </p>

            <div className="mt-4 flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">

                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Building2
                    size={24}
                    className="text-slate-300"
                  />
                )}

              </div>

              <div>

                <p className="font-bold text-slate-900">
                  {nome || "Nome da igreja"}
                </p>

                <p className="text-xs text-slate-500">
                  Escola Bíblica Dominical
                </p>

              </div>

            </div>

          </div>


          {/* MENSAGEM */}

          {mensagem && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">

              <CheckCircle2 size={17} />

              {mensagem}

            </div>
          )}


          {/* SALVAR */}

          <div className="mt-6 flex justify-end">

            <button
              type="button"
              onClick={salvar}
              disabled={
                salvando ||
                !nome.trim()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Save size={17} />

              {salvando
                ? "Salvando..."
                : "Salvar personalização"}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}