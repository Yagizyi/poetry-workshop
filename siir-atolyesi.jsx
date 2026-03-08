import { useState, useRef, useEffect } from "react";

// ─── STORAGE HELPERS ───────────────────────────────────────────────────────────
const getUsers = () => { try { return JSON.parse(localStorage.getItem("siir_users") || "{}"); } catch { return {}; } };
const saveUsers = (u) => localStorage.setItem("siir_users", JSON.stringify(u));
const getSession = () => { try { return JSON.parse(localStorage.getItem("siir_session") || "null"); } catch { return null; } };
const saveSession = (s) => localStorage.setItem("siir_session", JSON.stringify(s));
const clearSession = () => localStorage.removeItem("siir_session");
const getUserPoems = (email) => { const u = getUsers(); return u[email]?.poems || []; };
const saveUserPoem = (email, poem) => {
  const users = getUsers();
  if (!users[email]) return;
  const poems = users[email].poems || [];
  const idx = poems.findIndex(p => p.id === poem.id);
  if (idx >= 0) poems[idx] = poem; else poems.unshift(poem);
  users[email].poems = poems;
  saveUsers(users);
};
const deleteUserPoem = (email, id) => {
  const users = getUsers();
  if (!users[email]) return;
  users[email].poems = (users[email].poems || []).filter(p => p.id !== id);
  saveUsers(users);
};

// ─── HECE ────────────────────────────────────────────────────────────────────
const VOWELS = "aeıioöuüAEIİOÖUÜ";
const heceCount = (line) => { let n = 0; for (const c of line) if (VOWELS.includes(c)) n++; return n; };
const HECE_MAP = { "7li": 7, "8li": 8, "11li": 11, "14lu": 14 };
const checkLine = (line, olcuId, target) => {
  if (olcuId !== "hece" || !target || !line.trim()) return null;
  const n = heceCount(line.trim());
  return n !== target ? { count: n, expected: target } : null;
};

// ─── DATA ────────────────────────────────────────────────────────────────────
const OLCULER = [
  { id: "hece", label: "Hece Ölçüsü", desc: "Hece sayısına dayalı", heceSecim: true },
  { id: "aruz", label: "Aruz Ölçüsü", desc: "Klasik Divan geleneği" },
  { id: "serbest", label: "Serbest", desc: "Ölçü ve uyak yok" },
  { id: "sonet", label: "Sonet", desc: "14 dize, belirli uyak" },
];
const HECE_SAYILARI = [
  { id: "7li", label: "7'li" }, { id: "8li", label: "8'li" },
  { id: "11li", label: "11'li" }, { id: "14lu", label: "14'lü" },
];
const AKIMLAR = [
  { id: "romantizm", label: "Romantizm", desc: "Duygu & doğa" },
  { id: "parnasizm", label: "Parnasizm", desc: "Biçim & estetik" },
  { id: "sembolizm", label: "Sembolizm", desc: "İmge & çağrışım" },
  { id: "realizm", label: "Realizm", desc: "Gerçek & yalın" },
  { id: "varoluşculuk", label: "Varoluşçuluk", desc: "Anlam & özgürlük" },
  { id: "serbest_akim", label: "Serbest", desc: "Akım yok, sadece sen" },
];
const TEMALAR = [
  { id: "ask", label: "Aşk" }, { id: "huzun", label: "Hüzün" },
  { id: "doga", label: "Doğa" }, { id: "isyan", label: "İsyan" },
  { id: "olum", label: "Ölüm" }, { id: "ozgurluk", label: "Özgürlük" },
];

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0c0c0e", surface: "#131316", border: "#222228",
  accent: "#c8a97e", accentDim: "#c8a97e18",
  text: "#e8e4dd", dim: "#5a5860", green: "#7ec8a0", red: "#e06c75",
};

// ─── APP ────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => getSession());
  const [screen, setScreen] = useState(() => getSession() ? "home" : "landing");

  const login = (u) => { saveSession(u); setUser(u); setScreen("home"); };
  const logout = () => { clearSession(); setUser(null); setScreen("landing"); };

  if (!user || screen === "landing") return <Landing onAuth={login} />;
  if (screen === "home") return <Home user={user} onLogout={logout} onNew={() => setScreen("setup")} onOpen={(p) => setScreen({ n: "editor", poem: p })} />;
  if (screen === "setup") return <Setup onBack={() => setScreen("home")} onStart={(cfg) => setScreen({ n: "editor", cfg })} />;
  if (screen?.n === "editor") return <Editor user={user} cfg={screen.cfg} poem={screen.poem} onBack={() => setScreen("home")} />;
  return null;
}

// ─── LANDING ────────────────────────────────────────────────────────────────
function Landing({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    setErr("");
    if (!email.trim() || !pass) return setErr("E-posta ve şifre gerekli.");
    const users = getUsers();
    if (mode === "signup") {
      if (!name.trim()) return setErr("İsim gerekli.");
      if (pass.length < 6) return setErr("Şifre en az 6 karakter olmalı.");
      if (users[email]) return setErr("Bu e-posta zaten kayıtlı.");
      users[email] = { email, name, pass, poems: [] };
      saveUsers(users);
      onAuth({ email, name });
    } else {
      const u = users[email];
      if (!u || u.pass !== pass) return setErr("E-posta veya şifre hatalı.");
      onAuth({ email, name: u.name });
    }
  };

  return (
    <div style={pg}>
      <BgLines />
      <div style={{ textAlign: "center", zIndex: 1, maxWidth: 460, width: "100%", padding: "0 24px", animation: "fs .6s ease" }}>
        <Logo />
        <p style={{ fontSize: 28, lineHeight: 1.6, marginBottom: 36, fontWeight: "normal" }}>
          Müzik gibi şiir üret.<br /><span style={{ color: C.dim }}>Ölçünü seç. Akımını bul. Yaz.</span>
        </p>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "28px 28px 24px", textAlign: "left" }}>
          <div style={{ display: "flex", marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }}
                style={{ flex: 1, background: "none", border: "none", color: mode === m ? C.accent : C.dim, padding: "10px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia,serif", letterSpacing: "0.05em", borderBottom: mode === m ? `2px solid ${C.accent}` : "2px solid transparent", marginBottom: -1 }}>
                {m === "login" ? "Giriş" : "Kayıt Ol"}
              </button>
            ))}
          </div>

          {mode === "signup" && <Inp label="İsim" value={name} onChange={setName} placeholder="Adın" />}
          <Inp label="E-posta" value={email} onChange={setEmail} placeholder="ornek@mail.com" type="email" />
          <Inp label="Şifre" value={pass} onChange={setPass} placeholder="••••••" type="password" onEnter={submit} />

          {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 10 }}>{err}</div>}
          <button onClick={submit} style={{ width: "100%", background: C.accent, color: C.bg, border: "none", padding: "13px", fontSize: 14, cursor: "pointer", fontFamily: "Georgia,serif" }}>
            {mode === "login" ? "Giriş Yap →" : "Hesap Oluştur →"}
          </button>
        </div>
      </div>
      <Css />
    </div>
  );
}

// ─── HOME ───────────────────────────────────────────────────────────────────
function Home({ user, onLogout, onNew, onOpen }) {
  const [poems, setPoems] = useState(() => getUserPoems(user.email));
  const [delId, setDelId] = useState(null);

  const confirmDel = () => { deleteUserPoem(user.email, delId); setPoems(getUserPoems(user.email)); setDelId(null); };

  return (
    <div style={pg}>
      <BgLines />
      <div style={{ zIndex: 1, width: "100%", maxWidth: 860, padding: "40px 24px", animation: "fs .4s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48, borderBottom: `1px solid ${C.border}`, paddingBottom: 20 }}>
          <Logo small />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: C.dim }}>{user.name}</span>
            <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, color: C.dim, padding: "6px 14px", fontSize: 11, cursor: "pointer", letterSpacing: "0.1em" }}>Çıkış</button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: "normal", margin: 0 }}>Şiirlerim</h2>
          <button onClick={onNew} style={{ background: C.accent, color: C.bg, border: "none", padding: "10px 22px", fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" }}>+ Yeni Şiir</button>
        </div>

        {poems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <span style={{ fontSize: 28, color: C.accent, display: "block", marginBottom: 16 }}>✦</span>
            <p style={{ fontSize: 18, lineHeight: 1.8, marginBottom: 28 }}>Henüz şiir yok.<br /><span style={{ color: C.dim }}>İlk şiirini yaz.</span></p>
            <button onClick={onNew} style={{ background: C.accent, color: C.bg, border: "none", padding: "12px 32px", fontSize: 14, cursor: "pointer", fontFamily: "Georgia,serif" }}>Başla →</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
            {poems.map(p => (
              <div key={p.id} onClick={() => onOpen(p)} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 18, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, color: C.text }}>{p.title || "İsimsiz Şiir"}</span>
                  <button onClick={e => { e.stopPropagation(); setDelId(p.id); }} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 12, padding: 2 }}>✕</button>
                </div>
                <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.8, margin: 0, whiteSpace: "pre-line", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                  {p.content?.split("\n").slice(0, 3).join("\n") || ""}
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                  <Tag>{p.olcu}</Tag>
                  <Tag>{p.akim}</Tag>
                  <span style={{ marginLeft: "auto", fontSize: 9, color: C.dim, letterSpacing: "0.1em" }}>{p.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {delId && (
        <div style={{ position: "fixed", inset: 0, background: "#0009", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "28px 32px", maxWidth: 300 }}>
            <p style={{ fontSize: 15, marginBottom: 20, lineHeight: 1.6 }}>Bu şiiri silmek istediğine emin misin?</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDelId(null)} style={{ flex: 1, background: "none", border: `1px solid ${C.border}`, color: C.dim, padding: "10px", cursor: "pointer", fontFamily: "Georgia,serif" }}>İptal</button>
              <button onClick={confirmDel} style={{ flex: 1, background: C.red, border: "none", color: "#fff", padding: "10px", cursor: "pointer", fontFamily: "Georgia,serif" }}>Sil</button>
            </div>
          </div>
        </div>
      )}
      <Css />
    </div>
  );
}

// ─── SETUP ──────────────────────────────────────────────────────────────────
function Setup({ onBack, onStart }) {
  const [step, setStep] = useState(0);
  const [olcu, setOlcu] = useState(null);
  const [heceSayisi, setHeceSayisi] = useState(null);
  const [akim, setAkim] = useState(null);
  const [tema, setTema] = useState(null);
  const [title, setTitle] = useState("");

  const hasHece = olcu?.heceSecim;
  const totalSteps = hasHece ? 4 : 3;
  const labels = hasHece ? ["Ölçü", "Hece", "Akım", "Tema"] : ["Ölçü", "Akım", "Tema"];
  const akimStep = hasHece ? 2 : 1;
  const temaStep = hasHece ? 3 : 2;

  const canNext = () => {
    if (step === 0) return !!olcu;
    if (step === 1 && hasHece) return !!heceSayisi;
    if (step === akimStep) return !!akim;
    if (step === temaStep) return !!tema;
    return false;
  };

  const next = () => step < totalSteps - 1 ? setStep(s => s + 1) : onStart({ olcu, heceSayisi, akim, tema, title: title.trim() || "İsimsiz Şiir" });
  const back = () => step > 0 ? setStep(s => s - 1) : onBack();

  return (
    <div style={pg}>
      <BgLines />
      <div style={{ zIndex: 1, width: "100%", maxWidth: 560, padding: "40px 24px", animation: "fs .4s ease" }}>
        <button onClick={back} style={bk}>← Geri</button>

        <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
          {labels.map((l, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>
              <div style={{ width: 24, height: 2, background: i <= step ? C.accent : C.border, transition: "background .3s" }} />
              <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: i === step ? C.accent : C.dim }}>{l}</span>
            </div>
          ))}
        </div>

        <div style={{ animation: "fs .3s ease" }}>
          {step === 0 && <>
            <SectionTitle title="Ölçü" sub="Şiirinin ritmi ne olsun?" />
            <div style={g2}>{OLCULER.map(o => <OptCard key={o.id} label={o.label} desc={o.desc} active={olcu?.id === o.id} onClick={() => { setOlcu(o); if (!o.heceSecim) setHeceSayisi(null); }} />)}</div>
          </>}

          {step === 1 && hasHece && <>
            <SectionTitle title="Hece Sayısı" sub="Her dize kaç hece olsun?" />
            <div style={g2}>{HECE_SAYILARI.map(h => <OptCard key={h.id} label={h.label} desc={`${HECE_MAP[h.id]} hece`} active={heceSayisi?.id === h.id} onClick={() => setHeceSayisi(h)} />)}</div>
          </>}

          {step === akimStep && <>
            <SectionTitle title="Akım" sub="Hangi edebi geleneği izleyeceksin?" />
            <div style={g2}>{AKIMLAR.map(a => <OptCard key={a.id} label={a.label} desc={a.desc} active={akim?.id === a.id} onClick={() => setAkim(a)} />)}</div>
          </>}

          {step === temaStep && <>
            <SectionTitle title="Tema & Başlık" sub="Şiirinin kalbi ne?" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
              {TEMALAR.map(t => (
                <button key={t.id} onClick={() => setTema(t)} style={{ background: C.surface, border: `1px solid ${tema?.id === t.id ? C.accent : C.border}`, padding: "10px 20px", cursor: "pointer", fontSize: 14, color: tema?.id === t.id ? C.accent : C.text, fontFamily: "Georgia,serif", background: tema?.id === t.id ? C.accentDim : C.surface }}>
                  {t.label}
                </button>
              ))}
            </div>
            <Inp label="Şiir Başlığı (opsiyonel)" value={title} onChange={setTitle} placeholder="Başlık..." />
          </>}
        </div>

        <button disabled={!canNext()} onClick={next} style={{ width: "100%", background: C.accent, color: C.bg, border: "none", padding: "14px", fontSize: 14, cursor: canNext() ? "pointer" : "not-allowed", fontFamily: "Georgia,serif", marginTop: 8, opacity: canNext() ? 1 : 0.3 }}>
          {step < totalSteps - 1 ? "İleri →" : "Yazmaya Başla ✦"}
        </button>
      </div>
      <Css />
    </div>
  );
}

// ─── EDITOR ─────────────────────────────────────────────────────────────────
function Editor({ user, cfg, poem: initPoem, onBack }) {
  const isExisting = !!initPoem;
  const resolvedCfg = isExisting ? {
    olcu: OLCULER.find(o => o.label === initPoem.olcu) || OLCULER[2],
    heceSayisi: HECE_SAYILARI.find(h => h.label === initPoem.heceSayisi) || null,
    akim: AKIMLAR.find(a => a.label === initPoem.akim) || AKIMLAR[5],
    tema: TEMALAR.find(t => t.label === initPoem.tema) || TEMALAR[0],
    title: initPoem.title,
  } : cfg;

  const [lines, setLines] = useState(() => (isExisting ? initPoem.content : "").split("\n").length > 0 ? (isExisting ? initPoem.content : "").split("\n") : [""]);
  const [title, setTitle] = useState(resolvedCfg.title || "İsimsiz Şiir");
  const [editTitle, setEditTitle] = useState(false);
  const [analiz, setAnaliz] = useState("");
  const [oneri, setOneri] = useState("");
  const [loading, setLoading] = useState(false);
  const [oneriLoading, setOneriLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const poemId = useRef(initPoem?.id || Date.now().toString());
  const timer = useRef(null);
  const lineRefs = useRef([]);

  const { olcu, heceSayisi, akim, tema } = resolvedCfg;
  const heceTarget = heceSayisi ? HECE_MAP[heceSayisi.id] : null;

  const lineErrors = {};
  if (olcu?.id === "hece" && heceTarget) {
    lines.forEach((l, i) => { const e = checkLine(l, "hece", heceTarget); if (e) lineErrors[i] = e; });
  }

  const errCount = Object.keys(lineErrors).length;
  const fullText = lines.join("\n");

  const updateLine = (i, val) => {
    const nl = [...lines];
    nl[i] = val;
    setLines(nl);
    setSaved(false);
    clearTimeout(timer.current);
    if (nl.join("\n").trim().length > 20)
      timer.current = setTimeout(() => analizeEt(nl.join("\n")), 2000);
  };

  const handleKey = (i, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nl = [...lines]; nl.splice(i + 1, 0, ""); setLines(nl);
      setTimeout(() => lineRefs.current[i + 1]?.focus(), 30);
    } else if (e.key === "Backspace" && lines[i] === "" && lines.length > 1) {
      e.preventDefault();
      const nl = [...lines]; nl.splice(i, 1); setLines(nl);
      setTimeout(() => lineRefs.current[Math.max(0, i - 1)]?.focus(), 30);
    }
  };

  const analizeEt = async (text) => {
    setLoading(true);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `Sen bir şiir editörüsün. ${olcu?.label}${heceTarget ? ` (${heceTarget} hece)` : ""}, ${akim?.label}, tema: ${tema?.label}. Sadece JSON döndür: {"analiz":"2-3 cümle kısa Türkçe analiz"}`,
          messages: [{ role: "user", content: text }],
        }),
      });
      const d = await r.json();
      const t = d.content?.map(c => c.text || "").join("") || "";
      try { const p = JSON.parse(t.replace(/```json|```/g, "").trim()); setAnaliz(p.analiz || t.slice(0, 200)); }
      catch { setAnaliz(t.slice(0, 200)); }
    } catch { setAnaliz("Analiz yapılamadı."); }
    setLoading(false);
  };

  const oneriAl = async () => {
    setOneriLoading(true); setOneri("");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 300,
          system: `Şiir asistanısın. ${olcu?.label}${heceTarget ? ` (${heceTarget} hece)` : ""}, ${akim?.label}, tema ${tema?.label}. Devam için 1-3 dize öner. Sadece dizeleri yaz.`,
          messages: [{ role: "user", content: fullText ? `Şiir:\n${fullText}\n\nDevam:` : "Başlangıç dizeleri öner." }],
        }),
      });
      const d = await r.json();
      setOneri(d.content?.map(c => c.text || "").join("").trim() || "");
    } catch { setOneri("Öneri alınamadı."); }
    setOneriLoading(false);
  };

  const kaydet = () => {
    saveUserPoem(user.email, {
      id: poemId.current, title, content: fullText,
      olcu: olcu?.label, heceSayisi: heceSayisi?.label || null,
      akim: akim?.label, tema: tema?.label,
      date: new Date().toLocaleDateString("tr-TR"),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const addOneri = () => {
    if (!oneri) return;
    const added = oneri.split("\n").filter(Boolean);
    setLines(prev => [...prev.filter(l => l !== ""), ...added, ""]);
    setOneri("");
  };

  return (
    <div style={{ ...pg, alignItems: "stretch" }}>
      <div style={{ display: "flex", width: "100%", minHeight: "100vh" }}>
        {/* LEFT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}`, padding: "20px 28px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
            <button onClick={onBack} style={bk}>←</button>
            {editTitle
              ? <input value={title} onChange={e => setTitle(e.target.value)} onBlur={() => setEditTitle(false)} autoFocus style={{ flex: 1, background: "transparent", border: "none", borderBottom: `1px solid ${C.accent}`, color: C.text, fontSize: 17, fontFamily: "Georgia,serif", outline: "none", padding: "2px 4px" }} />
              : <span onClick={() => setEditTitle(true)} style={{ flex: 1, fontSize: 17, color: C.text, cursor: "text" }}>{title} <span style={{ fontSize: 11, color: C.dim }}>✎</span></span>
            }
            <button onClick={kaydet} style={{ background: saved ? "none" : C.accent, color: saved ? C.green : C.bg, border: saved ? `1px solid ${C.green}` : "none", padding: "7px 18px", fontSize: 11, cursor: "pointer", fontFamily: "Georgia,serif", letterSpacing: "0.08em", transition: "all .3s" }}>
              {saved ? "✓ Kaydedildi" : "Kaydet"}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}>
            {lines.map((line, i) => {
              const err = lineErrors[i];
              const ok = olcu?.id === "hece" && heceTarget && !err && line.trim();
              return (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 2 }}>
                  <span style={{ width: 22, textAlign: "right", color: C.dim, fontSize: 11, paddingTop: 7, flexShrink: 0, userSelect: "none" }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <input
                      ref={el => lineRefs.current[i] = el}
                      value={line}
                      onChange={e => updateLine(i, e.target.value)}
                      onKeyDown={e => handleKey(i, e)}
                      placeholder={i === 0 ? `${tema?.label} üzerine yaz...` : ""}
                      style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${err ? C.red : "transparent"}`, color: C.text, fontSize: 20, fontFamily: "Georgia,serif", lineHeight: 1.9, outline: "none", padding: "2px 0", letterSpacing: "0.01em", boxSizing: "border-box", transition: "border-color .2s" }}
                    />
                    {err && <div style={{ fontSize: 10, color: C.red, letterSpacing: "0.04em", marginBottom: 4 }}>⚠ {err.count} hece yazıldı — {err.expected} hece olmalı</div>}
                    {ok && <div style={{ fontSize: 10, color: C.green, opacity: 0.6, marginBottom: 2 }}>✓ {heceCount(line)} hece</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, fontSize: 11, letterSpacing: "0.1em", display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ color: C.dim }}>{lines.filter(Boolean).length} dize · {fullText.length} karakter</span>
            {errCount > 0 && <span style={{ color: C.red, fontSize: 10 }}>⚠ {errCount} satırda hece hatası</span>}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ width: 284, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 24, background: C.surface, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Tag>{olcu?.label}{heceTarget ? ` · ${heceTarget}'li` : ""}</Tag>
            <Tag>{akim?.label}</Tag>
            <Tag>{tema?.label}</Tag>
          </div>

          <PanelSection label={<><Dot />Anlık Analiz {loading && <span style={{ color: C.accent, animation: "dp 1s infinite" }}>···</span>}</>}>
            <div style={{ fontSize: 12, lineHeight: 1.8, color: "#9a96a0", background: C.bg, padding: 12, border: `1px solid ${C.border}`, minHeight: 70 }}>
              {analiz || <span style={{ color: C.dim }}>Yazmaya başlayınca Claude analiz eder...</span>}
            </div>
          </PanelSection>

          {olcu?.id === "hece" && heceTarget && (
            <PanelSection label="Hece Durumu">
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { n: heceTarget, label: "hedef", color: C.accent },
                  { n: errCount, label: "hatalı", color: errCount > 0 ? C.red : C.green },
                  { n: lines.filter((l, i) => l.trim() && !lineErrors[i]).length, label: "doğru", color: C.green },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, padding: "10px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, color: s.color }}>{s.n}</div>
                    <div style={{ fontSize: 9, color: C.dim, letterSpacing: "0.08em" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </PanelSection>
          )}

          <PanelSection label={<><Dot />Dize Önerisi</>}>
            {oneri ? (
              <div style={{ background: C.bg, border: `1px solid ${C.accent}44`, padding: 12 }}>
                <p style={{ fontSize: 14, lineHeight: 2, color: C.text, fontFamily: "Georgia,serif", margin: "0 0 10px", fontStyle: "italic" }}>{oneri}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={addOneri} style={{ background: C.accent, color: C.bg, border: "none", padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "Georgia,serif" }}>+ Ekle</button>
                  <button onClick={() => setOneri("")} style={{ background: "none", border: `1px solid ${C.border}`, color: C.dim, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>✕</button>
                </div>
              </div>
            ) : (
              <button onClick={oneriAl} disabled={oneriLoading} style={{ background: "none", border: `1px solid ${C.border}`, color: C.text, padding: 10, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif", textAlign: "left", width: "100%" }}>
                {oneriLoading ? "Üretiliyor..." : "Öneri Al →"}
              </button>
            )}
          </PanelSection>
        </div>
      </div>
      <Css />
    </div>
  );
}

// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────
const pg = { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia,'Times New Roman',serif", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" };
const bk = { background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 14, padding: "4px 0", fontFamily: "Georgia,serif" };
const g2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 };

function Logo({ small }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: small ? 0 : 28 }}>
      <span style={{ fontSize: small ? 14 : 18, color: C.accent }}>✦</span>
      <span style={{ fontSize: small ? 11 : 12, letterSpacing: "0.3em", textTransform: "uppercase", color: C.dim }}>şiir atölyesi</span>
    </div>
  );
}
function BgLines() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {[...Array(7)].map((_, i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, height: 1, top: `${12 + i * 13}%`, background: `linear-gradient(90deg,transparent,${C.border},transparent)`, animation: `lp 4s ease-in-out infinite`, animationDelay: `${i * .4}s` }} />
      ))}
    </div>
  );
}
function Dot() { return <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, display: "inline-block", animation: "dp 2s ease-in-out infinite" }} />; }
function Tag({ children }) { return <span style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, border: `1px solid ${C.accentDim}`, padding: "2px 8px" }}>{children}</span>; }
function Inp({ label, value, onChange, placeholder, type = "text", onEnter }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.dim, marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} onKeyDown={e => e.key === "Enter" && onEnter?.()}
        style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "10px 14px", fontSize: 14, fontFamily: "Georgia,serif", outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}
function OptCard({ label, desc, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: active ? C.accentDim : C.surface, border: `1px solid ${active ? C.accent : C.border}`, padding: "16px 18px", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 15, color: C.text, fontFamily: "Georgia,serif" }}>{label}</span>
      <span style={{ fontSize: 12, color: C.dim }}>{desc}</span>
    </button>
  );
}
function SectionTitle({ title, sub }) {
  return <>
    <h2 style={{ fontSize: 26, fontWeight: "normal", marginBottom: 6 }}>{title}</h2>
    <p style={{ color: C.dim, marginBottom: 22, fontSize: 13 }}>{sub}</p>
  </>;
}
function PanelSection({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: C.dim, display: "flex", alignItems: "center", gap: 6 }}>{label}</div>
      {children}
    </div>
  );
}
function Css() {
  return <style>{`
    @keyframes fs{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes lp{0%,100%{opacity:0.03}50%{opacity:0.08}}
    @keyframes dp{0%,100%{opacity:1}50%{opacity:0.3}}
    input::placeholder{color:#3a3840}
    input[type=password]{letter-spacing:0.15em}
  `}</style>;
}
