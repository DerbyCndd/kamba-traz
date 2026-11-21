"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { TwoStepButton } from "@/components/TwoStepButton";
import { addTeamMember, removeTeamMember, setStaff2fa, type AdminState } from "../actions";

export type TeamMember = { id: string; email: string; full_name: string; role: string; is_owner: boolean };
export type AccessRow = { id: number; at: string; staff: string; what: string; subject: string | null; detail: string | null };
export type TwoFa = { available: boolean; on: boolean; mine: boolean };

const when = (iso: string) => new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" });

/** Quem é da equipa, o 2FA e o registo de acessos a documentos. Só o dono vê este separador. */
export function EquipaTab({ members, twofa, log }: { members: TeamMember[]; twofa: TwoFa; log: AccessRow[] | null }) {
  const [state, action] = useActionState(addTeamMember, {} as AdminState);
  const [tf, tfAction] = useActionState(setStaff2fa, {} as AdminState);
  return (
    <div className="list">
      <div className="panel">
        <h3>Acrescentar alguém à equipa</h3>
        <p className="muted">A pessoa tem de se registar primeiro no site e confirmar o email. Depois escreve aqui o email dela. Quem entra na equipa vê todos os documentos, números, selfies, moradas e familiares, aprova e recusa entradas, confirma pagamentos e muda as definições. Acrescenta só quem merece essa confiança.</p>
        <form action={action}>
          <div className="fields">
            <Field id="team-email" label="Email da pessoa" full>
              <input id="team-email" name="email" type="email" autoComplete="off" placeholder="nome@exemplo.com" required />
            </Field>
          </div>
          <div className="row">
            <SubmitButton pending="A acrescentar…">Acrescentar à equipa</SubmitButton>
            {state.message ? <span className="hint" role="status">{state.message}</span> : null}
            {state.error ? <span className="err" role="alert">{state.error}</span> : null}
          </div>
        </form>
      </div>

      <div className="panel">
        <h3>A equipa <span className="cnt">{members.length}</span></h3>
        <div className="list">
          {members.map((m) => (
            <div className="row" key={m.id}>
              <span><b>{m.full_name || "Sem nome"}</b> · {m.email}</span>
              {m.is_owner ? <span className="pill info">DONO</span> : <TwoStepButton label="Retirar da equipa" action={removeTeamMember.bind(null, m.email)} />}
            </div>
          ))}
        </div>
        <p className="hint">Retirar alguém tira-lhe o acesso ao painel de imediato. A conta continua a existir como utilizador normal.</p>
      </div>

      {twofa.available ? (
        <div className="panel">
          <h3>Autenticação em dois passos da equipa <span className={"pill " + (twofa.on ? "ok" : "warn")}>{twofa.on ? "EXIGIDA" : "NÃO EXIGIDA"}</span></h3>
          <p className="muted">Quando é exigida, quem entra no painel tem de escrever também um código da aplicação de autenticação do telemóvel. Sem isso, a base de dados nem lhe mostra os documentos, mesmo que descubram a palavra-passe. Cada pessoa da equipa configura o seu 2FA na primeira vez que entra depois de ligares isto.</p>
          {twofa.on ? (
            <form action={tfAction}>
              <input type="hidden" name="on" value="0" />
              <div className="row"><SubmitButton className="btn small danger" pending="A desligar…">Deixar de exigir</SubmitButton></div>
            </form>
          ) : twofa.mine ? (
            <form action={tfAction}>
              <input type="hidden" name="on" value="1" />
              <div className="row"><SubmitButton className="btn small primary" pending="A ligar…">Exigir 2FA a toda a equipa</SubmitButton></div>
            </form>
          ) : (
            <p className="notice">Primeiro ativa e confirma o <b>teu</b> 2FA, para teres a certeza de que funciona antes de o exigires aos outros. <Link className="btn small primary" href="/seguranca?next=/admin">Ativar o meu 2FA</Link></p>
          )}
          {tf.message ? <span className="hint" role="status">{tf.message}</span> : null}
          {tf.error ? <span className="err" role="alert">{tf.error}</span> : null}
          <p className="hint">Se alguém perder o telemóvel, o dono repõe o acesso no Supabase (Authentication → Users → o utilizador → remover o fator). Se o próprio dono ficar trancado: no SQL Editor, <code>update public.config set staff_2fa = false where id = 1;</code></p>
        </div>
      ) : null}

      {log ? (
        <div className="panel">
          <h3>Quem abriu documentos <span className="cnt">{log.length}</span></h3>
          <p className="muted">As últimas 100 aberturas de documentos pela equipa. Este registo é permanente e ninguém o altera pela app. Se algo aqui não se explica pelo trabalho, fala com a pessoa.</p>
          {log.length ? (
            <div className="doctablewrap">
              <table className="doctable stack">
                <thead><tr><th>Quando</th><th>Quem</th><th>O quê</th><th>Sobre</th></tr></thead>
                <tbody>
                  {log.map((r) => (
                    <tr key={r.id}>
                      <td data-label="Quando">{when(r.at)}</td>
                      <td data-label="Quem">{r.staff}</td>
                      <td data-label="O quê">{r.what}{r.detail ? ` (${r.detail})` : ""}</td>
                      <td data-label="Sobre">{r.subject ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="muted">Ainda ninguém abriu documentos desde que o registo existe.</p>}
        </div>
      ) : null}
    </div>
  );
}
