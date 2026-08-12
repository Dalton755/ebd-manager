import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { supabase } from "@/shared/lib/supabase/client";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";

export function ChangeTemporaryPasswordPage() {
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    async function handleChangePassword() {

        if (password.length < 6) {
            toast.error(
                "A nova senha deve ter pelo menos 6 caracteres."
            );
            return;
        }

        if (password !== confirmPassword) {
            toast.error(
                "As senhas não conferem."
            );
            return;
        }

        try {

            setLoading(true);

            const {
                data,
                error,
            } = await supabase.functions.invoke(
                "change-temporary-password",
                {
                    body: {
                        novaSenha: password,
                    },
                }
            );

            if (error) {
                throw error;
            }

            if (!data?.success) {
                throw new Error(
                    data?.error ??
                    "Não foi possível alterar sua senha."
                );
            }

            toast.success(
                "Senha alterada com sucesso!"
            );

            // Atualiza a sessão para garantir
            // que o usuário continue autenticado.
            await supabase.auth.refreshSession();

            window.location.href = "/";

        } catch (error) {

            console.error(
                "Erro ao alterar senha temporária:",
                error
            );

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível alterar sua senha."
            );

        } finally {

            setLoading(false);

        }
    }

    async function handleLogout() {

        await supabase.auth.signOut();

        navigate("/login", {
            replace: true,
        });
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">

            <Card className="w-full max-w-md space-y-6">

                <div className="text-center">

                    <h1 className="text-2xl font-bold text-blue-600">
                        Defina sua nova senha
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                        Você está utilizando uma senha
                        temporária. Por segurança,
                        defina uma senha pessoal para
                        continuar utilizando o sistema.
                    </p>

                </div>

                <div className="space-y-4">

                    <Input
                        type="password"
                        placeholder="Nova senha"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />

                    <Input
                        type="password"
                        placeholder="Confirmar nova senha"
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(
                                e.target.value
                            )
                        }
                    />

                </div>

                <Button
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="w-full"
                >
                    {loading
                        ? "Alterando senha..."
                        : "Definir nova senha"}
                </Button>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-sm text-slate-500 hover:text-slate-700 hover:underline"
                >
                    Sair
                </button>

            </Card>

        </div>
    );
}