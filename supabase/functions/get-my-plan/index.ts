import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

function resposta(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}

Deno.serve(async (req: Request) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {

    // =====================================================
    // AUTENTICAÇÃO
    // =====================================================

    const authorization =
      req.headers.get("Authorization");

    if (!authorization) {
      return resposta(
        {
          error:
            "Cabeçalho Authorization não informado.",
        },
        401
      );
    }

    if (
      !authorization.startsWith("Bearer ")
    ) {
      return resposta(
        {
          error:
            "Formato inválido do Authorization.",
        },
        401
      );
    }

    const token =
      authorization.substring(7).trim();

    if (!token) {
      return resposta(
        {
          error:
            "Token de autenticação não informado.",
        },
        401
      );
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      );

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      throw new Error(
        "Configuração da função não está completa."
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey
    );



    const {
      data: {
        user: usuarioLogado,
      },
      error: authError,
    } =
      await supabase.auth.getUser(
        token
      );

    if (authError) {

      console.error(
        "[GET-MY-PLAN] Erro ao validar usuário:",
        authError
      );

      return resposta(
        {
          error:
            "Sessão inválida.",
          details:
            authError.message,
        },
        401
      );
    }

    if (!usuarioLogado) {

      console.error(
        "[GET-MY-PLAN] Token válido, mas usuário não encontrado."
      );

      return resposta(
        {
          error:
            "Usuário não encontrado.",
        },
        401
      );
    }

    console.log(
      "[GET-MY-PLAN] Usuário autenticado:",
      usuarioLogado.id
    );

    // =====================================================
    // BUSCA A PESSOA LOGADA
    // =====================================================

    const {
      data: pessoa,
      error: pessoaError,
    } =
      await supabase
        .schema("ebd")
        .from("pessoas")
        .select(`
                    id,
                    nome,
                    perfil,
                    igreja_id
                `)
        .eq(
          "user_id",
          usuarioLogado.id
        )
        .maybeSingle();

    if (pessoaError) {
      throw pessoaError;
    }

    if (!pessoa) {
      return resposta(
        {
          error:
            "Pessoa não encontrada.",
        },
        404
      );
    }

    if (!pessoa.igreja_id) {
      return resposta(
        {
          error:
            "Seu usuário não está vinculado a uma igreja.",
        },
        400
      );
    }

    const igrejaId =
      pessoa.igreja_id;



    // =====================================================
    // BUSCA ASSINATURA ATIVA
    // =====================================================

    const {
      data: assinatura,
      error: assinaturaError,
    } =
      await supabase
        .schema("ebd")
        .from("assinaturas")
        .select(`
          id,
          plano_id,
          status,
          data_inicio:inicio_em,
          data_vencimento:fim_em
      `)
        .eq(
          "igreja_id",
          igrejaId
        )
        .eq(
          "status",
          "ATIVA"
        )
        .maybeSingle();

    if (assinaturaError) {
      throw assinaturaError;
    }

    if (!assinatura) {
      return resposta(
        {
          error:
            "A igreja não possui uma assinatura ativa.",
        },
        403
      );
    }

    // =====================================================
    // BUSCA PLANO
    // =====================================================

    const {
      data: plano,
      error: planoError,
    } =
      await supabase
        .schema("ebd")
        .from("planos")
        .select("*")
        .eq(
          "id",
          assinatura.plano_id
        )
        .maybeSingle();

    if (planoError) {
      throw planoError;
    }

    if (!plano) {
      return resposta(
        {
          error:
            "Plano não encontrado.",
        },
        404
      );
    }

    // =====================================================
    // BUSCA LIMITES
    // =====================================================

    const {
      data: limites,
      error: limitesError,
    } =
      await supabase
        .schema("ebd")
        .from("plano_limites")
        .select(`
                    max_pessoas,
                    max_classes,
                    max_professores,
                    max_secretarios,
                    max_pastores,
                    max_administradores,
                    max_trimestres,
                    max_superintendentes,
                    max_trimestres_ativos
                `)
        .eq(
          "plano_id",
          assinatura.plano_id
        )
        .maybeSingle();

    if (limitesError) {
      throw limitesError;
    }

    if (!limites) {
      return resposta(
        {
          error:
            "Os limites do plano não foram encontrados.",
        },
        500
      );
    }

    // =====================================================
    // CONTAGEM DE PESSOAS
    // =====================================================

    async function contarPerfil(
      perfil: string
    ) {

      const {
        count,
        error,
      } =
        await supabase
          .schema("ebd")
          .from("pessoas")
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "igreja_id",
            igrejaId
          )
          .eq(
            "perfil",
            perfil
          )
          .eq(
            "ativo",
            true
          );

      if (error) {
        throw error;
      }

      return count ?? 0;
    }

    const [
      professores,
      secretarios,
      pastores,
      administradores,
      superintendentes,
    ] =
      await Promise.all([
        contarPerfil("PROFESSOR"),
        contarPerfil("SECRETARIO"),
        contarPerfil("PASTOR"),
        contarPerfil("ADMIN"),
        contarPerfil("SUPERINTENDENTE"),
      ]);

    // =====================================================
    // TOTAL DE TRIMESTRES ATIVOS
    // =====================================================

    const {
      count: trimestresAtivos,
      error: trimestresAtivosError,
    } =
      await supabase
        .schema("ebd")
        .from("trimestres")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "igreja_id",
          igrejaId
        )
        .eq(
          "ativo",
          true
        );

    if (trimestresAtivosError) {
      throw trimestresAtivosError;
    }

    // =====================================================
    // TOTAL DE PESSOAS
    // =====================================================

    const {
      count: pessoas,
      error: pessoasError,
    } =
      await supabase
        .schema("ebd")
        .from("pessoas")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "igreja_id",
          igrejaId
        )
        .eq(
          "ativo",
          true
        );

    if (pessoasError) {
      throw pessoasError;
    }

    // =====================================================
    // TOTAL DE CLASSES ATIVAS
    // =====================================================

    const {
      count: classes,
      error: classesError,
    } =
      await supabase
        .schema("ebd")
        .from("classes")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "igreja_id",
          igrejaId
        )
        .eq(
          "ativa",
          true
        );

    if (classesError) {
      throw classesError;
    }

    // =====================================================
    // RESPOSTA
    // =====================================================

    return resposta({
      success: true,

      igreja_id:
        igrejaId,

      usuario: {
        nome:
          pessoa.nome,

        perfil:
          pessoa.perfil,
      },

      assinatura: {
        id:
          assinatura.id,

        status:
          assinatura.status,

        data_inicio:
          assinatura.data_inicio,

        data_vencimento:
          assinatura.data_vencimento,
      },

      plano: {
        id:
          plano.id,

        nome:
          plano.nome,
      },

      limites: {
        pessoas:
          limites.max_pessoas,

        classes:
          limites.max_classes,

        professores:
          limites.max_professores,

        secretarios:
          limites.max_secretarios,

        pastores:
          limites.max_pastores,

        administradores:
          limites.max_administradores,

        max_trimestres:
          limites.max_trimestres,

        max_superintendentes:
          limites.max_superintendentes,
      },

      utilizados: {
        pessoas:
          pessoas ?? 0,

        classes:
          classes ?? 0,

        professores,

        secretarios,

        pastores,
        
        superintendentes,

        administradores,

        trimestres_ativos:
          trimestresAtivos ?? 0,
      },
    });

  } catch (error) {

    console.error(
      "Erro ao buscar plano:",
      error
    );

    return resposta(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar plano.",
      },
      500
    );
  }
});