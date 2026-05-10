import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, PlusCircle, RefreshCw, RotateCcw } from "lucide-react";
import { apiAddParticipant, apiCapturePayment, apiGetSession, apiResetDemo } from "../api";
import { formatTry } from "../components/Money";
import type { Payment, SessionFull } from "../types";

type HostPageProps = {
  sessionId: string;
};

export function HostPage({ sessionId }: HostPageProps) {
  const [full, setFull] = useState<SessionFull | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const data = await apiGetSession(sessionId);
      setFull(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Session alınamadı");
    }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 3500);
    return () => window.clearInterval(timer);
  }, [sessionId]);

  async function addParticipant() {
    const clean = newName.trim();
    if (!clean) return;
    const result = await apiAddParticipant(sessionId, clean);
    setFull(result.full);
    setNewName("");
  }

  async function resetDemo() {
    const result = await apiResetDemo();
    window.location.href = result.hostUrl;
  }

  async function capture(payment: Payment) {
    const result = await apiCapturePayment(payment.id);
    setFull(result.full);
  }

  function copyLink(participantId: string) {
    const url = `${window.location.origin}/pay/${sessionId}/${participantId}`;
    void navigator.clipboard.writeText(url);
  }

  const progress = useMemo(() => {
    if (!full) return 0;
    return Math.min(100, Math.round((full.session.paidTotal / full.session.total) * 100));
  }, [full]);

  if (!full) {
    return <main className="page"><div className="card">SplitCart session yükleniyor...</div></main>;
  }

  const { session, participants, payments } = full;
  const pendingPayments = payments.filter((p) => p.status === "AWAITING_CONFIRMATION" || p.status === "INITIATED");

  return (
    <main className="page host-page">
      <section className="host-hero">
        <div>
          <span className="step-dot">7</span>
          <p className="eyebrow">Sepet Sahibi Kontrol Paneli</p>
          <h1>{session.title}</h1>
          <p className="muted">{session.merchantName} · {session.id}</p>
        </div>
        <div className="host-actions">
          <button className="ghost" onClick={refresh}><RefreshCw size={18} /> Yenile</button>
          <button className="ghost danger-ghost" onClick={resetDemo}><RotateCcw size={18} /> Yeni Demo</button>
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      <section className="grid host-grid">
        <div className="card">
          <div className="card-title-row">
            <h2>Aktif Siparişler</h2>
            <StatusPill status={session.status} />
          </div>

          <div className="progress-block">
            <div className="amount-row">
              <div>
                <span>Toplam Sepet</span>
                <strong>{formatTry(session.total)}</strong>
              </div>
              <div>
                <span>Kalan</span>
                <strong>{formatTry(session.remainingTotal)}</strong>
              </div>
            </div>
            <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>
            <p>{participants.filter((p) => p.status === "PAID").length} / {participants.length} ödedi</p>
          </div>

          <div className="cart-items">
            {session.cartItems.map((item) => (
              <div className="item-row" key={item.id}>
                <span>{item.quantity}× {item.name}</span>
                <strong>{formatTry(item.total)}</strong>
              </div>
            ))}
            <div className="item-row soft">
              <span>Servis / platform demo ücreti</span>
              <strong>{formatTry(session.serviceFee)}</strong>
            </div>
          </div>
        </div>

        <div className="card timer-card">
          <h2>Kalan Süre</h2>
          <strong>07:45</strong>
          <p className="muted">Demo geri sayımı. Gerçek sistemde timeout/policy buraya bağlanır.</p>
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <div className="card-title-row">
            <h2>Katılımcılar</h2>
            <div className="add-person">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Yeni kişi" />
              <button className="primary small" onClick={addParticipant}><PlusCircle size={16} /> Ekle</button>
            </div>
          </div>

          <div className="participants-list">
            {participants.map((p) => (
              <div className="participant-row" key={p.id}>
                <div className="avatar">{p.avatar}</div>
                <div>
                  <strong>{p.name}</strong>
                  <p>{formatTry(p.shareAmount)} · kalan {formatTry(p.remainingAmount)}</p>
                </div>
                <div className="participant-actions">
                  <StatusPill status={p.status} />
                  <button className="icon-button" onClick={() => copyLink(p.id)} title="Link kopyala"><Copy size={16} /></button>
                  <a className="icon-button" href={`/pay/${session.id}/${p.id}`} target="_blank" rel="noreferrer" title="Ödeme sayfasını aç">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Bekleyen Ödeme Olayları</h2>
          {pendingPayments.length === 0 ? (
            <p className="muted">Bekleyen provider callback yok.</p>
          ) : (
            pendingPayments.map((payment) => {
              const person = participants.find((p) => p.id === payment.participantId);
              return (
                <div className="pending-row" key={payment.id}>
                  <div>
                    <strong>{person?.name ?? "Katılımcı"} · {payment.method}</strong>
                    <p>{formatTry(payment.amount)} + {formatTry(payment.tipAmount)} tip</p>
                  </div>
                  <button className="primary small" onClick={() => capture(payment)}>
                    Callback Onayla
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="card">
        <h2>Ledger</h2>
        <div className="ledger">
          <div className="ledger-row ledger-head">
            <span>Ödeme</span>
            <span>Kişi</span>
            <span>Yöntem</span>
            <span>Durum</span>
            <span>Tutar</span>
            <span>Tip</span>
          </div>
          {payments.length === 0 ? <p className="muted">Henüz ödeme yok.</p> : payments.map((payment) => {
            const person = participants.find((p) => p.id === payment.participantId);
            return (
              <div className="ledger-row" key={payment.id}>
                <span>{payment.id}</span>
                <span>{person?.name ?? "-"}</span>
                <span>{payment.method}</span>
                <span>{payment.status}</span>
                <span>{formatTry(payment.amount)}</span>
                <span>{formatTry(payment.tipAmount)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  return <span className={`status status-${status.toLowerCase()}`}>{status}</span>;
}
