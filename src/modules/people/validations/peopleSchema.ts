import { z } from "zod";

export const peopleSchema = z.object({
  nome: z
    .string()
    .min(3, "Informe um nome válido."),

  email: z
    .email("Informe um e-mail válido."),

  telefone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine(
      (v) => v.length === 10 || v.length === 11,
      "Telefone inválido."
    ),
});

export type PeopleFormData = z.infer<typeof peopleSchema>;