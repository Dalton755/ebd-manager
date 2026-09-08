require("dotenv").config({
    path: ".env.development.local"
});

const {
    createClient
} = require("@supabase/supabase-js");

const url =
    process.env.VITE_SUPABASE_URL;

const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
    throw new Error(
        "Variáveis Supabase não encontradas."
    );
}

const supabase =
    createClient(
        url,
        serviceRole,
        {
            db: {
                schema: "ebd"
            },
            auth: {
                persistSession: false
            }
        }
    );

async function executar() {

    const {
        data: traducao,
        error: erroTraducao
    } = await supabase
        .from("biblia_traducoes")
        .select("id,codigo,nome")
        .eq("codigo", "BLIVRE")
        .single();

    if (erroTraducao) {
        throw erroTraducao;
    }

    const {
        count,
        error: erroContagem
    } = await supabase
        .from("biblia_versiculos")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )
        .eq(
            "traducao_id",
            traducao.id
        );

    if (erroContagem) {
        throw erroContagem;
    }

    const {
        data: genesis,
        error: erroGenesis
    } = await supabase
        .from("biblia_versiculos")
        .select(
            "livro,livro_abreviado,capitulo,versiculo,texto"
        )
        .eq(
            "traducao_id",
            traducao.id
        )
        .eq("livro_numero", 1)
        .eq("capitulo", 1)
        .eq("versiculo", 1)
        .single();

    if (erroGenesis) {
        throw erroGenesis;
    }

    console.log(
        "Tradução:",
        traducao.codigo,
        "-",
        traducao.nome
    );

    console.log(
        "Total de versículos:",
        count
    );

    console.log(
        "Gênesis 1:1:"
    );

    console.log(
        genesis.texto
    );
}

executar().catch(
    error => {
        console.error(error);
        process.exit(1);
    }
);
