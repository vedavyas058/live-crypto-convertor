import React, { useEffect, useState } from 'react';
import './styles.css';

// Conversion rates (INR -> fiat)
const INR_CONVERT = {
  usd: 1 / 83,
  eur: 1 / 90,
  gbp: 1 / 105,
  aed: 1 / 22.6,
  aud: 1 / 56,
  inr: 1
};

const FIAT_LABEL = {
  usd: "USD",
  inr: "INR",
  eur: "EUR",
  gbp: "GBP",
  aed: "AED",
  aud: "AUD"
};

export default function App() {
  const [coins, setCoins] = useState([]);
  const [fromCoin, setFromCoin] = useState("");
  const [toFiat, setToFiat] = useState("inr");
  const [amount, setAmount] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [selectedCoinDetails, setSelectedCoinDetails] = useState(null);
  const [dark, setDark] = useState(false);

  // ✅ Load coin list (ONLY INR to avoid CoinMarketCap error)
  useEffect(() => {
    fetch("/api/coins?limit=5000&convert=INR")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCoins(data);
          if (data.length > 0) setFromCoin(data[0].id);
        } else {
          console.error("Coins API Error:", data);
          setCoins([]);
        }
      })
      .catch(err => {
        console.error("Coins fetch failed:", err);
        setCoins([]);
      });
  }, []);

  // ✅ Load price for selected coin (ONLY INR)
  useEffect(() => {
    if (fromCoin) loadPrice(fromCoin);
  }, [fromCoin]);

  const loadPrice = async (coinId) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/price?ids=${coinId}&convert=INR`);
      const json = await r.json();

      if (json && json[coinId]) {
        setSelectedCoinDetails(json[coinId]);
      } else {
        setSelectedCoinDetails(null);
      }
    } catch (e) {
      console.error("Price fetch error:", e);
      setSelectedCoinDetails(null);
    }
    setLoading(false);
  };

  // ✅ Convert using INR price from backend
  const convert = () => {
    if (!selectedCoinDetails?.prices) {
      setResult("Price not available");
      return;
    }

    const priceInINR = selectedCoinDetails.prices.inr;
    if (!priceInINR) {
      setResult("Not available");
      return;
    }

    const converted = Number(priceInINR) * Number(amount) * INR_CONVERT[toFiat];
    setResult(converted.toLocaleString());
  };

  const filtered = Array.isArray(coins)
    ? coins.filter(c => {
        const q = searchQ.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div className={dark ? "app-wrap dark" : "app-wrap"}>
      <header className="top">
        <div className="brand">
          <span className="mark">C</span> Crypto Converter
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 13 }}>Dark</label>
          <input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} />
        </div>
      </header>

      <main className="grid">
        <aside className="card left">
          <h3>Coins</h3>
          <input placeholder="Search coin" value={searchQ} onChange={e => setSearchQ(e.target.value)} />

          <div className="coin-list">
            {filtered.slice(0, 200).map(c => (
              <div key={c.id} className="coin-item" onClick={() => setFromCoin(c.id)}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <img src={c.image} width="28" height="28" />
                  <div>
                    <div className="name">{c.name}</div>
                    <div className="small-muted">{c.symbol.toUpperCase()}</div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div className="small-muted">
                    ₹{Number(c.current_price.inr || 0).toLocaleString()}
                  </div>
                  <button className="btn small">Use</button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="card right">
          <h2>Convert</h2>

          <div className="converter">
            <div style={{ flex: 1 }}>
              <label>From (crypto)</label>
              <select value={fromCoin} onChange={e => setFromCoin(e.target.value)}>
                {coins.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: 160 }}>
              <label>To (fiat)</label>
              <select value={toFiat} onChange={e => setToFiat(e.target.value)}>
                <option value="inr">🇮🇳 INR</option>
                <option value="usd">🇺🇸 USD</option>
                <option value="eur">🇪🇺 EUR</option>
                <option value="gbp">🇬🇧 GBP</option>
                <option value="aed">🇦🇪 AED</option>
                <option value="aud">🇦🇺 AUD</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Amount</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={convert}>Convert</button>
            <button className="btn secondary" onClick={() => { setAmount(1); setResult(null); }}>
              Reset
            </button>
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="section-title">Result</div>
            <div className="big">
              {loading ? "Loading..." : result ? `${FIAT_LABEL[toFiat]} ${result}` : "—"}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            {selectedCoinDetails && (
              <div style={{ display: "flex", gap: 10 }}>
                <strong>{selectedCoinDetails.id.toUpperCase()}</strong>
                <div>
                  {FIAT_LABEL[toFiat]}{" "}
                  {selectedCoinDetails.prices.inr
                    ? (
                        selectedCoinDetails.prices.inr * INR_CONVERT[toFiat]
                      ).toLocaleString()
                    : "—"}
                </div>
                <div>
                  {selectedCoinDetails.change24h?.toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
