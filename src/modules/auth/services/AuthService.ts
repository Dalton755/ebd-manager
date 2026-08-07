import { supabase } from "@/shared/lib/supabase/client";

export class AuthService {
  static async login(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  static async logout() {
    return await supabase.auth.signOut();
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
}