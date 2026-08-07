export function maskTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 10) {
    return numeros.replace(
      /^(\d{0,2})(\d{0,4})(\d{0,4}).*/,
      (_, ddd, parte1, parte2) => {
        let resultado = "";

        if (ddd) resultado += `(${ddd}`;
        if (ddd.length === 2) resultado += ") ";

        if (parte1) resultado += parte1;
        if (parte2) resultado += `-${parte2}`;

        return resultado;
      }
    );
  }

  return numeros.replace(
    /^(\d{2})(\d{5})(\d{4}).*/,
    "($1) $2-$3"
  );
}