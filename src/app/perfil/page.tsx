import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { Icon } from "@/components/Icons";
import { Stars } from "@/components/Stars";
import { getProfile, requireUser } from "@/lib/auth";
import { getMyRatings, getMyWaivers } from "@/lib/data";
import { initials } from "@/lib/format";

export const metadata: Metadata = { title: "Meu perfil" };

const since = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Luanda" }) : "—");

export default async function PerfilPage() {
  const { user, supabase } = await requireUser();
  const profile = await getProfile();
  const name = profile?.full_name || "";
  const admin = profile?.role === "admin";

  const count = (table: "trips" | "requests", status?: string) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if (status) q = q.eq("status", status);
    return q.then((r) => r.count ?? 0);
  };
  const [mine, waivers] = await Promise.all([getMyRatings(), getMyWaivers()]);
  const [reqs, trips, waiting] = await Promise.all([count("requests"), count("trips"), Promise.all([count("requests", "pendente"), count("trips", "pendente")]).then(([a, b]) => a + b)]);

  return (
    <section>
      <div className="phead">
        <span className="avatar big" aria-hidden="true">{initials(name, user.email ?? "")}</span>
        <div>
          <h2>{name || "Meu perfil"}</h2>
          <p className="muted">{user.email}</p>
        </div>
        {admin ? <span className="pill info" title="Tens acesso ao painel da equipa">EQUIPA</span> : null}
      </div>

      {waivers.length ? (
        <div className="prize-note">
          <span className="prize-ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" /></svg></span>
          <p><b>Este mês estás sem pagar taxas.</b> Foste o mais bem avaliado do mês passado como {waivers.map((w) => (w === "traveler" ? "entregador" : "remetente")).join(" e como ")}. A isenção aplica-se às entregas criadas este mês, automaticamente.</p>
        </div>
      ) : null}

      <div className="two">
        <div className="panel">
          <h3>Dados da conta</h3>
          <div className="kv one">
            <div><span>Nome</span>{name || "Sem nome"}</div>
            <div><span>Email</span>{user.email}</div>
            <div><span>Tipo de conta</span>{admin ? "Equipa Kamba Traz" : "Utilizador"}</div>
            <div><span>Conta criada em</span>{since(user.created_at)}</div>
          </div>
        </div>

        <div className="panel">
          <h3>A minha actividade</h3>
          <div className="mini">
            <div><b>{reqs}</b><span>pedidos</span></div>
            <div><b>{trips}</b><span>viagens</span></div>
            <div><b>{waiting}</b><span>em verificação</span></div>
          </div>
          <Link className="btn small" href="/meus" style={{ alignSelf: "flex-start" }}>Ver o estado de tudo</Link>
        </div>
      </div>

      <div className="panel">
        <h3>A minha classificação</h3>
        <p className="muted">Depois de cada entrega concluída, a outra parte avalia-te. Tens uma classificação como entregador e outra como remetente.</p>
        <div className="two">
          <div className="mini one"><span>Como entregador</span><Stars avg={mine.traveler?.avg} count={mine.traveler?.total} /></div>
          <div className="mini one"><span>Como remetente</span><Stars avg={mine.requester?.avg} count={mine.requester?.total} /></div>
        </div>
      </div>

      <div className="panel">
        <h3>Segurança</h3>
        <p className="muted">Escolhe uma palavra-passe que não uses noutros sítios. Pelo menos 8 caracteres.</p>
        <div className="row">
          <Link className="btn" href="/nova-palavra-passe"><Icon name="key" size={18} />Alterar palavra-passe</Link>
          {admin ? <Link className="btn" href="/admin"><Icon name="team" size={18} />Painel da equipa</Link> : null}
        </div>
      </div>

      <form action={logout}>
        <button type="submit" className="btn danger" style={{ alignSelf: "flex-start" }}><Icon name="logout" size={18} />Sair da conta</button>
      </form>
    </section>
  );
}
