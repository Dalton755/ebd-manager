import { StudentCheckinRepository } from "../repositories/StudentCheckinRepository";

export class StudentCheckinService {

    static async buscarAulaDeHoje(
        igrejaId: string,
        classeId: string
    ) {

        const data =
            this.obterDataLocal();

        return await StudentCheckinRepository
            .buscarAulaDeHoje(
                data,
                igrejaId,
                classeId
            );
    }

    static async buscarSituacaoAulaHoje(
        pessoaId: string,
        igrejaId: string,
        classeId: string
    ) {

        const aula =
            await this.buscarAulaDeHoje(
                igrejaId,
                classeId
            );


        if (!aula) {

            return {
                aula: null,
                checkinDisponivel: false,
                presencaRegistrada: false,
                mensagem:
                    "Não há aula agendada para hoje.",
            };

        }


        const janela =
            this.verificarJanelaCheckin(
                aula
            );


        const presenca =
            await StudentCheckinRepository
                .verificarCheckinDaAula(
                    pessoaId,
                    aula.id
                );


        return {
            aula,

            checkinDisponivel:
                janela.permitido,

            presencaRegistrada:
                !!presenca,

            mensagem:
                janela.permitido
                    ? "Check-in disponível."
                    : janela.mensagem,
        };
    }

    static verificarJanelaCheckin(
        aula: {
            hora_inicio: string | null;
            hora_fim: string | null;
        }
    ) {

        if (
            !aula.hora_inicio ||
            !aula.hora_fim
        ) {
            return {
                permitido: false,
                mensagem:
                    "O horário desta aula ainda não foi definido.",
            };
        }

        const inicioAula =
            this.converterHoraParaMinutos(
                aula.hora_inicio
            );

        const fimAula =
            this.converterHoraParaMinutos(
                aula.hora_fim
            );

        // Check-in abre 30 minutos antes
        const aberturaCheckin =
            inicioAula - 30;

        // Check-in fecha 30 minutos depois
        const fechamentoCheckin =
            fimAula + 30;

        const agora = new Date();

        const minutosAtuais =
            agora.getHours() * 60 +
            agora.getMinutes();

        if (
            minutosAtuais <
            aberturaCheckin
        ) {
            return {
                permitido: false,
                mensagem:
                    `O check-in estará disponível a partir das ${this.formatarMinutos(aberturaCheckin)}.`,
            };
        }

        if (
            minutosAtuais >
            fechamentoCheckin
        ) {
            return {
                permitido: false,
                mensagem:
                    `O período de check-in foi encerrado às ${this.formatarMinutos(fechamentoCheckin)}.`,
            };
        }

        return {
            permitido: true,
            mensagem: "",
        };
    }

    static async realizarCheckin(
        pessoaId: string,
        igrejaId: string,
        classeId: string,
        latitude: number,
        longitude: number,
        precisao?: number
    ) {

        const data =
            this.obterDataLocal();

        // Primeiro busca a aula de hoje
        const aula =
            await StudentCheckinRepository
                .buscarAulaDeHoje(
                    data,
                    igrejaId,
                    classeId
                );

        if (!aula) {
            throw new Error(
                "Não existe uma aula agendada para hoje."
            );
        }

        // Depois valida a janela usando
        // o horário definido para essa aula
        const janela =
            this.verificarJanelaCheckin(
                aula
            );

        if (!janela.permitido) {
            throw new Error(
                janela.mensagem
            );
        }

        // Verifica se o aluno já fez check-in nesta aula
        const checkinExistente =
            await StudentCheckinRepository
                .verificarCheckinDaAula(
                    pessoaId,
                    aula.id
                );

        if (checkinExistente) {
            throw new Error(
                "Sua presença nesta aula já foi registrada."
            );
        }

        // Busca a configuração da igreja
        const configuracao =
            await StudentCheckinRepository
                .buscarConfiguracaoCheckin(
                    igrejaId
                );

        if (!configuracao) {
            throw new Error(
                "Configuração de localização não encontrada."
            );
        }

        // Calcula a distância entre aluno e igreja
        const distanciaMetros =
            this.calcularDistancia(
                latitude,
                longitude,
                configuracao.latitude,
                configuracao.longitude
            );

        const localizacaoStatus =
            distanciaMetros <= configuracao.raio_metros
                ? "DENTRO"
                : "FORA";

        // Registra o check-in vinculado à aula
        return await StudentCheckinRepository.registrar({
            pessoa_id: pessoaId,
            aula_id: aula.id,
            data,
            tipo_registro: "CHECKIN",
            latitude,
            longitude,
            precisao: precisao ?? null,
            distancia_metros: Math.round(
                distanciaMetros
            ),
            localizacao_status: localizacaoStatus,
        });
    }

    private static converterHoraParaMinutos(
        horario: string
    ): number {

        const [hora, minuto] =
            horario
                .slice(0, 5)
                .split(":")
                .map(Number);

        return hora * 60 + minuto;
    }

    private static formatarMinutos(
        totalMinutos: number
    ): string {

        const minutosDoDia =
            ((totalMinutos % 1440) + 1440) %
            1440;

        const hora =
            Math.floor(
                minutosDoDia / 60
            );

        const minuto =
            minutosDoDia % 60;

        return `${String(hora).padStart(
            2,
            "0"
        )}:${String(minuto).padStart(
            2,
            "0"
        )}`;
    }

    private static obterDataLocal() {

        const agora = new Date();

        const ano = agora.getFullYear();

        const mes = String(
            agora.getMonth() + 1
        ).padStart(2, "0");

        const dia = String(
            agora.getDate()
        ).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    private static calcularDistancia(
        latitude1: number,
        longitude1: number,
        latitude2: number,
        longitude2: number
    ): number {

        const raioTerra = 6371000;

        const grausParaRadiano =
            (graus: number) =>
                graus * (Math.PI / 180);

        const diferencaLatitude =
            grausParaRadiano(
                latitude2 - latitude1
            );

        const diferencaLongitude =
            grausParaRadiano(
                longitude2 - longitude1
            );

        const a =
            Math.sin(
                diferencaLatitude / 2
            ) *
            Math.sin(
                diferencaLatitude / 2
            ) +
            Math.cos(
                grausParaRadiano(latitude1)
            ) *
            Math.cos(
                grausParaRadiano(latitude2)
            ) *
            Math.sin(
                diferencaLongitude / 2
            ) *
            Math.sin(
                diferencaLongitude / 2
            );

        const c =
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

        return raioTerra * c;
    }
}