import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Banknote, CheckCircle2, CreditCard, QrCode, ShieldCheck } from "lucide-react";
import { apiCapturePayment, apiCreatePayment, apiGetSession } from "../api";
import { formatTry } from "../components/Money";
import type { Participant, PaymentMethod, SessionFull } from "../types";

type PayPageProps = {
  sessionId: string;
  participantId: string;
};

export function PayPage({ sessionId, participantId }: PayPageProps) {
  const [full, setFull] = useState<SessionFull | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("CARD");
  const [amountMode, setAmountMode] = useState<"FULL" | "CUSTOM">("FULL");
  const [customAmount, setCustomAmount] = useState("");
  const [tipRate, setTipRate] = useState(0);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const data = await apiGetSession(sessionId);
    setFull(data);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, [sessionId, participantId]);

  const participant: Participant | undefined = full?.participants.find((p) => p.id === participantId);
  const sessionRemaining = full?.session.remainingTotal ?? 0;
  const allowedFullAmount = participant ? Math.max(0, Math.min(participant.remainingAmount, sessionRemaining)) : 0;
  const sessionAlreadyClosed = full?.session.status === "PAID" && participant?.status !== "PAID";

  const selectedAmount = useMemo(() => {
    if (!participant) return 0;
    if (amountMode === "FULL") return allowedFullAmount;
    return Number(customAmount.replace(",", ".")) || 0;
  }, [amountMode, customAmount, participant, allowedFullAmount]);

  const tipAmount = Math.round(selectedAmount * tipRate) / 100;

  async function startPayment() {
    if (!participant || !full) return;
    setBusy(true);
    setError("");
    setQrPayload(null);
    setLastPaymentId(null);

    try {
      const result = await apiCreatePayment({
        sessionId,
        participantId,
        method,
        amount: selectedAmount,
        tipAmount,
        note: method === "CASH" ? "Nakit ödeme simülasyonu" : undefined
      });

      setFull(result.full);
      setLastPaymentId(result.payment.id);

      if (result.providerPayload?.qrPayload) {
        setQrPayload(result.providerPayload.qrPayload);
      }

      if (method === "CARD") {
        const captured = await apiCapturePayment(result.payment.id);
        setFull(captured.full);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ödeme başlatılamadı");
    } finally {
      setBusy(false);
    }
  }

  async function confirmQr() {
    if (!lastPaymentId) return;
    setBusy(true);
    try {
      const result = await apiCapturePayment(lastPaymentId);
      setFull(result.full);
      setQrPayload(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "QR ödeme onaylanamadı");
    } finally {
      setBusy(false);
    }
  }

  if (!full || !participant) {
    return <main className="page narrow"><div className="card">Katılımcı ödeme ekranı yükleniyor...</div></main>;
  }

  const { session } = full;

  return (
    <main className="page narrow">
      <section className="pay-hero">
        <div>
          <span className="step-dot">8</span>
          <p className="eyebrow">Katılımcı Deneyimi</p>
          <h1>{participant.avatar} {participant.name}</h1>
          <p className="muted">{session.title} · Üye olmana gerek yok.</p>
        </div>
        <ShieldCheck className="hero-shield" />
      </section>

      <section className="card payment-card">
        <div className="amount-center">
          <span>Ödenecek Pay</span>
          <strong>{formatTry(allowedFullAmount)}</strong>
          <p>{session.merchantName}</p>
        </div>

        {participant.status === "PAID" ? (
          <div className="success-box">
            <CheckCircle2 size={54} />
            <h2>Payın ödendi</h2>
            <p>Sipariş sahibi ödeme durumunu host panelde görebilir.</p>
            <a className="link-button" href={`/host/${session.id}`}>Host panelini gör</a>
          </div>
        ) : sessionAlreadyClosed || allowedFullAmount <= 0 ? (
          <div className="success-box">
            <CheckCircle2 size={54} />
            <h2>Sepet kapandı</h2>
            <p>Bu session toplam olarak tamamlanmış görünüyor. Yeni deneme için host panelden yeni demo başlat.</p>
            <a className="link-button" href={`/host/${session.id}`}>Host paneline dön</a>
          </div>
        ) : (
          <>
            <h3>Ödeme tutarı</h3>
            <div className="segmented two-seg">
              <button className={amountMode === "FULL" ? "active" : ""} onClick={() => setAmountMode("FULL")}>Tam payım</button>
              <button className={amountMode === "CUSTOM" ? "active" : ""} onClick={() => setAmountMode("CUSTOM")}>Kısmi tutar</button>
            </div>

            {amountMode === "CUSTOM" && (
              <label className="field">
                Ödenecek tutar
                <input inputMode="decimal" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder={`Maks. ${allowedFullAmount}`} />
              </label>
            )}

            <h3>Bahşiş</h3>
            <div className="segmented">
              {[0, 5, 10, 15].map((rate) => (
                <button key={rate} className={tipRate === rate ? "active" : ""} onClick={() => setTipRate(rate)}>
                  %{rate}
                </button>
              ))}
            </div>

            <h3>Ödeme yöntemi</h3>
            <div className="method-grid">
              <MethodButton icon={<CreditCard />} label="Kart" active={method === "CARD"} onClick={() => setMethod("CARD")} />
              <MethodButton icon={<QrCode />} label="Banka QR" active={method === "BANK_QR"} onClick={() => setMethod("BANK_QR")} />
              <MethodButton icon={<Banknote />} label="Nakit" active={method === "CASH"} onClick={() => setMethod("CASH")} />
            </div>

            <div className="pay-summary">
              <div><span>Pay</span><strong>{formatTry(selectedAmount)}</strong></div>
              <div><span>Bahşiş</span><strong>{formatTry(tipAmount)}</strong></div>
              <div><span>Toplam</span><strong>{formatTry(selectedAmount + tipAmount)}</strong></div>
            </div>

            {qrPayload && (
              <div className="qr-box">
                <QrCode size={72} />
                <p>{qrPayload}</p>
                <button className="primary" onClick={confirmQr} disabled={busy}>QR Ödemesini Simüle Et / Onayla</button>
              </div>
            )}

            {error && <div className="error">{error}</div>}

            <button className="primary large" onClick={startPayment} disabled={busy || selectedAmount <= 0 || selectedAmount > allowedFullAmount}>
              {busy ? "İşleniyor..." : "Ödemeye Devam Et"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}

function MethodButton(props: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`method-button ${props.active ? "active" : ""}`} onClick={props.onClick}>
      {props.icon}
      <span>{props.label}</span>
    </button>
  );
}
