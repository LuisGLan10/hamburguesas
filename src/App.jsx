import { useState } from "react";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby2nWiojvgmSzdlCdwMVNXq1GulgFnkCGb-I-rPHahOEuhk1sV78TMoxFc6inzvl9AO_Q/exec";

const HAMBURGUESAS = [
  { id: "clasica", nombre: "Clásica", descripcion: "Por confirmar tras prueba de producto" },
];
const PAGOS = ["Efectivo", "Transferencia"];

export default function App() {
  const [view, setView] = useState("form");
  const [form, setFormS] = useState({
    nombre: "", whatsapp: "", hamburguesa: "",
    cantidad: 1, observaciones: "", pago: "", acepta: false,
  });
  const [errores, setErrores] = useState({});

  const sf = (k, v) => {
    setFormS((f) => ({ ...f, [k]: v }));
    setErrores((e) => ({ ...e, [k]: "" }));
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim())   e.nombre      = "Ingresa tu nombre";
    if (!form.whatsapp.trim()) e.whatsapp    = "Ingresa tu WhatsApp";
    if (!form.hamburguesa)     e.hamburguesa = "Elige una hamburguesa";
    if (!form.pago)            e.pago        = "Elige cómo vas a pagar";
    if (!form.acepta)          e.acepta      = "Debes aceptar las condiciones";
    return e;
  };

  const handleSubmit = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErrores(e); return; }
    setView("loading");

    const order = {
      id: Date.now().toString(),
      nombre: form.nombre,
      whatsapp: form.whatsapp,
      hamburguesa: HAMBURGUESAS.find((h) => h.id === form.hamburguesa)?.nombre || form.hamburguesa,
      cantidad: form.cantidad,
      observaciones: form.observaciones,
      pago: form.pago,
      fechaPedido: new Date().toLocaleString("es-EC"),
    };

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
    } catch (_) {}

    setView("success");
  };

  const resetForm = () => {
    setFormS({ nombre: "", whatsapp: "", hamburguesa: "", cantidad: 1, observaciones: "", pago: "", acepta: false });
    setView("form");
  };

  if (view === "loading") {
    return (
      <div style={s.page}>
        <style>{css}</style>
        <div style={s.center}>
          <div style={s.card}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2 style={s.cardTitle}>Enviando pedido...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (view === "success") {
    const bName = HAMBURGUESAS.find((h) => h.id === form.hamburguesa)?.nombre || form.hamburguesa;
    return (
      <div style={s.page}>
        <style>{css}</style>
        <div style={s.center}>
          <div style={s.card}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🍔</div>
            <h2 style={s.cardTitle}>¡Pedido recibido!</h2>
            <p style={s.cardSub}>Te confirmaremos por WhatsApp antes del domingo.</p>
            <div style={s.receipt}>
              {[
                ["Nombre", form.nombre],
                ["WhatsApp", form.whatsapp],
                ["Pedido", form.cantidad + "x " + bName],
                ["Pago", form.pago],
              ].map(([l, v], i) => (
                <><span key={i+"l"} style={s.rLabel}>{l}</span><span key={i+"v"} style={s.rVal}>{v}</span></>
              ))}
            </div>
            <button style={s.ghostBtn} onClick={resetForm}>Hacer otro pedido</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <style>{css}</style>

      <div style={s.hero}>
        <p style={s.eyebrow}>pedidos semanales</p>
        <h1 style={s.heroTitle}>🍔 Hamburguesería</h1>
        <p style={s.heroSub}>Nombre del negocio por confirmar</p>
      </div>

      <div style={s.infoBanner}>
        <span>📅 Entrega <strong>los lunes</strong> en la universidad</span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span>⏰ Cierre <strong>sábado 9:00 pm</strong></span>
      </div>

      <div style={s.fw}>
        <div style={s.sec}>
          <h3 style={s.secTitle}>Tus datos</h3>
          <Fld label="Nombre completo" err={errores.nombre}>
            <input style={{ ...s.input, ...(errores.nombre ? s.iErr : {}) }} placeholder="¿Cómo te llamas?" value={form.nombre} onChange={(e) => sf("nombre", e.target.value)} />
          </Fld>
          <Fld label="WhatsApp" err={errores.whatsapp}>
            <input style={{ ...s.input, ...(errores.whatsapp ? s.iErr : {}) }} placeholder="0991 234 567" value={form.whatsapp} onChange={(e) => sf("whatsapp", e.target.value)} />
          </Fld>
        </div>

        <div style={s.sec}>
          <h3 style={s.secTitle}>Tu pedido</h3>
          <p style={s.secNote}>Menú definitivo por confirmar tras prueba de producto</p>
          <Fld label="Hamburguesa" err={errores.hamburguesa}>
            {HAMBURGUESAS.map((h) => (
              <div key={h.id} className={"bc " + (form.hamburguesa === h.id ? "bc-on" : "")} style={s.bCard} onClick={() => sf("hamburguesa", h.id)}>
                <span style={s.bName}>{h.nombre}</span>
                <span style={s.bDesc}>{h.descripcion}</span>
              </div>
            ))}
          </Fld>
          <Fld label="Cantidad">
            <div style={s.qRow}>
              <button style={s.qBtn} onClick={() => sf("cantidad", Math.max(1, form.cantidad - 1))}>-</button>
              <span style={s.qNum}>{form.cantidad}</span>
              <button style={s.qBtn} onClick={() => sf("cantidad", Math.min(10, form.cantidad + 1))}>+</button>
            </div>
          </Fld>
          <Fld label="Observaciones" opt>
            <textarea style={s.ta} placeholder="Sin cebolla, alergia a algún ingrediente, etc." value={form.observaciones} onChange={(e) => sf("observaciones", e.target.value)} rows={3} />
          </Fld>
        </div>

        <div style={s.sec}>
          <h3 style={s.secTitle}>Forma de pago</h3>
          <div style={s.radioRow}>
            {PAGOS.map((p) => (
              <button key={p} className={"rb " + (form.pago === p ? "rb-on" : "")} style={{ ...s.rBtn, ...(form.pago === p ? s.rBtnOn : {}) }} onClick={() => sf("pago", p)}>
                {p === "Efectivo" ? "💵" : "📱"} {p}
              </button>
            ))}
          </div>
          {errores.pago && <span style={s.err}>{errores.pago}</span>}
          {form.pago === "Transferencia" && (
            <p style={s.trNote}>El número de cuenta se enviará por WhatsApp al confirmar tu pedido.</p>
          )}
        </div>

        <div style={{ ...s.sec, borderBottom: "none" }}>
          <div style={s.chkRow} onClick={() => sf("acepta", !form.acepta)}>
            <div style={{ ...s.chk, ...(form.acepta ? s.chkOn : {}) }}>{form.acepta && "✓"}</div>
            <span style={s.chkTxt}>
              Entiendo que los pedidos cierran el <strong>sábado a las 9:00 pm</strong> y que la entrega es el <strong>lunes en la universidad</strong>. Los pedidos cancelados después del cierre no tienen devolución.
            </span>
          </div>
          {errores.acepta && <span style={{ ...s.err, marginTop: 6 }}>{errores.acepta}</span>}
        </div>

        <button className="sbtn" style={s.submitBtn} onClick={handleSubmit}>
          Enviar pedido →
        </button>
        <p style={s.fNote}>Te confirmaremos por WhatsApp antes del domingo.</p>
      </div>
    </div>
  );
}

function Fld({ label, opt, err, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      {label && (
        <label style={s.fLabel}>
          {label}
          {opt && <span style={s.opt}> (opcional)</span>}
        </label>
      )}
      {children}
      {err && <span style={s.err}>{err}</span>}
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input, textarea, button { font-family: 'DM Sans', sans-serif; }
  ::placeholder { color: #a08060; }
  input:focus, textarea:focus { outline: none; border-color: #e8a020 !important; }
  .bc { cursor: pointer; transition: all .15s; }
  .bc:hover { border-color: #e8a020 !important; }
  .bc-on { border-color: #e8a020 !important; background: #2a1a08 !important; }
  .rb { cursor: pointer; transition: all .15s; }
  .rb:hover { background: #2a1a08 !important; }
  .rb-on { background: #e8a020 !important; color: #1a0a00 !important; border-color: #e8a020 !important; }
  .sbtn { transition: all .15s; }
  .sbtn:hover { background: #f0b030 !important; }
  .sbtn:active { transform: translateY(1px); }
`;
const s = {
  page:      { minHeight: "100vh", background: "#120a00", fontFamily: "'DM Sans',sans-serif", color: "#f5e8d0", paddingBottom: 60 },
  hero:      { background: "linear-gradient(160deg,#2a1500,#1a0a00)", borderBottom: "1px solid #1e1008", padding: "48px 24px 40px", textAlign: "center" },
  eyebrow:   { fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#e8a020", marginBottom: 12 },
  heroTitle: { fontFamily: "'Playfair Display',serif", fontSize: 42, fontWeight: 900, color: "#f5e8d0", lineHeight: 1.1, marginBottom: 8 },
  heroSub:   { fontSize: 13, color: "#a08060", fontStyle: "italic" },
  infoBanner:{ background: "#e8a020", padding: "12px 24px", display: "flex", justifyContent: "center", alignItems: "center", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#1a0a00" },
  fw:        { maxWidth: 520, margin: "0 auto", padding: "0 20px" },
  sec:       { marginTop: 32, paddingBottom: 28, borderBottom: "1px solid #1e1008" },
  secTitle:  { fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "#f5e8d0", marginBottom: 4 },
  secNote:   { fontSize: 12, color: "#907050", fontStyle: "italic", marginBottom: 12 },
  fLabel:    { display: "block", fontSize: 12, fontWeight: 600, color: "#c8a870", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" },
  opt:       { fontWeight: 400, textTransform: "none", color: "#705040", fontSize: 11 },
  input:     { width: "100%", background: "#1e1008", border: "1px solid #2a1a08", borderRadius: 8, padding: "12px 14px", fontSize: 15, color: "#f5e8d0" },
  iErr:      { borderColor: "#e05030" },
  ta:        { width: "100%", background: "#1e1008", border: "1px solid #2a1a08", borderRadius: 8, padding: "12px 14px", fontSize: 15, color: "#f5e8d0", resize: "vertical", outline: "none" },
  err:       { display: "block", fontSize: 12, color: "#e06040", marginTop: 5 },
  bCard:     { background: "#1e1008", border: "1px solid #2a1a08", borderRadius: 10, padding: "14px 16px", marginBottom: 8 },
  bName:     { display: "block", fontSize: 15, fontWeight: 600, color: "#f5e8d0", marginBottom: 2 },
  bDesc:     { display: "block", fontSize: 12, color: "#907050", fontStyle: "italic" },
  qRow:      { display: "flex", alignItems: "center", gap: 16 },
  qBtn:      { width: 40, height: 40, borderRadius: 8, border: "1px solid #2a1a08", background: "#1e1008", color: "#e8a020", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  qNum:      { fontSize: 24, fontWeight: 700, color: "#f5e8d0", minWidth: 32, textAlign: "center" },
  radioRow:  { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 },
  rBtn:      { padding: "10px 20px", borderRadius: 8, border: "1px solid #2a1a08", background: "#1e1008", color: "#c8a870", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  rBtnOn:    { background: "#e8a020", color: "#1a0a00", borderColor: "#e8a020" },
  trNote:    { marginTop: 10, padding: "10px 14px", background: "#1e1008", border: "1px solid #2a1a08", borderRadius: 8, fontSize: 13, color: "#907050", fontStyle: "italic" },
  chkRow:    { display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" },
  chk:       { width: 22, height: 22, minWidth: 22, borderRadius: 5, border: "1px solid #3a2a10", background: "#1e1008", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#1a0a00", fontWeight: 700, marginTop: 2 },
  chkOn:     { background: "#e8a020", borderColor: "#e8a020" },
  chkTxt:    { fontSize: 13, color: "#907050", lineHeight: 1.6 },
  submitBtn: { width: "100%", marginTop: 28, padding: "16px", background: "#e8a020", color: "#1a0a00", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em" },
  fNote:     { textAlign: "center", marginTop: 14, fontSize: 12, color: "#503020" },
  center:    { display: "flex", justifyContent: "center", padding: "80px 20px" },
  card:      { width: "100%", maxWidth: 400, background: "#1e1008", border: "1px solid #2a1a08", borderRadius: 16, padding: "40px 28px", textAlign: "center" },
  cardTitle: { fontFamily: "'Playfair Display',serif", fontSize: 26, color: "#f5e8d0", marginBottom: 10 },
  cardSub:   { fontSize: 14, color: "#907050", lineHeight: 1.6, marginBottom: 24 },
  receipt:   { display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", textAlign: "left", background: "#120a00", borderRadius: 10, padding: "16px", marginBottom: 24 },
  rLabel:    { fontSize: 11, color: "#605040", textTransform: "uppercase", letterSpacing: "0.08em", alignSelf: "center" },
  rVal:      { fontSize: 14, color: "#f5e8d0", fontWeight: 600 },
  ghostBtn:  { width: "100%", padding: "11px", background: "transparent", border: "1px solid #2a1a08", borderRadius: 8, color: "#c8a870", fontSize: 14, cursor: "pointer" },
};
