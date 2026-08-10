export type PasswordRecoveryRequest = {
    id: string;
    pessoa_id: string;
    status: "PENDENTE" | "ATENDIDA";
    solicitado_em: string;
    concluido_em: string | null;
    atendido_por: string | null;

    pessoa: {
        id: string;
        nome: string;
        email: string;
        telefone: string | null;
    };
};