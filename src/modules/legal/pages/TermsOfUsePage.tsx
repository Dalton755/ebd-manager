import {
    LegalLayout,
} from "../components/LegalLayout";

import {
    LEGAL_VERSIONS,
} from "../legalVersions";


export function TermsOfUsePage() {

    return (
        <LegalLayout
            titulo="Termos de Uso"
            subtitulo="Regras para utilização do EBD Manager por usuários, responsáveis e igrejas."
            versao={
                LEGAL_VERSIONS
                    .termos
            }
        >

            <section>
                <h2 className="text-lg font-black text-slate-900">
                    1. Sobre o EBD Manager
                </h2>

                <p className="mt-2">
                    O EBD Manager é uma plataforma de apoio à gestão da Escola Bíblica, com recursos para pessoas, classes, aulas, presença, relatórios, apresentações em PDF, notificações, gestão financeira e outras funções disponibilizadas conforme o plano contratado.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    2. Conta e responsabilidade de acesso
                </h2>

                <p className="mt-2">
                    Cada usuário deve utilizar dados adequados, manter suas credenciais protegidas e comunicar acessos indevidos. O compartilhamento de contas que comprometa a rastreabilidade das ações pode resultar em medidas de segurança.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    3. Demonstração
                </h2>

                <p className="mt-2">
                    A demonstração utiliza dados fictícios e existe para avaliação do produto. O visitante recebe um ambiente privado e temporário, pode navegar pelos recursos e importar um PDF próprio para testar a experiência. O ambiente demonstrativo poderá ser encerrado ou eliminado após o prazo informado.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    4. Adesão, planos e pagamento
                </h2>

                <p className="mt-2">
                    O ambiente real da igreja é criado somente após a decisão de adesão. Preços, limites, recursos e periodicidade são os apresentados na oferta escolhida no momento da contratação. Quando houver cobrança, o pagamento poderá ser processado por provedor especializado, como o Mercado Pago.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    5. Responsabilidade da igreja sobre seus cadastros
                </h2>

                <p className="mt-2">
                    A igreja é responsável por definir quais pessoas e informações serão cadastradas, as finalidades do uso, os perfis autorizados e as bases legais aplicáveis. Isso exige cuidado especial quando houver dados de crianças, adolescentes ou informações capazes de revelar convicção ou vínculo religioso.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    6. Materiais e direitos autorais
                </h2>

                <p className="mt-2">
                    Quem envia PDFs, imagens, links ou outros materiais declara possuir autorização para utilizá-los. A plataforma não concede direitos sobre conteúdos de terceiros e poderá remover materiais quando houver determinação legal ou evidência consistente de uso indevido.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    7. Uso proibido
                </h2>

                <p className="mt-2">
                    Não é permitido usar a plataforma para invadir contas, contornar controles de acesso, distribuir código malicioso, violar direitos de terceiros, praticar ilícitos, coletar dados sem fundamento legítimo ou comprometer a infraestrutura do serviço.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    8. Disponibilidade e evolução
                </h2>

                <p className="mt-2">
                    O serviço pode receber melhorias, correções e manutenções. Buscamos preservar continuidade e dados, mas podem ocorrer indisponibilidades temporárias por manutenção, falhas de fornecedores, eventos de segurança ou fatores fora do controle razoável da plataforma.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    9. Proteção de dados
                </h2>

                <p className="mt-2">
                    O tratamento de dados relacionado ao EBD Manager deve observar a Política de Privacidade, as informações sobre LGPD e a legislação brasileira aplicável. A igreja e a Nethanel Tecnologia podem assumir papéis distintos de acordo com a operação de tratamento realizada.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    10. Lei aplicável
                </h2>

                <p className="mt-2">
                    Estes Termos são regidos pela legislação brasileira, sem prejuízo de direitos do consumidor ou de regras obrigatórias de competência quando aplicáveis.
                </p>
            </section>

        </LegalLayout>
    );
}
