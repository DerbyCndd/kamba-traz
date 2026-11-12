/** Os passos reais do processo de hoje. A garantia de pagamento e a verificação de identidade ainda não existem. */
export function HowItWorks() {
  return (
    <>
      <ol className="steps">
        <li><span className="n" aria-hidden="true">1</span><h3>Conta-nos o que precisas</h3><p className="muted">Dizes o que queres enviar, o peso e o percurso. Ou, se vais viajar, quando voas e quanto espaço tens na mala.</p></li>
        <li><span className="n" aria-hidden="true">2</span><h3>Uma pessoa da equipa vê tudo</h3><p className="muted">Antes de aparecer no quadro, analisamos cada entrada e falamos contigo pelo número que deixaste.</p></li>
        <li><span className="n" aria-hidden="true">3</span><h3>Juntamos-vos</h3><p className="muted">Quando há um pedido e uma viagem que combinam, ajudamos a acertar o valor e os detalhes da entrega.</p></li>
        <li><span className="n" aria-hidden="true">4</span><h3>Acompanhamos até ao fim</h3><p className="muted">A equipa acompanha a entrega até estar concluída.</p></li>
      </ol>
      <p className="notice">
        <b>Em preparação:</b> pagamento em garantia e verificação de identidade dos viajantes. Até estarem prontos, combina sempre o pagamento com a equipa antes de enviar.
      </p>
    </>
  );
}
