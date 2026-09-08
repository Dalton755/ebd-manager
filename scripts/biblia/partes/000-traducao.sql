insert into ebd.biblia_traducoes (
    codigo,
    nome,
    idioma,
    provedor,
    licenca,
    fonte,
    atribuicao,
    ativa
)
values (
    'BLIVRE',
    'Bíblia Livre',
    'pt-BR',
    'LOCAL',
    'CC BY 4.0',
    'eBible.org / porbr2018',
    'Bíblia Livre (BLIVRE), disponibilizada sob licença CC BY 4.0.',
    true
)
on conflict (codigo)
do update set
    nome = excluded.nome,
    idioma = excluded.idioma,
    provedor = excluded.provedor,
    licenca = excluded.licenca,
    fonte = excluded.fonte,
    atribuicao = excluded.atribuicao,
    ativa = excluded.ativa;
