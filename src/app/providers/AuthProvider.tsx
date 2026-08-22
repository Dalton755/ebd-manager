import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import type {
    Session,
    User,
} from "@supabase/supabase-js";

import type {
    Pessoa,
} from "@/modules/people/types/Pessoa";

import {
    supabase,
} from "@/shared/lib/supabase/client";

import {
    AuthService,
} from "@/modules/auth/services/AuthService";

import {
    PushNotificationService,
} from "@/modules/notifications/services/PushNotificationService";

import {
    PlanService,
} from "@/shared/plans/PlanService";

import type {
    PlanoCompleto,
} from "@/shared/plans/PlanTypes";


type AuthContextType = {
    user: User | null;
    session: Session | null;
    pessoa: Pessoa | null;
    igrejaId: string | null;
    plano: PlanoCompleto | null;
    isSuperAdmin: boolean;
    senhaTemporaria: boolean;
    loading: boolean;
    logout: () => Promise<void>;
};


const AuthContext = createContext(
    {} as AuthContextType
);


type Props = {
    children: ReactNode;
};


export function AuthProvider({
    children,
}: Props) {

    const [user, setUser] =
        useState<User | null>(null);

    const [session, setSession] =
        useState<Session | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [pessoa, setPessoa] =
        useState<Pessoa | null>(null);

    const [igrejaId, setIgrejaId] =
        useState<string | null>(null);

    const [senhaTemporaria, setSenhaTemporaria] =
        useState(false);

    const [plano, setPlano] =
        useState<PlanoCompleto | null>(null);

    const [isSuperAdmin, setIsSuperAdmin] =
        useState(false);


    // =====================================================
    // BUSCA A PESSOA OU CRIA AUTOMATICAMENTE
    // =====================================================

    async function buscarOuCriarPessoa(
        usuario: User
    ): Promise<Pessoa | null> {

        const {
            data,
            error,
        } = await supabase
            .schema("ebd")
            .from("pessoas")
            .select("*")
            .eq("user_id", usuario.id)
            .maybeSingle();


        if (error) {

            console.error(
                "Erro ao buscar cadastro:",
                error
            );

            return null;
        }


        // UsuÃ¡rio jÃ¡ possui cadastro
        if (data) {

            return data;
        }


        // =================================================
        // PRIMEIRO LOGIN COM GOOGLE
        // Cria automaticamente como PENDENTE
        // =================================================

        console.log(
            "Novo usuÃ¡rio autenticado. Criando cadastro..."
        );


        const {
            data: novaPessoa,
            error: erroCadastro,
        } = await supabase
            .schema("ebd")
            .from("pessoas")
            .insert({
                user_id: usuario.id,

                nome:
                    usuario.user_metadata?.full_name ??
                    usuario.user_metadata?.name ??
                    "UsuÃ¡rio",

                email:
                    usuario.email ?? "",

                telefone: "",

                ativo: false,

                status: "PENDENTE",

                perfil: "ALUNO",
            })
            .select()
            .single();


        if (erroCadastro) {

            console.error(
                "Erro ao criar cadastro:",
                erroCadastro
            );

            return null;
        }


        console.log(
            "Cadastro criado com sucesso:",
            novaPessoa
        );


        return novaPessoa;
    }


    // =====================================================
    // ATUALIZA ESTADO DA AUTENTICAÃ‡ÃƒO
    // =====================================================

    async function atualizarAutenticacao(
        novaSession: Session | null
    ) {

        setLoading(true);

        setSession(novaSession);


        const usuario =
            novaSession?.user ?? null;

        setUser(usuario);

        let superAdmin = false;

        if (usuario) {
            const {
                data,
                error,
            } = await supabase
                .schema("ebd")
                .rpc("usuario_e_superadmin");

            if (error) {
                console.error(
                    "Erro ao verificar SUPERADMIN:",
                    error
                );
            } else {

                console.log(
        "VERIFICAÇÃO SUPERADMIN:",
        data
    );
                superAdmin = data === true;
            }
        }

        setIsSuperAdmin(superAdmin);


        // =================================================
        // USUÃRIO DESLOGADO
        // =================================================

        if (!usuario) {

            setPessoa(null);

            setIgrejaId(null);

            setPlano(null);

            setSenhaTemporaria(false);

            setLoading(false);

            setIsSuperAdmin(false);

            return;
        }


        // =================================================
        // BUSCA / CRIA PESSOA
        // =================================================

        const pessoaEncontrada =
            await buscarOuCriarPessoa(usuario);


        setPessoa(pessoaEncontrada);

        setIgrejaId(
            pessoaEncontrada?.igreja_id ?? null
        );


        setSenhaTemporaria(
            pessoaEncontrada?.senha_temporaria === true
        );


        // =================================================
        // CARREGA PLANO DA IGREJA
        // =================================================

        if (pessoaEncontrada?.igreja_id) {

            try {

                const planoEncontrado =
                    await PlanService.buscarPlanoDaIgreja(
                        pessoaEncontrada.igreja_id
                    );

                setPlano(planoEncontrado);

                console.log(
                    "Plano da igreja:",
                    planoEncontrado
                );

            } catch (erro) {

                console.error(
                    "Erro ao carregar plano da igreja:",
                    erro
                );

                setPlano(null);
            }

        } else {

            setPlano(null);
        }


        // =================================================
        // REGISTRA DISPOSITIVO PARA PUSH
        // =================================================

        if (pessoaEncontrada?.id) {

            try {

                const pushRegistrado =
                    await PushNotificationService.registrarDispositivo(
                        pessoaEncontrada.id
                    );


                console.log(
                    "Resultado do registro Push:",
                    pushRegistrado
                );

            } catch (erro) {

                console.error(
                    "Erro ao registrar dispositivo Push:",
                    erro
                );
            }
        }


        setLoading(false);
    }


    // =====================================================
    // CARREGA USUÃRIO AO INICIAR O APP
    // =====================================================

    useEffect(() => {

        let ativo = true;


        async function carregarUsuario() {

            const {
                data: {
                    session,
                },
            } = await supabase.auth.getSession();


            if (!ativo) {
                return;
            }


            // =============================================
            // CONTROLE DE EXPIRAÃ‡ÃƒO DE 12 HORAS
            // =============================================

            if (session) {

                const loginAt =
                    localStorage.getItem("login_at");


                // Login Google nÃ£o passa pelo
                // AuthService.login()
                if (!loginAt) {

                    AuthService.saveLoginTime();
                }


                if (
                    AuthService.isSessionExpired()
                ) {

                    await AuthService.logout();


                    if (!ativo) {
                        return;
                    }


                    setSession(null);

                    setUser(null);

                    setPessoa(null);

                    setIgrejaId(null);

                    setSenhaTemporaria(false);

                    setLoading(false);

                    setPlano(null);

                    return;
                }
            }


            await atualizarAutenticacao(session);
        }


        carregarUsuario();


        // =================================================
        // OBSERVA ALTERAÃ‡Ã•ES DE AUTENTICAÃ‡ÃƒO
        // =================================================

        const {
            data: {
                subscription,
            },
        } = supabase.auth.onAuthStateChange(
            (
                event,
                novaSession
            ) => {

                console.log(
                    "Evento de autenticaÃ§Ã£o:",
                    event
                );


                if (
                    event === "SIGNED_IN" &&
                    novaSession
                ) {

                    AuthService.saveLoginTime();
                }


                // NÃ£o fazemos consultas ao Supabase
                // diretamente dentro do callback.
                setTimeout(() => {

                    if (ativo) {

                        void atualizarAutenticacao(
                            novaSession
                        );
                    }

                }, 0);
            }
        );


        // =================================================
        // LIMPEZA
        // =================================================

        return () => {

            ativo = false;

            subscription.unsubscribe();
        };

    }, []);


    // =====================================================
    // LOGOUT
    // =====================================================

    async function logout() {

        await AuthService.logout();


        setSession(null);

        setUser(null);

        setPessoa(null);

        setIgrejaId(null);

        setPlano(null);

        setSenhaTemporaria(false);

        setIsSuperAdmin(false);
    }


    // =====================================================
    // PROVIDER
    // =====================================================

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                pessoa,
                igrejaId,
                plano,
                isSuperAdmin,
                senhaTemporaria,
                loading,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}


// =========================================================
// HOOK
// =========================================================

export function useAuth() {

    return useContext(
        AuthContext
    );
}
