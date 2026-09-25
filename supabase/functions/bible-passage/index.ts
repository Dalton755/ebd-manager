const allowedVersions = {
  ALM1911: {
    provider: "GETBIBLE",
    label: "Almeida 1911",
  },
  ONBV: {
    provider: "EBIBLE",
    baseUrl: "https://ebible.org/poronbv",
    label: "Biblica® Open Nova Bíblia Viva™ 2007",
  },
} as const;

const books: Record<
  string,
  {
    usfm: string;
    number: number;
  }
> = {
  GN: { usfm: "GEN", number: 1 },
  EX: { usfm: "EXO", number: 2 },
  LV: { usfm: "LEV", number: 3 },
  NM: { usfm: "NUM", number: 4 },
  DT: { usfm: "DEU", number: 5 },
  JS: { usfm: "JOS", number: 6 },
  JZ: { usfm: "JDG", number: 7 },
  RT: { usfm: "RUT", number: 8 },
  "1SM": { usfm: "1SA", number: 9 },
  "2SM": { usfm: "2SA", number: 10 },
  "1RS": { usfm: "1KI", number: 11 },
  "2RS": { usfm: "2KI", number: 12 },
  "1CR": { usfm: "1CH", number: 13 },
  "2CR": { usfm: "2CH", number: 14 },
  ED: { usfm: "EZR", number: 15 },
  NE: { usfm: "NEH", number: 16 },
  ET: { usfm: "EST", number: 17 },
  JO: { usfm: "JOB", number: 18 },
  SL: { usfm: "PSA", number: 19 },
  PV: { usfm: "PRO", number: 20 },
  EC: { usfm: "ECC", number: 21 },
  CT: { usfm: "SNG", number: 22 },
  IS: { usfm: "ISA", number: 23 },
  JR: { usfm: "JER", number: 24 },
  LM: { usfm: "LAM", number: 25 },
  EZ: { usfm: "EZK", number: 26 },
  DN: { usfm: "DAN", number: 27 },
  OS: { usfm: "HOS", number: 28 },
  JL: { usfm: "JOL", number: 29 },
  AM: { usfm: "AMO", number: 30 },
  OB: { usfm: "OBA", number: 31 },
  JN: { usfm: "JON", number: 32 },
  MQ: { usfm: "MIC", number: 33 },
  NA: { usfm: "NAM", number: 34 },
  HC: { usfm: "HAB", number: 35 },
  SF: { usfm: "ZEP", number: 36 },
  AG: { usfm: "HAG", number: 37 },
  ZC: { usfm: "ZEC", number: 38 },
  ML: { usfm: "MAL", number: 39 },
  MT: { usfm: "MAT", number: 40 },
  MC: { usfm: "MRK", number: 41 },
  LC: { usfm: "LUK", number: 42 },
  JOA: { usfm: "JHN", number: 43 },
  AT: { usfm: "ACT", number: 44 },
  RM: { usfm: "ROM", number: 45 },
  "1CO": { usfm: "1CO", number: 46 },
  "2CO": { usfm: "2CO", number: 47 },
  GL: { usfm: "GAL", number: 48 },
  EF: { usfm: "EPH", number: 49 },
  FP: { usfm: "PHP", number: 50 },
  CL: { usfm: "COL", number: 51 },
  "1TS": { usfm: "1TH", number: 52 },
  "2TS": { usfm: "2TH", number: 53 },
  "1TM": { usfm: "1TI", number: 54 },
  "2TM": { usfm: "2TI", number: 55 },
  TT: { usfm: "TIT", number: 56 },
  FM: { usfm: "PHM", number: 57 },
  HB: { usfm: "HEB", number: 58 },
  TG: { usfm: "JAS", number: 59 },
  "1PE": { usfm: "1PE", number: 60 },
  "2PE": { usfm: "2PE", number: 61 },
  "1JO": { usfm: "1JN", number: 62 },
  "2JO": { usfm: "2JN", number: 63 },
  "3JO": { usfm: "3JN", number: 64 },
  JD: { usfm: "JUD", number: 65 },
  AP: { usfm: "REV", number: 66 },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

function json(
  data: unknown,
  status = 200,
) {
  return Response.json(
    data,
    {
      status,
      headers: {
        ...corsHeaders,
        "Cache-Control":
          status === 200
            ? "public, max-age=300"
            : "no-store",
      },
    },
  );
}

function decodeEntities(
  value: string,
) {
  return value
    .replace(
      /&#(\d+);/g,
      (
        _,
        decimal,
      ) =>
        String.fromCodePoint(
          Number(decimal),
        ),
    )
    .replace(
      /&#x([0-9a-f]+);/gi,
      (
        _,
        hex,
      ) =>
        String.fromCodePoint(
          parseInt(
            hex,
            16,
          ),
        ),
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(
  value: string,
) {
  return decodeEntities(
    value
      .replace(
        /<[^>]+>/g,
        " ",
      ),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function cleanVerseHtml(
  fragment: string,
) {
  let html =
    fragment;

  html =
    html.replace(
      /<a\b[^>]*class=["'][^"']*notemark[^"']*["'][^>]*>[\s\S]*?<\/a>/gi,
      "",
    );

  html =
    html.replace(
      /<div\b[^>]*class=["'](?:s\d*|ms\d*|mr|r|d|sp|qa|cl|cd|mt\d*|mte\d*)["'][^>]*>[\s\S]*?<\/div>/gi,
      " ",
    );

  html =
    html.replace(
      /<br\s*\/?\s*>/gi,
      " ",
    );

  return cleanText(
    html,
  );
}

function parseVerseMarker(
  marker: string,
) {
  const normalized =
    decodeEntities(
      marker,
    ).trim();

  const parts =
    normalized.match(
      /\d+/g,
    ) ?? [];

  return parts
    .map(Number)
    .filter(
      (number) =>
        Number.isInteger(
          number,
        ) &&
        number > 0,
    );
}

function parseEbibleChapter(
  html: string,
) {
  const scriptureOnly =
    html
      .replace(
        /<ul\b[^>]*class=["']tnav["'][^>]*>[\s\S]*?<\/ul>/gi,
        " ",
      )
      .replace(
        /<div\b[^>]*class=["']footnote["'][^>]*>[\s\S]*?<\/div>/gi,
        " ",
      )
      .replace(
        /<div\b[^>]*class=["']copyright["'][^>]*>[\s\S]*?<\/div>/gi,
        " ",
      );

  const markerRegex =
    /<span\b[^>]*class=["']verse["'][^>]*>([\s\S]*?)<\/span>/gi;

  const markers =
    Array.from(
      scriptureOnly.matchAll(
        markerRegex,
      ),
    );

  const verses:
    Array<{
      numero: number;
      texto: string;
    }> = [];

  for (
    let index = 0;
    index <
    markers.length;
    index += 1
  ) {
    const current =
      markers[index];

    const next =
      markers[
        index + 1
      ];

    const contentStart =
      (
        current.index ??
        0
      ) +
      current[0].length;

    const contentEnd =
      next?.index ??
      scriptureOnly.length;

    const text =
      cleanVerseHtml(
        scriptureOnly.slice(
          contentStart,
          contentEnd,
        ),
      );

    if (!text) {
      continue;
    }

    const numbers =
      parseVerseMarker(
        current[1],
      );

    for (
      const numero
      of numbers
    ) {
      verses.push({
        numero,
        texto:
          text,
      });
    }
  }

  return verses;
}

function requestedVerseNumbers(
  body: {
    versiculoInicio?: number;
    versiculoFim?: number;
  },
) {
  const start =
    Number(
      body.versiculoInicio,
    );

  const end =
    Number(
      body.versiculoFim ??
      body.versiculoInicio,
    );

  const wanted =
    new Set<number>();

  if (
    Number.isInteger(
      start,
    ) &&
    start > 0
  ) {
    const safeEnd =
      Number.isInteger(
        end,
      ) &&
      end >= start
        ? Math.min(
            end,
            start + 80,
          )
        : start;

    for (
      let number = start;
      number <= safeEnd;
      number += 1
    ) {
      wanted.add(
        number,
      );
    }
  }

  return wanted;
}

async function fetchAlmeida1911(
  bookNumber: number,
  chapter: number,
) {
  const sourceUrl =
    `https://api.getbible.net/v2/almeida/${bookNumber}/${chapter}.json`;

  const response =
    await fetch(
      sourceUrl,
      {
        headers: {
          Accept:
            "application/json",
          "User-Agent":
            "EBD-Manager/1.0 BibleReferenceReader",
        },
        signal:
          AbortSignal.timeout(
            8000,
          ),
      },
    );

  if (!response.ok) {
    console.error(
      "GetBible upstream error",
      response.status,
      sourceUrl,
    );

    throw new Error(
      "Não foi possível consultar Almeida 1911.",
    );
  }

  const data =
    await response.json();

  const verses =
    Array.isArray(
      data?.verses,
    )
      ? data.verses
          .map(
            (
              verse: {
                verse?: number;
                text?: string;
              },
            ) => ({
              numero:
                Number(
                  verse.verse,
                ),
              texto:
                cleanText(
                  String(
                    verse.text ??
                    "",
                  ),
                ),
            }),
          )
          .filter(
            (
              verse: {
                numero: number;
                texto: string;
              },
            ) =>
              Number.isInteger(
                verse.numero,
              ) &&
              verse.numero >
                0 &&
              Boolean(
                verse.texto,
              ),
          )
      : [];

  return {
    sourceUrl,
    verses,
  };
}

async function fetchOnbv(
  usfmBookCode: string,
  chapter: number,
) {
  const chapterDigits =
    usfmBookCode ===
    "PSA"
      ? 3
      : 2;

  const fileName =
    `${usfmBookCode}${String(
      chapter,
    ).padStart(
      chapterDigits,
      "0",
    )}.htm`;

  const sourceUrl =
    `https://ebible.org/poronbv/${fileName}`;

  const response =
    await fetch(
      sourceUrl,
      {
        headers: {
          Accept:
            "text/html,application/xhtml+xml",
          "User-Agent":
            "EBD-Manager/1.0 BibleReferenceReader",
        },
        signal:
          AbortSignal.timeout(
            8000,
          ),
      },
    );

  if (!response.ok) {
    console.error(
      "eBible upstream error",
      response.status,
      sourceUrl,
    );

    throw new Error(
      "Não foi possível consultar a ONBV.",
    );
  }

  const html =
    await response.text();

  return {
    sourceUrl,
    verses:
      parseEbibleChapter(
        html,
      ),
  };
}

Deno.serve(
  async (
    req: Request,
  ) => {
    if (
      req.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        },
      );
    }

    if (
      req.method !==
      "POST"
    ) {
      return json(
        {
          error:
            "Método não permitido.",
        },
        405,
      );
    }

    try {
      const body =
        await req.json();

      const versionKey =
        String(
          body?.versao ??
          "",
        ).toUpperCase();

      const version =
        allowedVersions[
          versionKey as
            keyof typeof allowedVersions
        ];

      if (!version) {
        return json(
          {
            error:
              "Tradução não suportada.",
          },
          400,
        );
      }

      const internalBookCode =
        String(
          body?.livroCodigo ??
          "",
        ).toUpperCase();

      const book =
        books[
          internalBookCode
        ];

      if (!book) {
        return json(
          {
            error:
              "Livro bíblico não suportado.",
          },
          400,
        );
      }

      const chapter =
        Number(
          body?.capitulo,
        );

      if (
        !Number.isInteger(
          chapter,
        ) ||
        chapter < 1 ||
        chapter > 150
      ) {
        return json(
          {
            error:
              "Capítulo inválido.",
          },
          400,
        );
      }

      const upstream =
        versionKey ===
        "ALM1911"
          ? await fetchAlmeida1911(
              book.number,
              chapter,
            )
          : await fetchOnbv(
              book.usfm,
              chapter,
            );

      if (
        upstream.verses
          .length === 0
      ) {
        return json(
          {
            error:
              "Não foi possível interpretar o capítulo.",
          },
          502,
        );
      }

      const wanted =
        requestedVerseNumbers(
          body,
        );

      const verses =
        wanted.size > 0
          ? upstream.verses
              .filter(
                (
                  verse,
                ) =>
                  wanted.has(
                    verse.numero,
                  ),
              )
          : upstream.verses;

      if (
        verses.length === 0
      ) {
        return json(
          {
            error:
              "Versículo não encontrado.",
          },
          404,
        );
      }

      return json({
        versao:
          versionKey,

        fonte:
          version.label,

        fonteUrl:
          upstream
            .sourceUrl,

        versos:
          verses,
      });
    } catch (
      error
    ) {
      console.error(
        "bible-passage error",
        error,
      );

      return json(
        {
          error:
            error instanceof
              Error
              ? error.message
              : "Erro ao consultar o texto bíblico.",
        },
        500,
      );
    }
  },
);
