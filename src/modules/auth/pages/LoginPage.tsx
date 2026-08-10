import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/AuthService";
import { toast } from "sonner";
import { Modal } from "@/shared/components/ui/Modal";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { PasswordRecoveryService } from "@/modules/password-recovery/services/PasswordRecoveryService";
import { Eye, EyeOff } from "lucide-react";

export function LoginPage() {

    const navigate = useNavigate();
    const { user } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [sendingRecovery, setSendingRecovery] = useState(false);

    useEffect(() => {
        if (user) {
            navigate("/", {
                replace: true,
            });
        }
    }, [user, navigate]);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();

        if (!email.trim() || !password) {
            toast.error("Informe seu e-mail e senha.");
            return;
        }

        try {
            setLoading(true);

            const { data, error } =
                await AuthService.login(
                    email.trim(),
                    password
                );

            if (error) {
                console.error("Erro no login:", error);

                toast.error(error.message);
                return;
            }

            if (!data.user) {
                toast.error(
                    "Não foi possível identificar o usuário."
                );
                return;
            }

            console.log(
                "Login realizado com sucesso:",
                data.user.id
            );

            toast.success("Login realizado com sucesso!");

        } catch (error) {
            console.error(
                "Erro inesperado no login:",
                error
            );

            toast.error(
                "Não foi possível realizar o login."
            );

        } finally {
            setLoading(false);
        }
    }

    async function handleRecovery() {
        if (!recoveryEmail.trim()) {
            toast.error("Informe seu e-mail.");
            return;
        }

        try {
            setSendingRecovery(true);

            await PasswordRecoveryService.solicitarRedefinicao(
                recoveryEmail
            );

            setModalOpen(false);
            setRecoveryEmail("");

            toast.success(
                "Solicitação enviada com sucesso. Aguarde o Administrador entrar em contato com sua nova senha."
            );
        } catch (error) {
            console.error(
                "Erro ao solicitar redefinição de senha:",
                error
            );

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível enviar sua solicitação."
            );
        } finally {
            setSendingRecovery(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-blue-600">
                        EBD Manager
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Sistema de Gestão da Escola Bíblica
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            E-mail
                        </label>

                        <input
                            type="email"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                            placeholder="email@igreja.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Senha
                        </label>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-blue-600"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-blue-600"
                                aria-label={
                                    showPassword
                                        ? "Ocultar senha"
                                        : "Mostrar senha"
                                }
                            >
                                {showPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </button>

                    <div className="space-y-3 text-center">
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className="block w-full text-sm text-blue-600 hover:underline"
                        >
                            Esqueci minha senha
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/cadastro")}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Criar minha conta
                        </button>
                    </div>


                </form>
            </div>

            <Modal
                open={modalOpen}
                title="Solicitar nova senha"
                onClose={() => setModalOpen(false)}
            >

                <p className="mb-4 text-sm text-slate-600">
                    Informe seu e-mail. Sua solicitação será enviada para o Administrador,
                    que entrará em contato com sua nova senha.
                </p>

                <Input
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={recoveryEmail}
                    onChange={(e) =>
                        setRecoveryEmail(e.target.value)
                    }
                />

                <Button
                    onClick={handleRecovery}
                    disabled={sendingRecovery}
                >
                    {sendingRecovery
                        ? "Enviando solicitação..."
                        : "Solicitar nova senha"}
                </Button>

            </Modal>
        </div>
    );
}