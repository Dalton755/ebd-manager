import { supabase } from "@/shared/lib/supabase/client";

export class AttendanceRepository {

  static async listarPorData(data: string) {

    const { data: presencas, error } = await supabase
      .schema("ebd")
      .from("presencas")
      .select(`
                id,
                pessoa_id,
                aula_id,
                data,
                hora_checkin,
                tipo_registro,
                registrado_por,
                localizacao_status,
                distancia_metros,
                latitude,
                longitude,
                precisao,
                status_validacao,
                validado_por,
                validado_em,
                observacao_validacao,
                pessoas!presencas_pessoa_id_fkey (
                    id,
                    nome,
                    email,
                    telefone
                ),
                aula:aulas!presencas_aula_id_fkey (
                    id,
                    numero,
                    titulo,
                    data
                )
            `)
      .eq("data", data)
      .order("hora_checkin", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (presencas ?? []).map(
      (presenca) => ({
        ...presenca,
        pessoas: Array.isArray(
          presenca.pessoas
        )
          ? presenca.pessoas[0] ?? undefined
          : presenca.pessoas,
        aula: Array.isArray(
          presenca.aula
        )
          ? presenca.aula[0] ?? undefined
          : presenca.aula,
      })
    );
  }

  static async listarPorPeriodo(
    dataInicial: string,
    dataFinal: string
  ) {

    const { data: presencas, error } = await supabase
      .schema("ebd")
      .from("presencas")
      .select(`
                id,
                pessoa_id,
                aula_id,
                data,
                hora_checkin,
                tipo_registro,
                registrado_por,
                localizacao_status,
                distancia_metros,
                latitude,
                longitude,
                precisao,
                status_validacao,
                validado_por,
                validado_em,
                observacao_validacao,
                pessoas!presencas_pessoa_id_fkey (
                    id,
                    nome,
                    email,
                    telefone
                ),
                aula:aulas!presencas_aula_id_fkey (
                    id,
                    numero,
                    titulo,
                    data
                )
            `)
      .gte("data", dataInicial)
      .lte("data", dataFinal)
      .order("data", {
        ascending: false,
      })
      .order("hora_checkin", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (presencas ?? []).map(
      (presenca) => ({
        ...presenca,
        pessoas: Array.isArray(
          presenca.pessoas
        )
          ? presenca.pessoas[0] ?? undefined
          : presenca.pessoas,
        aula: Array.isArray(
          presenca.aula
        )
          ? presenca.aula[0] ?? undefined
          : presenca.aula,
      })
    );
  }

  static async listarPorAula(
    aulaId: string
  ) {

    const { data, error } =
      await supabase
        .schema("ebd")
        .from("presencas")
        .select(`
        id,
        pessoa_id,
        aula_id,
        data,
        hora_checkin,
        tipo_registro,
        registrado_por,
        localizacao_status,
        distancia_metros,
        latitude,
        longitude,
        precisao,
        status_validacao,
        validado_por,
        validado_em,
        observacao_validacao,

        pessoas!presencas_pessoa_id_fkey (
          id,
          nome,
          email,
          telefone
        ),

        aula:aulas!presencas_aula_id_fkey (
          id,
          numero,
          titulo,
          data,
          classe_id,
          trimestre_id
        )
      `)
        .eq(
          "aula_id",
          aulaId
        )
        .order(
          "hora_checkin",
          {
            ascending: false,
          }
        );


    if (error) {
      throw error;
    }


    return (
      data ?? []
    ).map(
      (presenca) => ({
        ...presenca,

        pessoas:
          Array.isArray(
            presenca.pessoas
          )
            ? presenca.pessoas[0] ??
            undefined
            : presenca.pessoas,

        aula:
          Array.isArray(
            presenca.aula
          )
            ? presenca.aula[0] ??
            undefined
            : presenca.aula,
      })
    );
  }

  static async listarPorAulas(
    aulaIds: string[]
  ) {

    if (
      aulaIds.length === 0
    ) {
      return [];
    }


    const { data, error } =
      await supabase
        .schema("ebd")
        .from("presencas")
        .select(`
        id,
        pessoa_id,
        aula_id,
        data,
        hora_checkin,
        tipo_registro,
        registrado_por,
        localizacao_status,
        distancia_metros,
        latitude,
        longitude,
        precisao,
        status_validacao,
        validado_por,
        validado_em,
        observacao_validacao,

        pessoas!presencas_pessoa_id_fkey (
          id,
          nome,
          email,
          telefone
        ),

        aula:aulas!presencas_aula_id_fkey (
          id,
          numero,
          titulo,
          data,
          classe_id,
          trimestre_id
        )
      `)
        .in(
          "aula_id",
          aulaIds
        )
        .order(
          "data",
          {
            ascending: false,
          }
        )
        .order(
          "hora_checkin",
          {
            ascending: false,
          }
        );


    if (error) {
      throw error;
    }


    return (
      data ?? []
    ).map(
      (presenca) => ({
        ...presenca,

        pessoas:
          Array.isArray(
            presenca.pessoas
          )
            ? presenca.pessoas[0] ??
            undefined
            : presenca.pessoas,

        aula:
          Array.isArray(
            presenca.aula
          )
            ? presenca.aula[0] ??
            undefined
            : presenca.aula,
      })
    );
  }

  static async listarSemAula() {

    const { data, error } =
      await supabase
        .schema("ebd")
        .from("presencas")
        .select(`
        id,
        pessoa_id,
        aula_id,
        data,
        hora_checkin,
        tipo_registro,
        registrado_por,
        localizacao_status,
        distancia_metros,
        latitude,
        longitude,
        precisao,
        status_validacao,
        validado_por,
        validado_em,
        observacao_validacao,

        pessoas!presencas_pessoa_id_fkey (
          id,
          nome,
          email,
          telefone
        )
      `)
        .is(
          "aula_id",
          null
        )
        .order(
          "data",
          {
            ascending: false,
          }
        );


    if (error) {
      throw error;
    }


    return (
      data ?? []
    ).map(
      (presenca) => ({
        ...presenca,

        pessoas:
          Array.isArray(
            presenca.pessoas
          )
            ? presenca.pessoas[0] ??
            undefined
            : presenca.pessoas,
      })
    );
  }

  static async registrarPresencaNaAula(
    pessoaId: string,
    aulaId: string,
    data: string,
    registradoPor: string
  ) {

    const {
      data: presenca,
      error,
    } =
      await supabase
        .schema("ebd")
        .from("presencas")
        .insert({
          pessoa_id:
            pessoaId,

          aula_id:
            aulaId,

          data,

          hora_checkin:
            null,

          tipo_registro:
            "CHAMADA",

          registrado_por:
            registradoPor,

          status_validacao:
            "VALIDADO",
        })
        .select()
        .single();


    if (error) {
      throw error;
    }


    return presenca;
  }

  static async registrarPresenca(
    pessoaId: string,
    data: string,
    tipoRegistro: "CHECKIN" | "CHAMADA",
    registradoPor?: string
  ) {

    const { data: presenca, error } = await supabase
      .schema("ebd")
      .from("presencas")
      .insert({
        pessoa_id: pessoaId,
        data,
        hora_checkin:
          tipoRegistro === "CHECKIN"
            ? new Date().toISOString()
            : null,
        tipo_registro: tipoRegistro,
        registrado_por:
          registradoPor ?? null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return presenca;
  }

  static async removerPresenca(
    pessoaId: string,
    data: string
  ) {

    const { error } = await supabase
      .schema("ebd")
      .from("presencas")
      .delete()
      .eq("pessoa_id", pessoaId)
      .eq("data", data);

    if (error) {
      throw error;
    }
  }

  static async removerPresencaDaAula(
    pessoaId: string,
    aulaId: string
  ) {

    const { error } =
      await supabase
        .schema("ebd")
        .from("presencas")
        .delete()
        .eq(
          "pessoa_id",
          pessoaId
        )
        .eq(
          "aula_id",
          aulaId
        );


    if (error) {
      throw error;
    }
  }

  static async validarPresenca(
    presencaId: string,
    validadoPor: string
  ) {

    const { data, error } = await supabase
      .schema("ebd")
      .from("presencas")
      .update({
        status_validacao: "VALIDADO",
        validado_por: validadoPor,
        validado_em: new Date().toISOString(),
        observacao_validacao: null,
      })
      .eq("id", presencaId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  static async rejeitarPresenca(
    presencaId: string,
    validadoPor: string,
    observacao?: string
  ) {

    const { data, error } = await supabase
      .schema("ebd")
      .from("presencas")
      .update({
        status_validacao: "REJEITADO",
        validado_por: validadoPor,
        validado_em: new Date().toISOString(),
        observacao_validacao:
          observacao?.trim() || null,
      })
      .eq("id", presencaId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  static async buscarConfiguracaoCheckin(
    igrejaId: string
  ) {

    const { data, error } =
      await supabase
        .schema("ebd")
        .from("configuracoes_checkin")
        .select(`
        latitude,
        longitude,
        raio_metros
      `)
        .eq(
          "igreja_id",
          igrejaId
        )
        .eq(
          "ativo",
          true
        )
        .maybeSingle();


    if (error) {
      throw error;
    }


    return data;
  }

  static async listarMinhasPresencas(
    pessoaId: string
  ) {

    const { data, error } = await supabase
      .schema("ebd")
      .from("presencas")
      .select(`
            id,
            pessoa_id,
            aula_id,
            data,
            hora_checkin,
            tipo_registro,
            status_validacao,
            observacao_validacao,
            aula:aulas!presencas_aula_id_fkey (
                id,
                numero,
                titulo,
                data
            )
        `)
      .eq("pessoa_id", pessoaId)
      .order("data", {
        ascending: false,
      })
      .order("hora_checkin", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (data ?? []).map(
      (presenca) => ({
        ...presenca,

        aula: Array.isArray(
          presenca.aula
        )
          ? presenca.aula[0] ?? undefined
          : presenca.aula,
      })
    );
  }

}