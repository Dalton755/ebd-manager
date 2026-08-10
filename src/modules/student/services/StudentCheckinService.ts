import { StudentCheckinRepository } from "../repositories/StudentCheckinRepository";

export class StudentCheckinService {

    static async buscarAulaDeHoje() {

        const data = this.obterDataLocal();

        return await StudentCheckinRepository.buscarAulaDeHoje(
            data
        );
    }

    static async realizarCheckin(
        pessoaId: string,
        latitude: number,
        longitude: number,
        precisao?: number
    ) {

        const data = this.obterDataLocal();

        // Busca a aula de hoje
        const aula =
            await StudentCheckinRepository.buscarAulaDeHoje(
                data
            );

        if (!aula) {
            throw new Error(
                "Não existe uma aula agendada para hoje."
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
                "Você já realizou o check-in desta aula."
            );
        }

        // Busca a configuração da igreja
        const configuracao =
            await StudentCheckinRepository
                .buscarConfiguracaoCheckin();

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