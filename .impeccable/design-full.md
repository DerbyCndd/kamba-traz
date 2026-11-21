---
name: Kamba Traz
description: O amigo que leva a tua encomenda: uma app calorosa e clara que liga quem envia a quem viaja, com a equipa sempre à vista.
colors:
  primary: "#FFC52A"
  on-primary: "#16110A"
  brand-night: "#0D1530"
  paper-light: "#F6F7FB"
  card-light: "#FFFFFF"
  raised-light: "#EEF0F6"
  ink-light: "#111827"
  muted-light: "#5A6480"
  line-light: "#E3E7F0"
  edge-light: "#CBD2E2"
  accent-text-light: "#8A5E00"
  paper-dark: "#0B0F1A"
  card-dark: "#121827"
  raised-dark: "#171E31"
  ink-dark: "#E9EDF6"
  muted-dark: "#8B96B0"
  line-dark: "#1F2841"
  edge-dark: "#2B3653"
  ok-light: "#167A4A"
  ok-bg-light: "#E2F5EA"
  warn-light: "#8A5A00"
  warn-bg-light: "#FFF1CC"
  bad-light: "#B3261E"
  bad-bg-light: "#FDE8E6"
  info-light: "#2F4BB5"
  info-bg-light: "#E7ECFF"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Segoe UI, Arial, sans-serif"
    fontSize: "3.375rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, Segoe UI, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, Segoe UI, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Public Sans, Segoe UI, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Public Sans, Segoe UI, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
  data:
    fontFamily: "Geist Mono, Consolas, Courier New, monospace"
    fontSize: "1.625rem"
    fontWeight: 700
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  full: "99px"
spacing:
  hair: "6px"
  tight: "10px"
  base: "16px"
  card: "22px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: "46px"
  button-primary-small:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
    height: "38px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: "46px"
  panel:
    backgroundColor: "{colors.card-light}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.lg}"
    padding: "22px"
  input:
    backgroundColor: "{colors.card-light}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    height: "46px"
  pill-ok:
    backgroundColor: "{colors.ok-bg-light}"
    textColor: "{colors.ok-light}"
    rounded: "{rounded.full}"
    padding: "5px 9px"
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: "4px 7px"
---

# Design System: Kamba Traz

## Overview

**Creative North Star: "O Amigo da Mala"**

A Kamba Traz fala como um amigo de confiança: o amigo que leva a tua encomenda. Daí vem a mala amarela da marca e o nome (Kamba quer dizer amigo em kimbundu). O desenho é caloroso e claro, feito para quem usa o telemóvel e prefere o WhatsApp a formulários longos. É uma ferramenta de trabalho, não um cartaz: as pessoas vêm cumprir uma tarefa (pedir, combinar, acompanhar), por isso a familiaridade vale mais do que a surpresa.

A equipa é parte do produto e aparece à vista, com linguagem simples e estados que se leem de relance. O amarelo é raro e quer dizer sempre o mesmo: aqui há uma ação ou um estado que importa. Tudo o resto é neutro, com cantos suaves e muito ar, em modo claro ou escuro conforme o sistema da pessoa.

**Key Characteristics:**
- Calor sem enfeite: cantos suaves (10 a 14 px), texto grande e legível, um único amarelo.
- Controlos padrão e previsíveis, com o mesmo vocabulário em todos os ecrãs.
- Estados em pílulas de cor semântica (feito, à espera, problema, informação), nunca só por cor.
- Dois lados com o mesmo peso: quem envia e quem viaja têm sempre o mesmo destaque.
- Plano por defeito: separa-se com linhas finas e camadas de tom, não com sombras.

## Colors

Uma paleta contida: um amarelo-sol sobre neutros azulados, com quatro cores de estado. A app segue o modo claro ou escuro do sistema (e a pessoa pode escolher), por isso cada neutro existe nos dois modos.

### Primary
- **Amarelo-Sol** (#FFC52A): é a cor da marca e da ação. Usa-se nos botões principais, no item atual, nos números de pendentes, no cursor de escrita e no anel de foco. É igual nos dois modos. O texto por cima é sempre o **Castanho-Noite** (#16110A).

### Secondary
- **Azul-Noite** (#0D1530): fundo da marca (a mala amarela sobre azul-noite) e do ícone da app. Não se usa como cor de interface.

### Neutral
- **Papel** (#F6F7FB claro, #0B0F1A escuro): o fundo da página.
- **Cartão** (#FFFFFF claro, #121827 escuro): painéis, cartões e campos.
- **Camada Elevada** (#EEF0F6 claro, #171E31 escuro): cabeçalhos de blocos, estado ao passar o rato.
- **Tinta** (#111827 claro, #E9EDF6 escuro): texto principal.
- **Tinta Calada** (#5A6480 claro, #8B96B0 escuro): texto secundário, rótulos e ajudas.
- **Linha** (#E3E7F0 claro, #1F2841 escuro) e **Contorno** (#CBD2E2 claro, #2B3653 escuro): separadores e bordas dos controlos.
- **Texto de Acento** (#8A5E00 claro, #FFC52A escuro): o amarelo usado como texto, escurecido no modo claro para ter contraste.

### Estados
- **Verde de Feito** (#167A4A sobre #E2F5EA): concluído, confirmado, aberto.
- **Âmbar de Espera** (#8A5A00 sobre #FFF1CC): à espera, por confirmar, em verificação.
- **Vermelho de Problema** (#B3261E sobre #FDE8E6): recusado, erro, denúncia.
- **Azul de Informação** (#2F4BB5 sobre #E7ECFF): informação neutra.

### Named Rules
**The One Yellow Rule.** O amarelo aparece só em ações principais, no item atual e em números de pendentes. Nunca decora um fundo, uma ilustração ou um estado inativo. A sua raridade é o que lhe dá sentido.

**The Never-Color-Alone Rule.** Um estado nunca se diz só pela cor: leva sempre texto («À espera», «Confirmada»), e os números de pendentes têm também texto para leitores de ecrã.

## Typography

**Display Font:** Bricolage Grotesque (com Segoe UI e Arial como reserva)
**Body Font:** Public Sans (com Segoe UI e Arial como reserva)
**Label/Mono Font:** Geist Mono, só para códigos, contagens e números de dados

**Character:** Um título com personalidade e um texto corrido neutro e muito legível. A Bricolage dá o calor e o toque de marca; a Public Sans faz o trabalho de todos os dias sem dar nas vistas.

### Hierarchy
- **Display** (700, 34 a 54 px consoante o ecrã, 1.12): só o título principal da página inicial.
- **Headline** (700, 22 a 28 px, 1.12): título de cada página.
- **Title** (600, 17 px, 1.12): título de cartões e blocos.
- **Body** (400, 16 px, 1.6): texto corrido. Mantém a medida entre 65 e 75 caracteres.
- **Label** (500, 13 px, 1.3): rótulos de campos, ajudas e texto secundário, na Tinta Calada.
- **Pílula** (500, 11.5 px, maiúsculas, espaçamento 0.02em): estados.

### Named Rules
**The Plain Language Rule.** Os botões e rótulos dizem a ação («Pedir envio», «Guardar e continuar»), em português de Portugal, sem jargão.

**The Balanced Heading Rule.** Os títulos usam `text-wrap: balance` e o texto corrido `text-wrap: pretty`, para não deixar palavras sozinhas em linhas.

## Layout

Duas estruturas, conforme a pessoa tem sessão ou não. **Sem sessão:** uma barra no topo (logótipo, quatro ligações, entrar e criar conta) e uma coluna central de até cerca de 1040 px. **Com sessão:** uma barra lateral fixa de 248 px à esquerda (os dois botões «Pedir envio» e «Vou viajar» com o mesmo destaque, um bloco «A minha atividade» com 5 ligações e números de pendentes, a «Ajuda» recolhida, e a equipa à parte) e o conteúdo à direita, com um máximo de 1000 px.

Abaixo de 900 px a barra lateral desaparece e entra uma barra de baixo com cinco destinos (Quadro, Propostas, Entregas, Pedir, Viajar), mais um menu da conta no topo. Há outros pontos de quebra a 760 e 560 px. A comparação com uma barra no topo para quem tem sessão mostrou que não cabe com tudo ao mesmo nível, por isso fica a lateral.

O ritmo é generoso: espaços de 6, 10, 16 e 22 px, margem lateral de 20 px, e zonas de toque de 38 a 46 px de altura. Os campos de formulário ocupam a largura e agrupam-se em blocos com título.

## Elevation & Depth

Plano por defeito. A separação faz-se com linhas finas de 1 px (Linha e Contorno) e com camadas de tom (Papel, Cartão, Camada Elevada), não com sombras. As únicas sombras são funcionais: o menu que se abre por cima do conteúdo e o halo de foco.

### Shadow Vocabulary
- **Menu flutuante** (`box-shadow: 0 6px 18px rgba(0,0,0,.25)`): apenas para menus e janelas que se abrem por cima do resto.
- **Halo de foco** (`box-shadow: 0 0 0 5px color-mix(in srgb, var(--sun) 30%, transparent)`): realce do controlo selecionado.

### Named Rules
**The Flat-By-Default Rule.** Uma superfície em repouso é plana. A sombra só aparece como resposta a algo que flutua ou que está em foco.

## Shapes

Cantos suaves e consistentes: **10 px** para botões, campos e itens de navegação, **14 px** para painéis e cartões, **6 px** para caixas de seleção, **99 px** (pílula total) para estados e números de pendentes. Os círculos são só para avatares e botões redondos. Os campos de formulário e os botões têm sempre a mesma altura (46 px, ou 38 px na versão pequena) e uma borda de 1 px.

## Components

### Buttons
- **Shape:** cantos suaves (10 px), altura 46 px, ou 38 px na versão pequena.
- **Primary:** fundo Amarelo-Sol, texto Castanho-Noite, em negrito médio, com padding 10 px 20 px. Ao passar o rato, um amarelo ligeiramente mais claro.
- **Secondary:** sem fundo, borda de 1 px no Contorno, texto na Tinta. Ao passar o rato, fica na Camada Elevada.
- **Danger / Ghost:** o perigoso usa o Vermelho de Problema na borda e no texto; o discreto não tem borda.
- **Disabled:** meia opacidade e cursor de bloqueado.
- **Regra dos dois lados:** «Pedir envio» e «Vou viajar» usam sempre o mesmo estilo e o mesmo destaque.

### Pills (estados)
- **Style:** pílula total, 11.5 px, maiúsculas, fundo suave da cor do estado e texto na versão forte dessa cor.
- **Variants:** verde (feito), âmbar (espera), vermelho (problema), azul (informação), contornada neutra (exemplo).

### Badges (números de pendentes)
- **Style:** pílula amarela com o número em Castanho-Noite, ao lado do nome da ligação. Têm sempre texto escondido para leitores de ecrã («2 pendentes»).

### Cards / Containers
- **Corner Style:** 14 px.
- **Background:** Cartão, com borda de 1 px na Linha.
- **Shadow Strategy:** nenhuma (ver Elevation & Depth).
- **Internal Padding:** 22 px nos painéis, com 16 px de intervalo entre blocos. Não se aninham cartões dentro de cartões.

### Inputs / Fields
- **Style:** fundo Cartão, borda de 1 px no Contorno, 10 px de raio, altura 46 px, texto de 16 px.
- **Focus:** borda amarela e um anel de 2 px do mesmo amarelo a 35%, sem deslocamento. O cursor de escrita é amarelo.
- **Error / Disabled:** a borda passa ao Vermelho de Problema e o erro aparece escrito logo abaixo, com o primeiro erro a receber o foco.

### Navigation
- **Barra lateral:** itens de 42 px de altura com ícone de 20 px, rótulo e número de pendentes à direita. O item atual fica no fundo Cartão e na Tinta; os outros na Tinta Calada. Os blocos têm título pequeno em maiúsculas, e a ajuda recolhe-se numa secção que abre sozinha quando se está numa das suas páginas.
- **Barra de baixo (telemóvel):** cinco destinos com ícone e rótulo, o atual na Tinta.
- **Separadores:** linha de 1 px por baixo, e o separador atual com um traço amarelo de 2 px.

### Estados de foco
- **Anel de foco** de 2 px no amarelo de foco, com 3 px de afastamento, em todos os elementos interativos.

## Do's and Don'ts

### Do:
- **Do** usar o amarelo só em ações principais, no item atual e em números de pendentes (The One Yellow Rule).
- **Do** dar o mesmo destaque a «Pedir envio» e «Vou viajar»: os dois lados pesam o mesmo.
- **Do** dizer sempre o estado por texto e por cor, e dar aos números de pendentes um texto para leitores de ecrã.
- **Do** manter os cantos a 10 px nos controlos e 14 px nos painéis, e a mesma altura de 46 px nos campos e botões.
- **Do** manter o texto corrido entre 65 e 75 caracteres e a 16 px, e os rótulos secundários na Tinta Calada.
- **Do** manter até 5 ligações por bloco da barra lateral, e a ajuda recolhida.
- **Do** respeitar `prefers-reduced-motion` e animar só o que muda de estado, em 150 ms.

### Don't:
- **Don't** usar sombras para separar superfícies: a separação faz-se com linhas e camadas de tom.
- **Don't** pôr amarelo em fundos, ilustrações ou estados inativos.
- **Don't** aninhar cartões dentro de cartões.
- **Don't** dar a quem envia mais destaque do que a quem viaja, nem o contrário.
- **Don't** pôr a navegação principal numa barra no topo para quem tem sessão: não cabe com tudo ao mesmo nível.
- **Don't** usar fontes de título em rótulos, botões ou dados; esses levam a Public Sans (ou a Geist Mono nos números).
- **Don't** inventar controlos novos para tarefas normais: usar os campos, botões e pílulas que já existem.
