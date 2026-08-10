import { z } from "zod";

export const classSchema = z.object({
  nome: z
    .string()
    .min(3, "Informe o nome da classe."),

  descricao: z
    .string()
    .optional(),

  idade_minima: z.coerce
    .number()
    .min(0, "Idade mínima inválida."),

  idade_maxima: z.coerce
    .number()
    .min(0, "Idade máxima inválida."),

  cor: z.string().optional(),
});

export type ClassFormData = z.infer<typeof classSchema>;