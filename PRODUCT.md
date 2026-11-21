# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dois lados com o mesmo peso (confirmado pelo dono do produto):

- **Quem envia**: pessoas em Portugal (diáspora) que precisam de mandar encomendas para família ou negócio em Angola e não querem esperar semanas por um envio comercial.
- **Quem viaja**: viajantes entre Portugal e Angola com espaço livre na mala que querem rentabilizá-lo.

Ambos usam o telemóvel, muitas vezes com WhatsApp como canal principal. A equipa da Kamba Traz (administradores) analisa e acompanha cada entrada. Há um dono da equipa, que é quem escolhe quem entra e sai dela.

## Product Purpose

Ligar quem precisa de enviar com quem já tem a viagem marcada. A equipa analisa cada pedido e cada viagem antes de aparecer no quadro, liga as duas partes e acompanha a entrega. Sucesso: entregas concluídas sem incidentes e a equipa a gerir o volume sem folhas de cálculo.

## Positioning

Uma plataforma com revisão humana de cada entrada e o contacto das pessoas escondido do público (o quadro mostra só o primeiro nome). Não é um marketplace aberto. Os contactos entre as duas partes só se mostram depois de o pagamento ficar retido, e deixam de se mostrar quando a entrega termina: a app é o caminho do negócio, não um anúncio de contactos.

## Operating Context

- Cada entrada nasce "em verificação" e só aparece no quadro depois de a equipa a aprovar.
- A equipa contacta as pessoas pelo número que deixaram (WhatsApp/telefone).
- Moeda: kwanza (Kz) para o transporte. O valor do item escreve-se na moeda do país de origem (euros, libras, reais, dirhams ou rands) e a app converte para euros com uma taxa de referência fixa e arredondada para não ficar abaixo do real, porque a alfândega, a fatura (a partir de 300 €), o teto por viagem e o limite das contas novas se calculam em euros. A taxa tem data e rever-se de tempos a tempos.
- Cidades de origem e destino em lista fechada (Portugal, outros países de origem e Angola, mais "outra").
- A encomenda muda de mãos de duas maneiras, à escolha de quem envia: o entregador vai buscar à morada indicada, ou quem envia leva a encomenda ao sítio onde o entregador diz que recebe. Quem recebe em Angola é indicado no pedido.

## Capabilities and Constraints

- **Visitantes** sem conta vêem na página inicial só uma pré-visualização (rota, peso, data e valor das entradas aprovadas; nunca nome, contacto nem descrição). Quem quer pedir um envio ou viajar é levado ao registo e, depois de confirmar o email, volta ao formulário. Conta com email verificado para ver o quadro completo e publicar. Um único login; o papel `admin` dá acesso ao painel da equipa. Ao criar conta guarda-se a versão dos termos e da privacidade aceites e a data.
- **Identificação, feita uma só vez**: telefone, número, validade e fotos do BI (frente e verso), **selfie a segurar o BI** (comparada pela equipa, não é reconhecimento facial automático), **morada, estado civil e contacto de familiares** (mãe, pai e, se não for solteiro, o cônjuge). Quem viaja tem de ter também o **passaporte registado** (número, validade, 2.ª e última página) e **foto de perfil**; quem só envia não precisa deles. Os números, a morada e os familiares guardam-se cifrados (AES-256-GCM, chave PII_KEY só na app) e as fotos em armazenamento privado. Só a equipa os vê, e **cada abertura de um documento fica guardada de forma permanente** (quem, o quê, sobre quem, quando), visível só ao dono. A app guarda ainda uma impressão HMAC do número do BI e do passaporte, só para a equipa ver se o mesmo número aparece em outra conta: avisa, não bloqueia, e quem se identifica não sabe se o número já existe.
- **Pedidos de envio**: item, categoria, peso, valor (convertido para euros), oferta em Kz, onde pegar a encomenda e quem recebe em Angola. Fatura obrigatória nos bens de risco (eletrónicos, cosméticos e perfumes, peças) e em qualquer item a partir de 300 €. **Contas novas** (sem nenhuma entrega concluída) têm um limite de valor por pedido (150 € por defeito, a equipa muda-o); acima dele o pedido tem de ser marcado como urgente e justificado, e a equipa decide. A descrição do item recusa telefones, emails, ligações e redes sociais (texto visível a todos).
- **Viagens**: rota, datas, quilos livres, preço por kg, foto do bilhete e, opcionalmente, onde o entregador recebe encomendas. Uma viagem não se aprova sem a equipa confirmar a identificação e o bilhete.
- **Negociação** do valor por propostas na app, sem chat; antes de aceitar, cada parte vê a reputação da outra (média, entregas concluídas, identificação confirmada) e o selo «Conta de confiança» (3 entregas, média de 4,5 ou mais em 3 avaliações, identificação confirmada). Quando há acordo, a equipa cria a entrega (alfândega, identificação e prémio do mês verificados aí).
- **Entregas**: a equipa confirma o pagamento recebido (transferência, Multicaixa ou numerário, **fora da app**): o valor fica **retido** na carteira (registo de valores, não é uma instituição de pagamento) e nasce o **código de entrega de 6 dígitos**, que só quem enviou vê. Só então as duas partes veem o contacto uma da outra e o entregador vê onde pegar a encomenda e quem recebe. O entregador envia pelo menos 2 fotos do estado do volume, pega a encomenda (aceitando partilhar a localização) e quem enviou e a equipa vêem a posição dele em mapa, só em trânsito (apagada ao terminar; só com a página aberta). Quem recebe dá o código e o entregador confirma; a equipa paga ao viajante por fora e marca como pago.
- **Se algo correr mal**: quem participa numa entrega pode denunciar um problema, que só a equipa lê, numa lista própria.
- **Avaliações** depois de uma entrega concluída (1 a 5 estrelas, comentário privado); duas classificações por pessoa (como entregador e como remetente); o início mostra os 3 melhores de cada função no mês, em tempo real. Prémio: o 1.º entregador e o 1.º remetente do mês (com pelo menos 3 avaliações) ficam o mês seguinte sem pagar a taxa; a isenção é automática ao criar a entrega. Sem avaliações reais o quadro fica vazio: nunca se inventam classificações.
- **Equipa**: painel com verificação, entregas, quadro, análise, economia, pitch, denúncias, feedback e definições (comissão, preço de referência por kg, WhatsApp, limite das contas novas). O dono vê ainda o separador «Equipa» (acrescentar e retirar pessoas pelo email, exigir 2FA por TOTP a toda a equipa, e o registo de quem abriu documentos). Resumo diário por email com contagens, Sentry só para erros sem dados de pessoas, e monitor do site no ar.
- **Textos e ajuda**: política de privacidade, termos de uso e regras (rascunhos para um advogado rever), declaração de conteúdo (folha por volume, com PDF), tutorial «Como usar» com ilustrações, página «Fontes» e feedback aberto a todos.
- **Não existe ainda**: processador de pagamentos licenciado (o dinheiro entra e sai por fora da app, confirmado à mão pela equipa), verificação do telefone por SMS, seguro, e seguimento da localização em segundo plano (exigiria app nativa).
- Stack: Next.js 16, React 19, Supabase (Postgres, Auth, RLS, Storage). Taxa da Kamba (comissão) e preço de referência por kg são configuráveis no painel.

## Interface

Modo claro e modo escuro (segue o sistema por defeito; a pessoa pode escolher, e a escolha fica no dispositivo). Navegação: para visitantes, uma barra no topo (Como funciona, Tutorial, Segurança, Dúvidas, Entrar, Criar conta); para quem tem sessão, uma barra lateral no computador (os dois botões «Pedir envio» e «Vou viajar» com o mesmo destaque, um bloco «A minha atividade» com 5 ligações e números de pendentes, a «Ajuda» recolhida e, para a equipa, o painel à parte) e uma barra de baixo no telemóvel (Quadro, Propostas, Entregas, Pedir e Viajar). Uma comparação com a barra no topo mostrou que não cabe com tudo ao mesmo nível: fica a lateral. "Deixe o seu feedback" (/feedback) está aberto a todos.

## Brand Commitments

Origem do nome (confirmada pelo dono): "Kamba" quer dizer amigo em kimbundu. A marca fala assim: o amigo que leva a tua encomenda. Marca (escolhida pelo dono, opção E, a manter): uma mala amarela (#FFC52A) com uma etiqueta de bagagem branca pendurada e o K em azul-noite (#0D1530), sobre fundo azul-noite. O nome escreve-se "Kamba" na cor do texto e "Traz" a amarelo. Alternativas descartadas em Logos/_antigos. Componente em src/components/Logo.tsx; ficheiros em src/app (icon.svg, favicon.ico, apple-icon.png, opengraph-image.png, manifest.ts) e public (icon-*.png).

Só o nome "Kamba Traz" é obrigatório. O dono deu liberdade para redesenhar paleta, tipografia e cartões. Idioma: português de Portugal.

## Evidence on Hand

Não há testemunhos, clientes, números de entregas nem preços reais. Nada disto pode ser inventado. Os registos marcados "EXEMPLO" são demonstrações, e as imagens do tutorial são ilustrações com dados de exemplo (não capturas de ecrã reais).

## Product Principles

1. **Reduzir o risco, nunca garantir.** Não prometer o que ainda não existe: o pagamento fica «registado como retido» e recebido à mão pela equipa, não há seguro, e a verificação de identidade é feita por pessoas e pode falhar. Os termos dizem que a Kamba Traz é intermediária.
2. Revisão humana primeiro: a equipa é parte do produto, não um detalhe interno.
3. Privacidade por defeito: contactos nunca públicos, quadro com primeiro nome, morada e familiares só para a equipa.
4. Os dois lados (quem envia e quem viaja) têm o mesmo destaque.
5. Pensado para o telemóvel e para pessoas que preferem o WhatsApp a formulários longos.
6. O negócio passa pela app: os contactos só aparecem com o pagamento retido, e pagar ou entregar fora da app tira a proteção.

## Accessibility & Inclusion

Nenhum requisito formal indicado. Mínimo assumido: contraste legível, foco visível, formulários com erros anunciados, respeito por `prefers-reduced-motion`, ícones decorativos escondidos dos leitores de ecrã, números de pendentes e blocos de navegação com nome legível por leitores de ecrã.
