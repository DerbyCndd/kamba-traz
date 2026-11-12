export default function Loading() {
  return (
    <section aria-busy="true" aria-label="A carregar">
      <div className="skel" style={{ width: "55%", height: 34 }} />
      <div className="skel" style={{ width: "80%", height: 18 }} />
      <div className="grid">
        <div className="skel" style={{ height: 150 }} />
        <div className="skel" style={{ height: 150 }} />
      </div>
    </section>
  );
}
