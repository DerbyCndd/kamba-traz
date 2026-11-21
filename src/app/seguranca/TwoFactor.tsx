"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Phase = "loading" | "enroll-start" | "enroll-verify" | "challenge" | "active" | "error";

/**
 * Autenticação em dois passos (TOTP): um código de 6 dígitos de uma aplicação (Google Authenticator, Microsoft Authenticator, Authy…).
 * Usa o navegador porque o Supabase atualiza a sessão aqui; depois de confirmar o código, a sessão passa a ter o nível 2.
 */
export function TwoFactor({ next }: { next: string }) {
  const [supabase] = useState(() => createClient());
  const [phase, setPhase] = useState<Phase>("loading");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  type Loaded = { phase: Phase; factorId?: string; msg?: string };
  async function load(): Promise<Loaded> {
    const [f, a] = await Promise.all([supabase.auth.mfa.listFactors(), supabase.auth.mfa.getAuthenticatorAssuranceLevel()]);
    if (f.error || a.error) return { phase: "error", msg: "Não foi possível ler o estado do 2FA. Tenta de novo daqui a pouco." };
    const verified = f.data.totp[0];
    if (!verified) return { phase: "enroll-start" };
    return { phase: a.data.currentLevel === "aal2" ? "active" : "challenge", factorId: verified.id };
  }
  const apply = (r: Loaded) => { if (r.factorId) setFactorId(r.factorId); if (r.msg) setMsg(r.msg); setPhase(r.phase); };
  async function refresh() { apply(await load()); }
  useEffect(() => {
    let alive = true;
    void load().then((r) => { if (alive) apply(r); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnroll() {
    setBusy(true); setMsg("");
    // Fatores começados e nunca confirmados atrapalham um novo registo: tiram-se primeiro.
    const f = await supabase.auth.mfa.listFactors();
    for (const x of f.data?.all ?? []) if (x.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: x.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Kamba Traz" });
    setBusy(false);
    if (error || !data) { setMsg("Não foi possível iniciar o 2FA. O Supabase pode ter o 2FA desligado (Authentication → Multi-factor): " + (error?.message ?? "")); return; }
    setFactorId(data.id); setQr(data.totp.qr_code); setSecret(data.totp.secret); setCode(""); setPhase("enroll-verify");
  }

  async function verify() {
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, "") });
    setBusy(false);
    if (error) { setMsg("Código errado ou expirado. Confirma a hora do telemóvel e tenta com o código seguinte."); return; }
    window.location.assign(next); // recarrega com a sessão de nível 2
  }

  async function disable() {
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) { setMsg("Não foi possível desativar: " + error.message); return; }
    await refresh();
  }

  if (phase === "loading") return <p className="muted" role="status">A carregar…</p>;
  if (phase === "error") return <div className="notice bad" role="alert">{msg}</div>;

  return (
    <div className="panel">
      {phase === "enroll-start" ? (
        <>
          <h3>Ativar a autenticação em dois passos</h3>
          <p className="muted">Vais precisar de uma aplicação de autenticação no telemóvel (Google Authenticator, Microsoft Authenticator ou Authy). Lê o código QR com ela e escreve aqui o código de 6 dígitos que ela mostra.</p>
          <div className="row"><button type="button" className="btn primary" onClick={startEnroll} disabled={busy}>{busy ? "A preparar…" : "Começar"}</button></div>
        </>
      ) : null}

      {phase === "enroll-verify" ? (
        <>
          <h3>Lê o código QR</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Código QR para a aplicação de autenticação" width={200} height={200} style={{ background: "#fff", padding: 8, borderRadius: 8, alignSelf: "flex-start" }} />
          <p className="hint">Sem câmara? Escreve esta chave na aplicação: <code>{secret}</code></p>
          <div className="field">
            <label htmlFor="otp">Código de 6 dígitos</label>
            <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="row"><button type="button" className="btn primary" onClick={verify} disabled={busy || code.replace(/\s/g, "").length < 6}>{busy ? "A confirmar…" : "Confirmar e ativar"}</button></div>
          <p className="hint">Se perderes o telemóvel, só o dono da equipa (ou o Supabase) consegue repor o acesso. Guarda a chave acima num sítio seguro.</p>
        </>
      ) : null}

      {phase === "challenge" ? (
        <>
          <h3>Confirma o teu código</h3>
          <p className="muted">Escreve o código de 6 dígitos que a tua aplicação de autenticação mostra agora.</p>
          <div className="field">
            <label htmlFor="otp">Código de 6 dígitos</label>
            <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
          </div>
          <div className="row"><button type="button" className="btn primary" onClick={verify} disabled={busy || code.replace(/\s/g, "").length < 6}>{busy ? "A confirmar…" : "Confirmar"}</button></div>
        </>
      ) : null}

      {phase === "active" ? (
        <>
          <h3>Autenticação em dois passos ativa</h3>
          <p className="muted">Esta sessão já confirmou o código. A tua conta fica protegida mesmo que alguém descubra a tua palavra-passe.</p>
          <div className="row">
            <a className="btn primary" href={next}>Continuar</a>
            <button type="button" className="btn danger" onClick={disable} disabled={busy}>Desativar</button>
          </div>
        </>
      ) : null}

      {msg ? <p className="err" role="alert">{msg}</p> : null}
    </div>
  );
}
