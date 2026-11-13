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

- Visitantes sem conta vêem na página inicial só uma pré-visualização (rota, peso, data e valor das entradas aprovadas; nunca nome, contacto nem descrição). Quem quer pedir um envio ou viajar é levado ao registo e, depois de confirmar o email, volta ao formulário. Conta com email verificado para ver o quadro completo e publicar. Um único login; o papel `admin` dá acesso ao painel da equipa.
- Pedidos de envio, viagens, quadro público filtrável, "Os meus", calculadora de referência, painel da equipa (verificação, entregas, análise, economia, definições).
- Stack: Next.js 16, React 19, Supabase (Postgres, Auth, RLS).
- Todas as pessoas são identificadas uma só vez, logo após confirmarem o email: telefone, número e foto do BI, e, se quiserem, número e foto do passaporte. Os números guardam-se cifrados (AES-256-GCM, chave PII_KEY só na app) e as fotos em armazenamento privado (bucket ids); só a equipa os vê, e cada consulta fica no registo da app. Quem viaja junta, por viagem, a foto do bilhete e as datas de ida e regresso, e uma viagem não se aprova sem a equipa confirmar a identificação e o bilhete. Há ainda uma foto de perfil (bucket avatars), privada.
- Entregas: a equipa liga um pedido a um viajante e confirma o pagamento recebido (transferência, Multicaixa ou numerário, fora da app): o valor fica **retido** na carteira (registo de valores, não é uma instituição de pagamento) e nasce um código de entrega de 6 dígitos que só quem enviou vê. O entregador pega a encomenda na app (aceitando partilhar a localização); quem enviou e a equipa vêem a posição dele em mapa, em directo, só enquanto a entrega está em trânsito (apagada ao terminar; só funciona com a página aberta no navegador). Quem recebe dá o código e o entregador confirma; a equipa paga ao viajante por fora e marca como pago.
- **Não existe ainda**: processador de pagamentos licenciado (o dinheiro entra e sai por fora da app, confirmado à mão pela equipa) e seguimento da localização em segundo plano (exigiria app nativa). O código de entrega não está implementado.
- Avaliações: depois de uma entrega marcada como entregue, as duas partes avaliam-se (1 a 5 estrelas, comentário opcional privado). Cada pessoa tem duas classificações, como entregador e como remetente. O início mostra os 3 melhores de cada função, ordenados por média ponderada. O quadro conta só o mês corrente e recomeça no dia 1, e atualiza-se em tempo real sempre que alguém recebe uma avaliação (Supabase Realtime, com atualização de reserva a cada minuto). Prémio (política do dono): o 1.º entregador e o 1.º remetente do mês, com pelo menos 3 avaliações recebidas no mês, ficam o mês seguinte sem pagar a taxa da Kamba. Desempate: em média igual ganha quem tem menos entregas avaliadas no mês. A isenção é automática: ao criar a entrega, a base de dados (deal_fee_waived) devolve comissão 0 se o entregador ganhou como entregador, ou o remetente ganhou como remetente, no mês anterior. Sem avaliações reais o quadro fica vazio: nunca se inventam classificações.
- Taxa da Kamba (comissão) e preço de referência por kg são configuráveis no painel.

## Interface

Modo claro e modo escuro (segue o sistema por defeito; a pessoa pode escolher, e a escolha fica no dispositivo). "Deixe o seu feedback" (/feedback) está aberto a todos; a equipa lê e gere no painel (separador Feedback).

## Brand Commitments

Origem do nome (confirmada pelo dono): "Kamba" quer dizer amigo em kimbundu. A marca fala assim: o amigo que leva a tua encomenda. Marca (criada com o dono, a manter): um K em forma de etiqueta de bagagem (canto inferior esquerdo bem arredondado) cujo braço superior é um avião de papel. Amarelo (#FFC52A) com o K em azul-noite (#0D1530). O nome escreve-se "Kamba" na cor do texto e "Traz" a amarelo. Componente em src/components/Logo.tsx; ficheiros em src/app (icon.svg, favicon.ico, apple-icon.png, opengraph-image.png, manifest.ts) e public (icon-*.png).

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
