import { Icon } from "./Icons";

/** Os três passos reais, do pedido à entrega. */
export function HowItWorks() {
  return (
    <ol className="steps">
      <li>
        <span className="stepico"><Icon name="edit" size={22} /></span>
        <h3>Publicas</h3>
        <p className="muted">Diz-nos o que queres enviar, o peso e o percurso. Se vais viajar, indicas a data e o espaço que tens na mala.</p>
      </li>
      <li>
        <span className="stepico"><Icon name="shield" size={22} /></span>
        <h3>Confirmamos</h3>
        <p className="muted">A equipa confirma cada entrada e identifica cada pessoa, com BI e telefone (e o bilhete, no caso de quem viaja), antes de a publicar no quadro.</p>
      </li>
      <li>
        <span className="stepico"><Icon name="plane" size={22} /></span>
        <h3>Entregam</h3>
        <p className="muted">Quando há um pedido e uma viagem que combinam, acertam o valor e os detalhes. A equipa acompanha a entrega até ao fim.</p>
      </li>
    </ol>
  );
}
