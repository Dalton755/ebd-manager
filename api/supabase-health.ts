import {
    createClient,
} from "@supabase/supabase-js";

import type {
    VercelRequest,
    VercelResponse,
} from "@vercel/node";

const SUPABASE_URL =
    process.env.VITE_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            error: "Método não permitido",
        });
    }

    if (
        !SUPABASE_URL ||
        !SUPABASE_SERVICE_ROLE_KEY
    ) {
        return res.status(500).json({
            success: false,
            error: "Configuração do servidor indisponível",
        });
    }

    try {
        const supabaseAdmin = createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                },
            }
        );

        const {
            error,
        } = await supabaseAdmin
            .schema("ebd")
            .from("planos")
            .select("id", {
                head: true,
                count: "exact",
            });

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            app: "EBD Manager",
            supabase: "conectado",
        });
    } catch (error) {
        console.error(
            "Erro no teste administrativo do Supabase:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Falha na conexão com o Supabase",
        });
    }
}