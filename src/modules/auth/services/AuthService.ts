import { supabase } from "@/shared/lib/supabase/client";

export class AuthService {

  private static readonly SESSION_KEY = "login_at";

  private static readonly SESSION_HOURS = 12;

  static async login(
    email: string,
    password: string
  ) {
    const result =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (!result.error && result.data.user) {
      this.saveLoginTime();
    }

    return result;
  }

  static async loginWithGoogle() {
    return await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  static async logout() {

    localStorage.removeItem(this.SESSION_KEY);

    await supabase.auth.signOut();

  }

  static saveLoginTime() {

    localStorage.setItem(
      this.SESSION_KEY,
      new Date().toISOString()
    );

  }

  static isSessionExpired() {

    const loginAt =
      localStorage.getItem(this.SESSION_KEY);

    if (!loginAt) return true;

    const loginDate = new Date(loginAt);

    const now = new Date();

    const diffHours =
      (now.getTime() - loginDate.getTime()) /
      1000 /
      60 /
      60;

    return diffHours >= this.SESSION_HOURS;

  }

  static async getUser() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;

  }

  static async getSession() {

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;

  }

  static async resetPassword(email: string) {

    return await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

  }

 static async register(
  nome: string,
  email: string,
  telefone: string,
  password: string,
  igrejaId: string
) {

  const { data, error } =
    await supabase.functions.invoke(
      "public-register",
      {
        body: {
          nome,
          email,
          telefone,
          password,
          igreja_id: igrejaId,
        },
      }
    );

  if (error) {
    console.error(
      "Erro ao chamar public-register:",
      error
    );

    return {
      data: null,
      error,
    };
  }

  if (!data?.success) {

    const erro = new Error(
      data?.error ??
      "Não foi possível realizar o cadastro."
    );

    return {
      data: null,
      error: erro,
    };
  }

  return {
    data: data.pessoa,
    error: null,
  };
}

}