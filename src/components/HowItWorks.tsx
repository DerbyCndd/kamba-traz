/** Os passos reais do processo de hoje. A garantia de pagamento e a verificação de identidade ainda não existem. */
export function HowItWorks() {
  return (
    <>
      <div className="steps" role="list">
        <div><span className="n" aria-label="Passo 1">1</span><h3>Publicas</h3><p className="muted">Dizes o que queres enviar, o peso e o percurso, ou quando viajas e quanto espaço tens.</p></div>
        <div><span className="n" aria-label="Passo 2">2</span><h3>A equipa analisa</h3><p className="muted">Vemos cada entrada antes de aparecer no quadro e falamos contigo pelo número que deixaste.</p></div>
        <div><span className="n" aria-label="Passo 3">3</span><h3>Ligamos as duas partes</h3><p className="muted">Quando há um pedido e uma viagem compatíveis, combinam o valor final e os detalhes da entrega.</p></div>
        <div><span className="n" aria-label="Passo 4">4</span><h3>Entrega acompanhada</h3><p className="muted">A equipa acompanha a entrega até estar concluída.</p></div>
      </div>
      <p className="notice">
        <b>Em preparação:</b> pagamento em garantia e verificação de identidade dos viajantes. Até estarem prontos, combina sempre o pagamento com a equipa antes de enviar.
      </p>
    </>
  );
}
