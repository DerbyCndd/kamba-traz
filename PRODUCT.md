# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dois lados com o mesmo peso (confirmado pelo dono do produto):

- **Quem envia**: pessoas em Portugal (diáspora) que precisam de mandar encomendas para família ou negócio em Angola e não querem esperar semanas por um envio comercial.
- **Quem viaja**: viajantes entre Portugal e Angola com espaço livre na mala que querem rentabilizá-lo.

Ambos usam o telemóvel, muitas vezes com WhatsApp como canal principal. A equipa da Kamba Traz (administradores) analisa e acompanha cada entrada.

## Product Purpose

Ligar quem precisa de enviar com quem já tem a viagem marcada. A equipa analisa cada pedido e cada viagem antes de aparecer no quadro, liga as duas partes e acompanha a entrega. Sucesso: entregas concluídas sem incidentes e a equipa a gerir o volume sem folhas de cálculo.

## Positioning

Uma plataforma com revisão humana de cada entrada e o contacto das pessoas escondido do público (o quadro mostra só o primeiro nome). Não é um marketplace aberto.

## Operating Context

- Cada entrada nasce "em verificação" e só aparece no quadro depois de a equipa a aprovar.
- A equipa contacta as pessoas pelo número que deixaram (WhatsApp/telefone).
- Os contactos só são partilhados entre as partes depois de haver acordo.
- Moeda: kwanza (Kz) para o transporte; euros (€) para o valor do item.
- Cidades de origem e destino em lista fechada (Portugal e Angola, mais "outra").

## Capabilities and Constraints

- Conta com email verificado para ver o quadro e publicar. Um único login; o papel `admin` dá acesso ao painel da equipa.
- Pedidos de envio, viagens, quadro público filtrável, "Os meus", calculadora de referência, painel da equipa (verificação, entregas, análise, economia, definições).
- Stack: Next.js 16, React 19, Supabase (Postgres, Auth, RLS).
- **Não existe ainda**: pagamento em garantia e verificação de identidade/bilhete dos viajantes. A app não tem código de pagamento. O código de entrega não está implementado.
- Taxa da Kamba (comissão) e preço de referência por kg são configuráveis no painel.

## Brand Commitments

Só o nome "Kamba Traz" é obrigatório. O dono deu liberdade para redesenhar paleta, tipografia e cartões. Idioma: português de Portugal.

## Evidence on Hand

Não há testemunhos, clientes, números de entregas nem preços reais. Nada disto pode ser inventado. Os registos marcados "EXEMPLO" são demonstrações.

## Product Principles

1. Não prometer o que ainda não existe: garantia de pagamento e verificação de identidade só aparecem como "em preparação" até estarem feitas.
2. Revisão humana primeiro: a equipa é parte do produto, não um detalhe interno.
3. Privacidade por defeito: contactos nunca públicos, quadro com primeiro nome.
4. Os dois lados (quem envia e quem viaja) têm o mesmo destaque.
5. Pensado para o telemóvel e para pessoas que preferem o WhatsApp a formulários longos.

## Accessibility & Inclusion

Nenhum requisito formal indicado. Mínimo assumido: contraste legível, foco visível, formulários com erros anunciados, respeito por `prefers-reduced-motion`.
