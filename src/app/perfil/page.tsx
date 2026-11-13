import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { Icon } from "@/components/Icons";
import { Stars } from "@/components/Stars";
import { getProfile, requireUser } from "@/lib/auth";
import { getMyRatings, getMyWaivers } from "@/lib/data";
import { initials } from "@/lib/format";
import { myIdentity } from "@/lib/identity";
import { PhotoForm } from "./PhotoForm";

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
  // Foto privada: link temporário. Se a coluna ainda não existir (SQL por correr), segue sem foto.
  const photoPath = await supabase.from("profiles").select("photo_path").eq("id", user.id).maybeSingle().then((r) => (r.error ? null : (r.data?.photo_path as string | null)));
  const photoUrl = photoPath ? (await supabase.storage.from("avatars").createSignedUrl(photoPath, 3600)).data?.signedUrl ?? null : null;
  const ident = await myIdentity(supabase, user.id);
  const [mine, waivers] = await Promise.all([getMyRatings(), getMyWaivers()]);
  const [reqs, trips, waiting] = await Promise.all([count("requests"), count("trips"), Promise.all([count("requests", "pendente"), count("trips", "pendente")]).then(([a, b]) => a + b)]);

  return (
    <section>
      <div className="phead">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar big photo" src={photoUrl} alt="A tua foto de perfil" />
        ) : (
          <span className="avatar big" aria-hidden="true">{initials(name, user.email ?? "")}</span>
        )}
        <div>
          <h2>{name || "Meu perfil"}</h2>
          <p className="muted">{user.email}</p>
        </div>
        {admin ? <span className="pill info" title="Tens acesso ao painel da equipa">EQUIPA</span> : null}
      </div>

      {waivers.length ? (
        <p className="notice good"><b>Este mês estás sem pagar taxas.</b> Foste o melhor {waivers.map((w) => (w === "traveler" ? "entregador" : "remetente")).join(" e o melhor ")} do mês passado.</p>
      ) : null}

      <div className="panel">
        <h3>Foto de perfil</h3>
        <p className="muted">Uma foto do teu rosto, nítida e sem óculos escuros, ajuda a equipa a identificar-te e dá confiança a quem entrega ou envia contigo. Só tu, a equipa e a pessoa ligada à tua entrega a veem; no quadro público aparecem só as iniciais.</p>
        <PhotoForm key={photoPath ?? "sem-foto"} hasPhoto={!!photoUrl} />
      </div>

      {ident.available ? (
        <div className="panel">
          <h3>Identificação</h3>
          {ident.row ? (
            <>
              <div className="kv one">
                <div><span>Nome no BI</span>{ident.row.full_name}</div>
                <div><span>Telefone</span>{ident.row.phone}</div>
                <div><span>BI</span>•••• {ident.row.bi_last4}</div>
                <div><span>Passaporte</span>{ident.row.passport_last4 ? "•••• " + ident.row.passport_last4 : "Não indicado"}</div>
                {ident.row.bi_expiry ? <div><span>Validade do BI</span>{since(ident.row.bi_expiry)}</div> : null}
                {ident.row.passport_expiry ? <div><span>Validade do passaporte</span>{since(ident.row.passport_expiry)}</div> : null}
                <div><span>Estado</span>{ident.row.status === "confirmado" ? "Confirmada pela equipa" : ident.row.status === "recusado" ? "Recusada: atualiza os documentos" : "A equipa ainda vai confirmar"}</div>
              </div>
              <Link className="btn small" href="/identificacao?next=/perfil" style={{ alignSelf: "flex-start" }}>Atualizar ou juntar o passaporte</Link>
            </>
          ) : (
            <>
              <p className="muted">Ainda não deixaste o BI e o telefone. Pedimos uma só vez, e serve para pedir envios e para viajar.</p>
              <Link className="btn primary small" href="/identificacao?next=/perfil" style={{ alignSelf: "flex-start" }}>Completar identificação</Link>
            </>
          )}
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
        <div className="two">
          <div className="mini one"><span>Como entregador</span><Stars avg={mine.traveler?.avg} count={mine.traveler?.total} /></div>
          <div className="mini one"><span>Como remetente</span><Stars avg={mine.requester?.avg} count={mine.requester?.total} /></div>
        </div>
      </div>

      <div className="panel">
        <h3>Segurança</h3>
        <div className="row">
          <Link className="btn" href="/nova-palavra-passe"><Icon name="key" size={18} />Alterar palavra-passe</Link>
        </div>
      </div>

      <form action={logout}>
        <button type="submit" className="btn danger" style={{ alignSelf: "flex-start" }}><Icon name="logout" size={18} />Sair da conta</button>
      </form>
    </section>
  );
}
