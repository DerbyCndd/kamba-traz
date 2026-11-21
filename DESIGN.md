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

<!-- impeccable:design-map -->
Name: Kamba Traz
Colors: primary: primary #FFC52A; secondary: brand-night #0D1530; neutral: on-primary #16110A; state: ok-light #167A4A; neutral: paper-light #F6F7FB; neutral: card-light #FFFFFF (+8 more in the sidecar)
Fonts: Bricolage Grotesque (display, headline, title); Public Sans (body, label); Geist Mono (data)
Spacing: hair 6px, tight 10px, base 16px, card 22px
Radius: sm 6px, md 10px, lg 14px, full 99px
North Star: "O Amigo da Mala"
Rules:
- The One Yellow Rule. O amarelo aparece só em ações principais, no item atual e em números de pendentes.
- The Never-Color-Alone Rule. Um estado nunca se diz só pela cor: leva sempre texto («À espera», «Confirmada»), e os números de pendentes têm também texto para leitores de ecrã.
- The Plain Language Rule. Os botões e rótulos dizem a ação («Pedir envio», «Guardar e continuar»), em português de Portugal, sem jargão.
- The Balanced Heading Rule. Os títulos usam `text-wrap: balance` e o texto corrido `text-wrap: pretty`, para não deixar palavras sozinhas em linhas.
- The Flat-By-Default Rule. Uma superfície em repouso é plana.
Elevation:
- Menu flutuante: 0 6px 18px rgba(0,0,0,.25)
- Halo de foco: 0 0 0 5px color-mix(in srgb, var(--sun) 30%, transparent)
Don't:
- Don't usar sombras para separar superfícies: a separação faz-se com linhas e camadas de tom.
- Don't pôr amarelo em fundos, ilustrações ou estados inativos.
- Don't aninhar cartões dentro de cartões.
- Don't dar a quem envia mais destaque do que a quem viaja, nem o contrário.
- Don't pôr a navegação principal numa barra no topo para quem tem sessão: não cabe com tudo ao mesmo nível.
- Don't usar fontes de título em rótulos, botões ou dados; esses levam a Public Sans (ou a Geist Mono nos números).
- Don't inventar controlos novos para tarefas normais: usar os campos, botões e pílulas que já existem.
Do:
- Do usar o amarelo só em ações principais, no item atual e em números de pendentes (The One Yellow Rule).
- Do dar o mesmo destaque a «Pedir envio» e «Vou viajar»: os dois lados pesam o mesmo.
- Do dizer sempre o estado por texto e por cor, e dar aos números de pendentes um texto para leitores de ecrã.
- (+4 more)
Full: .impeccable/design-full.md (read a section when you need its detail)
