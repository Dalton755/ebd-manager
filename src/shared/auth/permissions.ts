export type Perfil =
    | "ADMIN"
    | "PASTOR"
    | "SUPERINTENDENTE"
    | "PROFESSOR"
    | "ALUNO";

export type Permissao =
    | "VER_DASHBOARD"
    | "GERENCIAR_PESSOAS"
    | "VER_PESSOAS"
    | "GERENCIAR_PERFIS"
    | "GERENCIAR_AULAS"
    | "VER_AULAS"
    | "GERENCIAR_CLASSES"
    | "VER_CLASSES"
    | "REGISTRAR_PRESENCA"
    | "VER_PRESENCAS"
    | "VALIDAR_PRESENCAS"
    | "APROVAR_USUARIOS"
    | "MINISTRAR_AULA"
    | "FAZER_CHECKIN"
    | "VER_MINHAS_AULAS"
    | "VER_MINHAS_PRESENCAS"
    | "VER_FINANCEIRO"
    | "GERENCIAR_FINANCEIRO";

const permissoesPorPerfil: Record<
    Perfil,
    Permissao[]
> = {
    ADMIN: [
        "VER_DASHBOARD",
        "GERENCIAR_PESSOAS",
        "VER_PESSOAS",
        "GERENCIAR_PERFIS",
        "GERENCIAR_AULAS",
        "VER_AULAS",
        "GERENCIAR_CLASSES",
        "VER_CLASSES",
        "REGISTRAR_PRESENCA",
        "VER_PRESENCAS",
        "VER_FINANCEIRO",
        "GERENCIAR_FINANCEIRO",
        "VALIDAR_PRESENCAS",
        "APROVAR_USUARIOS",
        "MINISTRAR_AULA",

    ],

    SUPERINTENDENTE: [
        "VER_DASHBOARD",
        "VER_PESSOAS",
        "GERENCIAR_AULAS",
        "VER_AULAS",
        "GERENCIAR_CLASSES",
        "VER_CLASSES",
        "REGISTRAR_PRESENCA",
        "VER_PRESENCAS",
        "VER_FINANCEIRO",
        "GERENCIAR_FINANCEIRO",
        "VALIDAR_PRESENCAS",
        "MINISTRAR_AULA",
        "FAZER_CHECKIN",
        "VER_MINHAS_AULAS",
        "VER_MINHAS_PRESENCAS",
    ],

    PASTOR: [
        "VER_DASHBOARD",
        "VER_PESSOAS",
        "VER_AULAS",
        "VER_CLASSES",
        "VER_PRESENCAS",
        "VER_FINANCEIRO",
        "MINISTRAR_AULA",
        "FAZER_CHECKIN",
        "VER_MINHAS_AULAS",
        "VER_MINHAS_PRESENCAS",
    ],

    PROFESSOR: [
        "VER_DASHBOARD",
        "VER_AULAS",
        "VER_CLASSES",
        "REGISTRAR_PRESENCA",
        "VER_PRESENCAS",
        "MINISTRAR_AULA",
        "FAZER_CHECKIN",
        "VER_MINHAS_AULAS",
        "VER_MINHAS_PRESENCAS",
    ],

    ALUNO: [
        "FAZER_CHECKIN",
        "VER_MINHAS_AULAS",
        "VER_MINHAS_PRESENCAS",
    ],
};

export function temPermissao(
    perfil: Perfil | null | undefined,
    permissao: Permissao
): boolean {
    if (!perfil) {
        return false;
    }

    return (
        permissoesPorPerfil[perfil]
            ?.includes(permissao) ?? false
    );
}