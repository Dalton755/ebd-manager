# EBD Manager

# Domínio do Sistema

## Objetivo

O EBD Manager é um ERP para gestão da Escola Bíblica Dominical.

Todo o sistema gira em torno da realização da Escola Bíblica em cada domingo.

---

# Entidades

## Pessoa

Representa qualquer pessoa cadastrada no sistema.

Uma pessoa pode exercer uma ou mais funções simultaneamente.

Exemplos:

- Aluno
- Professor
- Superintendente
- Pastor
- Secretário
- Tesoureiro
- Administrador

A pessoa poderá mudar de classe ao longo do tempo sem perder histórico.

---

## Função

Representa o papel desempenhado pela pessoa dentro da Escola Bíblica.

Uma pessoa pode possuir diversas funções simultaneamente.

Exemplo:

Dalton Rocha

- Aluno
- Professor
- Superintendente

---

## Permissão

Representa as ações permitidas no sistema.

Exemplo:

- Gerenciar Pessoas
- Registrar Presença
- Visualizar Financeiro
- Emitir Relatórios

As permissões serão vinculadas às funções.

---

## Classe

Representa uma turma da Escola Bíblica.

Exemplos:

- Infantil
- Adolescentes
- Jovens
- Adultos
- Casais
- Novos Convertidos

Cada classe possui alunos matriculados.

Os professores podem variar conforme a escala.

---

## Matrícula

Representa o vínculo entre uma pessoa e uma classe.

Mantém histórico de movimentações.

Permite saber em qual classe uma pessoa esteve em qualquer período.

---

## Calendário

Representa todos os domingos e eventos oficiais da Escola Bíblica.

Exemplos:

- Escola Bíblica
- Congresso
- Conferência
- Escola Especial
- Cancelamento

Todas as aulas estarão vinculadas ao calendário.

---

## Aula

Representa o planejamento da aula.

Contém:

- Classe
- Lição
- Material
- Objetivos

A aula ainda não representa a execução.

---

## Sessão de Aula

Representa a realização efetiva da aula.

Uma Sessão de Aula contém:

- Data
- Professor responsável
- Classe
- Material utilizado
- Presenças
- Oferta
- Observações
- Horário de início
- Horário de encerramento

Esta será a principal entidade operacional do sistema.

---

## Presença

Representa a participação de uma pessoa em uma Sessão de Aula.

Cada presença possui:

- Pessoa
- Sessão
- Data
- Hora
- Tipo

Tipos:

- Check-in automático
- Presença registrada pelo professor

---

## Material

Arquivos utilizados durante a aula.

Exemplos:

- PDF
- PowerPoint
- Vídeo
- Link externo

---

## Oferta

Valor arrecadado durante uma Sessão de Aula.

---

## Observação da Aula

Informações registradas pelo professor ou superintendente ao final da aula.

Exemplo:

- Visitantes presentes
- Decisões por Cristo
- Problemas ocorridos
- Avisos

---

## Configurações

Armazena parâmetros do sistema.

Exemplos:

- Nome da Igreja
- Logo
- Horário da EBD
- Configurações gerais