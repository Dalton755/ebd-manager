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
import type { Pessoa } from "@/modules/people/types/Pessoa";

import { supabase } from "@/shared/lib/supabase/client";
import { AuthService } from "@/modules/auth/services/AuthService";

type AuthContextType = {
    user: User | null;
    session: Session | null;
    pessoa: Pessoa | null;
    loading: boolean;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(
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

    useEffect(() => {

        async function carregarUsuario() {

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (
                session &&
                AuthService.isSessionExpired()
            ) {

                await AuthService.logout();

                setSession(null);
                setUser(null);
                setPessoa(null);
                setLoading(false);

                return;
            }

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {

                const { data, error } = await supabase
                    .schema("ebd")
                    .from("pessoas")
                    .select("*")
                    .eq("user_id", session.user.id)
                    .maybeSingle();

                console.log("=== AUTH PROVIDER ===");
                console.log("User ID da sessão:", session.user.id);
                console.log("Pessoa retornada:", data);
                console.log("Erro:", error);
                console.log("=====================");

                if (error) {
                    console.error(
                        "Erro ao carregar pessoa:",
                        error
                    );
                }

                setPessoa(data ?? null);
            }

            setLoading(false);
        }

        carregarUsuario();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (_event, session) => {

                setLoading(true);

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {

                    const { data, error } = await supabase
                        .schema("ebd")
                        .from("pessoas")
                        .select("*")
                        .eq("user_id", session.user.id)
                        .maybeSingle();

                    console.log("=== AUTH PROVIDER ===");
                    console.log("User ID da sessão:", session.user.id);
                    console.log("Pessoa retornada:", data);
                    console.log("Erro:", error);
                    console.log("=====================");

                    if (error) {
                        console.error(
                            "Erro ao carregar pessoa:",
                            error.message,
                            error.code,
                            error.details
                        );
                    }

                    setPessoa(data ?? null);

                } else {

                    setPessoa(null);

                }

                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();

    }, []);

    async function logout() {

        await AuthService.logout();

        setSession(null);
        setUser(null);
        setPessoa(null);

    }

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                pessoa,
                loading,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}