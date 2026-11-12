"use client";

// Fronteira de erro: mostra uma mensagem simples, sem detalhes internos. O `digest` serve para achar o erro nos logs do servidor.
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <section>
      <div className="empty" role="alert">
        <h3>Algo correu mal</h3>
        <p>Não conseguimos carregar esta página. Tenta de novo; se continuar, escreve-nos.</p>
        {error.digest ? <p className="hint mono">Ref. {error.digest}</p> : null}
        <button className="btn primary" type="button" onClick={() => retry()}>Tentar de novo</button>
      </div>
    </section>
  );
}
