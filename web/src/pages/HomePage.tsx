import { useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard, QrCode, ShieldCheck, ShoppingBag, UsersRound } from "lucide-react";
import { apiCreateDemoSession } from "../api";

const templates = [
  "Akşam Yemeği",
  "Market",
  "Etkinlik",
  "Ofis Yemeği",
  "Alışveriş Sitesi"
];

export function HomePage() {
  const [templateIndex, setTemplateIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function startDemo() {
    setBusy(true);
    setError("");

    try {
      const result = await apiCreateDemoSession({ templateIndex });
      window.location.href = result.hostUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo başlatılamadı");
      setBusy(false);
    }
  }

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <span className="step-dot">1</span>
          <p className="eyebrow">SplitCart Live Demo</p>
          <h1>Ortak alışverişte yeni ödeme deneyimi</h1>
          <p className="lead">
            Sepeti tek kişi oluşturur, arkadaşlarını linkle davet eder. Herkes kendi payını kart, QR veya nakit senaryosuyla öder.
            Host paneli siparişin kapanma durumunu canlı izler.
          </p>

          <div className="template-picker">
            {templates.map((name, index) => (
              <button key={name} className={templateIndex === index ? "active" : ""} onClick={() => setTemplateIndex(index)}>
                {index === 4 ? <ShoppingBag size={16} /> : null}
                {name}
              </button>
            ))}
          </div>

          <div className="hero-actions">
            <button className="primary xl" onClick={startDemo} disabled={busy}>
              {busy ? "Demo hazırlanıyor..." : "SplitCart Demo Başlat"}
              <ArrowRight size={20} />
            </button>
          </div>

          {error && <div className="error">{error}</div>}
        </div>

        <div className="phone-showcase">
          <div className="phone">
            <div className="notch" />
            <div className="phone-card">
              <div className="cart-icon"><UsersRound /></div>
              <h3>Sepet Toplamı</h3>
              <strong>1.200,00 TL</strong>
              <div className="mini-person"><span>👩 Ali</span><b>300 TL</b></div>
              <div className="mini-person"><span>👨 Buse</span><b>300 TL</b></div>
              <div className="mini-person"><span>🧑 Can</span><b>300 TL</b></div>
              <div className="mini-person"><span>👱 Deniz</span><b>300 TL</b></div>
              <button>Ödemeye Devam Et</button>
            </div>
          </div>
        </div>
      </section>

      <section className="how-grid">
        <div className="how-card">
          <CheckCircle2 />
          <h3>Sepet oluşturulur</h3>
          <p>Host toplam siparişi başlatır.</p>
        </div>
        <div className="how-card">
          <UsersRound />
          <h3>Arkadaşlar davet edilir</h3>
          <p>Her kişi için güvenli ödeme linki oluşur.</p>
        </div>
        <div className="how-card">
          <CreditCard />
          <h3>Herkes kendi payını öder</h3>
          <p>Kart, banka QR veya nakit senaryosu desteklenir.</p>
        </div>
        <div className="how-card">
          <QrCode />
          <h3>Host panel takip eder</h3>
          <p>Ödenen/kalan tutar ve ledger görünür.</p>
        </div>
        <div className="how-card">
          <ShieldCheck />
          <h3>Şeffaf kayıt</h3>
          <p>Tüm işlemler ledger mantığıyla kaydedilir.</p>
        </div>
      </section>
    </main>
  );
}
