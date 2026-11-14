import type { SourceRef } from "./sources";

export const FAQ: [string, string, SourceRef[]?][] = [
  ["Quanto custa?", "Tu e o viajante combinam o valor por kg. A Kamba cobra uma taxa sobre esse valor, que vês na calculadora antes de aceitar."],
  ["Como funciona o pagamento?", "Pagas por transferência ou Multicaixa e a equipa confirma. O valor fica retido na carteira e só é libertado ao viajante quando a entrega é confirmada com o código de entrega."],
  ["E se o viajante não entregar?", "O valor continua retido: só é libertado quando a entrega é confirmada com o código. Cada viajante é identificado pela equipa e a equipa acompanha a entrega."],
  ["Posso ver onde está a minha encomenda?", "Sim. Quando o entregador pega a encomenda e aceita partilhar a localização, vês a posição dele no mapa até à entrega. A localização apaga-se quando a entrega termina."],
  ["Quem vê o meu número de telefone?", "Só a equipa. Os contactos só são partilhados com a outra parte depois de haver acordo, e no quadro aparece apenas o primeiro nome."],
  ["Posso enviar um telemóvel ou um portátil?", "Sim, com verificação da equipa e com a fatura da compra. Confirmamos cada caso antes de publicar."],
  ["O que nunca se pode enviar?", "Drogas, medicamentos, armas, dinheiro em numerário, baterias soltas, produtos falsificados, animais, plantas e alimentos perecíveis. A lista completa está nas regras."],
  ["Tenho de pagar taxas na alfândega?", "Pode haver. A lei só isenta bens «destinados ao consumo pessoal» do viajante; entre Kz 1 000 001 e Kz 1 500 000 aplica-se uma taxa fixa de 16%. Tratamos as encomendas de outras pessoas como não isentas e mostramos uma estimativa ao pedir. Acima de Kz 1 500 000 não aceitamos o pedido.", [["dlp", "art. 1.º, k) e art. 12.º"], ["guia", "ponto 2.3"]]],
  ["Quanto tempo demora a verificação?", "A equipa contacta-te pelo número que indicaste para confirmar os dados. Podes acompanhar o estado em «Os meus»."],
  ["Como ganho um mês sem taxas?", "O melhor entregador e o melhor remetente de cada mês ficam o mês seguinte sem taxa. É preciso ter 3 avaliações no mês. Em caso de empate, ganha quem tem menos entregas."],
];
