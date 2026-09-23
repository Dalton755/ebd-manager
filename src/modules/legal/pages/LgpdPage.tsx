import {
    LegalLayout,
} from "../components/LegalLayout";

import {
    LEGAL_VERSIONS,
} from "../legalVersions";


export function LgpdPage() {

    return (
        <LegalLayout
            titulo="LGPD no EBD Manager"
            subtitulo="Informações práticas sobre proteção de dados para igrejas que utilizam a plataforma."
            versao={
                LEGAL_VERSIONS
                    .lgpd
            }
        >

            <section>
                <h2 className="text-lg font-black text-slate-900">
                    1. Por que este cuidado é importante
                </h2>

                <p className="mt-2">
                    O EBD Manager pode armazenar informações de membros, alunos, professores e responsáveis. Dados que revelem convicção religiosa ou vínculo com organização religiosa podem ser classificados como dados pessoais sensíveis, exigindo cuidado reforçado.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    2. Igreja como responsável pelas decisões
                </h2>

                <p className="mt-2">
                    A igreja deve definir quais dados realmente precisa cadastrar, por que precisa deles, quem poderá acessar, por quanto tempo serão mantidos e qual hipótese legal sustenta a operação. A plataforma não substitui essa análise.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    3. Boas práticas no uso da plataforma
                </h2>

                <ul className="mt-2 list-disc space-y-2 pl-5">
                    <li>coletar apenas dados necessários para a gestão da EBD;</li>
                    <li>informar com clareza as finalidades do cadastro;</li>
                    <li>restringir perfis e permissões ao mínimo necessário;</li>
                    <li>manter informações corretas e atualizadas;</li>
                    <li>evitar exportações ou cópias desnecessárias;</li>
                    <li>proteger contas administrativas e revisar acessos periodicamente.</li>
                </ul>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    4. Crianças e adolescentes
                </h2>

                <p className="mt-2">
                    Quando a EBD atende crianças ou adolescentes, a igreja deve considerar as regras específicas aplicáveis, o melhor interesse do titular e a participação de pais ou responsáveis quando exigida. Dados de menores não devem ser coletados em excesso.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    5. Geolocalização e check-in
                </h2>

                <p className="mt-2">
                    O recurso de localização deve ser utilizado apenas quando necessário à finalidade de check-in definida pela igreja. O acesso depende da autorização no dispositivo e não deve ser reutilizado para finalidades incompatíveis.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    6. Direitos dos titulares
                </h2>

                <p className="mt-2">
                    A LGPD prevê direitos relacionados ao tratamento de dados pessoais. A igreja deve manter um canal apropriado para receber solicitações relativas aos dados sob sua responsabilidade, e o EBD Manager deve colaborar dentro de seu papel no tratamento.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    7. Segurança e incidentes
                </h2>

                <p className="mt-2">
                    Suspeitas de acesso indevido, conta comprometida ou exposição de dados devem ser comunicadas rapidamente. Incidentes com risco ou dano relevante podem exigir avaliação e providências conforme a LGPD e orientações da ANPD.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    8. Referências oficiais
                </h2>

                <p className="mt-2">
                    Esta página é um resumo operacional e não substitui análise jurídica. Para orientação normativa, consulte a Lei nº 13.709/2018 e os materiais publicados pela Autoridade Nacional de Proteção de Dados.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                    <a
                        href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm"
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-slate-200 px-3 py-2 font-bold text-blue-600"
                    >
                        Lei nº 13.709/2018
                    </a>

                    <a
                        href="https://www.gov.br/anpd/"
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-slate-200 px-3 py-2 font-bold text-blue-600"
                    >
                        ANPD
                    </a>
                </div>
            </section>

        </LegalLayout>
    );
}
