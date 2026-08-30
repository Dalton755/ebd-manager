import { supabase } from "@/shared/lib/supabase/client";

export class AuthService {

  private static readonly SESSION_KEY = "login_at";

  private static readonly SESSION_HOURS = 12;


  // ============================================================
  // LOGIN
  // ============================================================

  static async login(
    email: string,
    password: string
  ) {

    const result =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (
      !result.error &&
      result.data.user
    ) {
      this.saveLoginTime();
    }

    return result;
  }


  // ============================================================
  // LOGIN GOOGLE
  // ============================================================

  static async loginWithGoogle() {

    return await supabase.auth.signInWithOAuth({
      provider: "google",

      options: {
        redirectTo:
          window.location.origin,
      },
    });

  }


  // ============================================================
  // LOGOUT
  // ============================================================

  static async logout() {

    localStorage.removeItem(
      this.SESSION_KEY
    );

    await supabase.auth.signOut();

  }


  // ============================================================
  // CONTROLE DA SESSÃO
  // ============================================================

  static saveLoginTime() {

    localStorage.setItem(
      this.SESSION_KEY,
      new Date().toISOString()
    );

  }


  static isSessionExpired() {

    const loginAt =
      localStorage.getItem(
        this.SESSION_KEY
      );

    if (!loginAt) {
      return true;
    }

    const loginDate =
      new Date(loginAt);

    const now =
      new Date();

    const diffHours =
      (
        now.getTime() -
        loginDate.getTime()
      ) /
      1000 /
      60 /
      60;

    return (
      diffHours >=
      this.SESSION_HOURS
    );

  }


  // ============================================================
  // USUÁRIO
  // ============================================================

  static async getUser() {

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    return user;

  }


  static async getSession() {

    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    return session;

  }


  // ============================================================
  // RESET DE SENHA
  // ============================================================

  static async resetPassword(
    email: string
  ) {

    return await supabase.auth
      .resetPasswordForEmail(
        email,
        {
          redirectTo:
            `${window.location.origin}/reset-password`,
        }
      );

  }


  // ============================================================
  // CADASTRO SIMPLES
  // ============================================================

  static async register(
    nome: string,
    email: string,
    telefone: string,
    password: string
  ) {

    const {
      data: authData,
      error: authError
    } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (authError) {

      return {
        data: null,
        error: authError,
      };

    }

    if (!authData.user) {

      return {
        data: null,
        error: new Error(
          "Não foi possível criar o usuário."
        ),
      };

    }

    const {
      data: pessoaData,
      error: pessoaError
    } =
      await supabase
        .schema("ebd")
        .from("pessoas")
        .insert({

          user_id:
            authData.user.id,

          nome,

          email,

          telefone,

          ativo:
            false,

          status:
            "PENDENTE",

          perfil:
            "ALUNO",

        })
        .select()
        .single();

    if (pessoaError) {

      return {
        data: null,
        error: pessoaError,
      };

    }

    return {
      data: pessoaData,
      error: null,
    };

  }


  // ============================================================
  // CADASTRO DE IGREJA
  // ============================================================

  // ============================================================
  // CADASTRO DE IGREJA
  // ============================================================

  static async registerIgreja(
    dados: {

      igreja: {

        nome: string;

        sigla: string;

        cnpj: string;

        telefone: string;

        email: string;

      };

      administrador: {

        nome: string;

        email: string;

        telefone: string;

        password: string;

      };

      

    }
  ) {

    console.log(
      "ENVIANDO CADASTRO DA IGREJA:",
      dados
    );


    // ==========================================================
    // CRIA IGREJA + ADMINISTRADOR + ASSINATURA
    // ==========================================================

    const {
      data,
      error,
    } =
      await supabase.functions.invoke(
        "public-register",
        {
          body: dados,
        }
      );


    console.log(
      "RESPOSTA PUBLIC-REGISTER:",
      {
        data,
        error,
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

      const erro =
        new Error(
          data?.error ??
          "Não foi possível cadastrar a igreja."
        );


      return {

        data: null,

        error: erro,

      };

    }


    // ==========================================================
    // LOGIN AUTOMÁTICO
    // ==========================================================

    const {
      data: loginData,
      error: loginError,
    } =
      await supabase.auth.signInWithPassword({

        email:
          dados.administrador.email,

        password:
          dados.administrador.password,

      });


    if (loginError) {

      console.error(
        "Igreja criada, mas não foi possível realizar o login automático:",
        loginError
      );


      return {

        data: null,

        error: new Error(
          "A igreja foi cadastrada, mas não foi possível entrar automaticamente. Faça login para continuar."
        ),

      };

    }


    if (!loginData.user) {

      return {

        data: null,

        error: new Error(
          "A igreja foi cadastrada, mas não foi possível iniciar a sessão."
        ),

      };

    }


    // ==========================================================
    // REGISTRA HORÁRIO DO LOGIN
    // ==========================================================

    this.saveLoginTime();


    // ==========================================================
    // SUCESSO
    // ==========================================================

    return {

      data: {

        ...data,

        user:
          loginData.user,

        session:
          loginData.session,

      },

      error: null,

    };

  }

}