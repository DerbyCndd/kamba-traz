import type { IdentityView } from "@/lib/types";
import { IdentityBlock } from "./IdentityBlock";

/**
 * Identificações por confirmar de contas que ainda não têm nenhuma viagem ou pedido por aprovar.
 * Sem esta lista, quem só enviou o BI não aparecia em lado nenhum do painel.
 */
export function Identificacoes({ idents }: { idents: IdentityView[] }) {
  if (!idents.length) return null;
  return (
    <div className="list">
      <h3>Identificações por confirmar <span className="cnt">{idents.length}</span></h3>
      <p className="muted">Contas que enviaram o BI e ainda não têm uma viagem ou pedido por aprovar. Vê os documentos e decide: confirmar ou recusar.</p>
      {idents.map((i) => (
        <article className="item" key={i.user_id}>
          <div className="head">
            <div>
              <span className="label">Conta</span>
              <h3>{i.full_name}</h3>
            </div>
          </div>
          <IdentityBlock userId={i.user_id} ident={i} accountName={i.full_name} />
        </article>
      ))}
    </div>
  );
}
