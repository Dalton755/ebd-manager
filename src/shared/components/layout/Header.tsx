import { AuthService } from "@/modules/auth/services/AuthService";
import { useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();

  async function sair() {
    await AuthService.logout();
    navigate("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <h2 className="text-lg font-semibold">
        EBD Manager
      </h2>

      <button
        onClick={sair}
        className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Sair
      </button>
    </header>
  );
}