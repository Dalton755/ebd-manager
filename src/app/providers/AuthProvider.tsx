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


type AuthContextType = {
    user: User | null;
    session: Session | null;
    pessoa: Pessoa | null;
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

    const [senhaTemporaria, setSenhaTemporaria] =
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


        // Usuário já possui cadastro
        if (data) {

            return data;
        }


        // =================================================
        // PRIMEIRO LOGIN COM GOOGLE
        // Cria automaticamente como PENDENTE
        // =================================================

        console.log(
            "Novo usuário autenticado. Criando cadastro..."
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
                    "Usuário",

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
    // ATUALIZA ESTADO DA AUTENTICAÇÃO
    // =====================================================

    async function atualizarAutenticacao(
        novaSession: Session | null
    ) {

        setLoading(true);

        setSession(novaSession);

        const usuario =
            novaSession?.user ?? null;

        setUser(usuario);


        if (!usuario) {

            setPessoa(null);

            setSenhaTemporaria(false);

            setLoading(false);

            return;
        }


        const pessoaEncontrada =
            await buscarOuCriarPessoa(usuario);


        setPessoa(pessoaEncontrada);


        setSenhaTemporaria(
            pessoaEncontrada?.senha_temporaria === true
        );


        setLoading(false);
    }


    // =====================================================
    // CARREGA USUÁRIO AO INICIAR O APP
    // =====================================================

    useEffect(() => {

        let ativo = true;


        async function carregarUsuario() {

            const {
                data: { session },
            } = await supabase.auth.getSession();


            if (!ativo) {
                return;
            }


            // =============================================
            // CONTROLE DE EXPIRAÇÃO DE 12 HORAS
            // =============================================

            if (session) {

                const loginAt =
                    localStorage.getItem("login_at");


                // Login Google não passa pelo
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

                    setSenhaTemporaria(false);

                    setLoading(false);

                    return;
                }
            }


            await atualizarAutenticacao(session);
        }


        carregarUsuario();


        // =================================================
        // OBSERVA ALTERAÇÕES DE AUTENTICAÇÃO
        // =================================================

        const {
            data: {
                subscription,
            },
        } = supabase.auth.onAuthStateChange(
            async (
                event,
                novaSession
            ) => {

                console.log(
                    "Evento de autenticação:",
                    event
                );


                if (
                    event === "SIGNED_IN" &&
                    novaSession
                ) {

                    AuthService.saveLoginTime();
                }


                await atualizarAutenticacao(
                    novaSession
                );
            }
        );


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

        setSenhaTemporaria(false);
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
                senhaTemporaria,
                loading,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth() {

    return useContext(
        AuthContext
    );
}