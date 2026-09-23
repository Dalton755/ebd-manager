import {
    LegalLayout,
} from "../components/LegalLayout";

import {
    LEGAL_VERSIONS,
} from "../legalVersions";


export function PrivacyPolicyPage() {

    return (
        <LegalLayout
            titulo="Política de Privacidade"
            subtitulo="Como o EBD Manager coleta, usa, armazena, compartilha e protege dados pessoais."
            versao={
                LEGAL_VERSIONS
                    .privacidade
            }
        >

            <section>
                <h2 className="text-lg font-black text-slate-900">
                    1. Escopo
                </h2>

                <p className="mt-2">
                    Esta Política se aplica ao cadastro de acesso, demonstração, adesão, uso da plataforma EBD Manager, suporte, autenticação e operações necessárias à prestação do serviço.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    2. Dados que podem ser tratados
                </h2>

                <ul className="mt-2 list-disc space-y-2 pl-5">
                    <li>dados de conta, como nome, e-mail, telefone e credenciais de autenticação;</li>
                    <li>dados da igreja, como nome, sigla, CNPJ quando informado, telefone e e-mail;</li>
                    <li>dados de alunos, professores e demais pessoas cadastradas pela igreja;</li>
                    <li>registros de aulas, classes, presenças, check-in e assiduidade;</li>
                    <li>localização, quando a igreja habilitar check-in por geolocalização e o usuário autorizar o dispositivo;</li>
                    <li>arquivos e materiais enviados, como PDFs e comprovantes;</li>
                    <li>dados técnicos necessários para sessão, segurança, diagnóstico e prevenção a abusos;</li>
                    <li>informações de assinatura e pagamento necessárias ao fluxo comercial.</li>
                </ul>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    3. Finalidades
                </h2>

                <p className="mt-2">
                    Os dados podem ser utilizados para autenticar usuários, criar e administrar ambientes de igreja, executar recursos contratados, registrar ações, fornecer suporte, proteger contas e infraestrutura, cumprir obrigações legais e viabilizar o relacionamento comercial necessário à prestação do serviço.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    4. Papéis no tratamento
                </h2>

                <p className="mt-2">
                    Em dados de conta, contratação, faturamento, segurança e relacionamento com o cliente, a Nethanel Tecnologia pode atuar como controladora. Em dados de membros, alunos e demais pessoas inseridos para a gestão interna, a igreja normalmente define as finalidades do cadastro e poderá atuar como controladora, enquanto o EBD Manager executa operações necessárias à prestação do serviço de acordo com o contexto e as instruções aplicáveis.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    5. Dados sensíveis e contexto religioso
                </h2>

                <p className="mt-2">
                    Informações que revelem convicção religiosa ou vínculo com organização religiosa podem receber proteção especial pela LGPD. Por isso, igrejas devem limitar a coleta, aplicar acesso restrito e utilizar os registros somente para finalidades legítimas e com fundamento jurídico adequado.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    6. Fornecedores e compartilhamento
                </h2>

                <p className="mt-2">
                    Para operar o serviço podem ser utilizados fornecedores de infraestrutura, banco de dados, hospedagem, autenticação e pagamento, incluindo Supabase, Vercel, Google quando escolhido pelo usuário e Mercado Pago quando houver contratação. O compartilhamento deve se limitar ao necessário para cada finalidade.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    7. Retenção e exclusão
                </h2>

                <p className="mt-2">
                    Dados são mantidos pelo período necessário à prestação do serviço, cumprimento de obrigações, exercício regular de direitos, segurança e demais finalidades legítimas aplicáveis. Ambientes de demonstração são temporários e poderão ser eliminados após o prazo informado.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    8. Segurança
                </h2>

                <p className="mt-2">
                    O EBD Manager utiliza autenticação, segregação por igreja, políticas de acesso no banco de dados, armazenamento privado para determinados arquivos e outras medidas técnicas e administrativas compatíveis com o serviço. Nenhum sistema é totalmente imune a incidentes.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    9. Direitos dos titulares
                </h2>

                <p className="mt-2">
                    Titulares podem exercer os direitos previstos na LGPD conforme a situação aplicável, como confirmação de tratamento, acesso, correção, informações sobre compartilhamento, oposição e outras solicitações previstas em lei.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    10. Transferência internacional
                </h2>

                <p className="mt-2">
                    Fornecedores de tecnologia podem processar ou armazenar dados em infraestrutura localizada fora do Brasil. Quando houver transferência internacional, devem ser observados os requisitos da LGPD e da regulamentação aplicável.
                </p>
            </section>


            <section>
                <h2 className="text-lg font-black text-slate-900">
                    11. Contato
                </h2>

                <p className="mt-2">
                    Solicitações relacionadas à privacidade podem ser encaminhadas pelo canal de suporte do EBD Manager. Quando a solicitação se referir a dados inseridos pela igreja sobre seus próprios membros ou alunos, a igreja poderá ser o primeiro canal responsável pelo atendimento.
                </p>
            </section>

        </LegalLayout>
    );
}
