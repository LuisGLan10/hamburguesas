import { useState, useRef } from "react";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby4nGYzjYVJxVz01fhU1Lx8G8Sn0yhUdAAXm4xHggaDcSXUur7Fo7h7YTbV6VF5vZTsWA/exec";

const MENU = [
  { id: "classic", nombre: "Classic", descripcion: "Hamburguesa", precio: 5.0 },
  { id: "combo",   nombre: "Combo Classic", descripcion: "Hamburguesa + cola", precio: 6.0 },
];

const PAGOS = ["Efectivo", "Transferencia"];

const DATOS_BANCARIOS = {
  banco: "Banco Guayaquil",
  tipo: "Cuenta Corriente",
  numero: "0030647696",
  titular: "García Landívar Luis Mario",
  cedula: "0931367163",
  correo: "luisgarcialandivar10@gmail.com",
};

const WHATSAPP_NEGOCIO = "0984442894";

export default function App() {
  const [view, setView] = useState("form");
  const [orderResult, setOrderResult] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    whatsapp: "",
    items: MENU.map(m => ({ ...m, cantidad: 0 })),
    observaciones: "",
    pago: "",
    comprobante: null,
    comprobanteNombre: "",
    acepta: false,
  });
  const [errores, setErrores] = useState({});
  const fileRef = useRef(null);
  const receiptRef = useRef(null);

  const sf = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrores(e => ({ ...e, [k]: "" })); };

  const changeQty = (id, delta) => {
    setForm(f => ({
      ...f,
      items: f.items.map(it => it.id === id ? { ...it, cantidad: Math.max(0, Math.min(20, it.cantidad + delta)) } : it),
    }));
    setErrores(e => ({ ...e, items: "" }));
  };

  const totalItems = form.items.reduce((s, it) => s + it.cantidad, 0);
  const total = form.items.reduce((s, it) => s + it.cantidad * it.precio, 0);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrores(er => ({ ...er, comprobante: "El archivo no puede pesar más de 5MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, comprobante: reader.result, comprobanteNombre: file.name }));
      setErrores(er => ({ ...er, comprobante: "" }));
    };
    reader.readAsDataURL(file);
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Ingresa tu nombre y apellido";
    if (form.nombre.trim().split(/\s+/).length < 2) e.nombre = "Ingresa nombre Y apellido";
    if (!form.whatsapp.trim()) e.whatsapp = "Ingresa tu WhatsApp";
    if (totalItems === 0) e.items = "Debes elegir al menos un producto";
    if (!form.pago) e.pago = "Elige cómo vas a pagar";
    if (form.pago === "Transferencia" && !form.comprobante) e.comprobante = "Sube el comprobante de transferencia";
    if (!form.acepta) e.acepta = "Debes aceptar las condiciones";
    return e;
  };

  const handleSubmit = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErrores(e); return; }
    setView("loading");
    const payload = {
      nombre: form.nombre.trim(),
      whatsapp: form.whatsapp.trim(),
      items: form.items.filter(it => it.cantidad > 0).map(it => ({ id: it.id, cantidad: it.cantidad })),
      observaciones: form.observaciones.trim(),
      pago: form.pago,
      comprobanteBase64: form.comprobante || "",
      comprobanteNombre: form.comprobanteNombre || "",
      fechaPedido: new Date().toLocaleString("es-EC"),
    };
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setOrderResult({
          codigo: data.codigo,
          total: data.total,
          itemsTxt: data.itemsTxt,
          nombre: form.nombre,
          whatsapp: form.whatsapp,
          pago: form.pago,
          fecha: payload.fechaPedido,
        });
        setView("success");
      } else {
        alert("Error al enviar el pedido: " + (data.error || "Intenta de nuevo"));
        setView("form");
      }
    } catch (err) {
      alert("Error de conexión. Intenta de nuevo.");
      setView("form");
    }
  };

  const resetForm = () => {
    setForm({ nombre:"", whatsapp:"", items: MENU.map(m => ({ ...m, cantidad: 0 })), observaciones:"", pago:"", comprobante:null, comprobanteNombre:"", acepta:false });
    setOrderResult(null);
    setView("form");
  };

  const compartir = async () => {
    if (!receiptRef.current) return;
    const text = "Comprobante pedido " + orderResult.codigo + " | " + orderResult.nombre + " | " + orderResult.itemsTxt + " | $" + orderResult.total.toFixed(2);
    if (navigator.share) {
      try { await navigator.share({ title: "Comprobante de pedido", text }); } catch (_) {}
    } else {
      try { await navigator.clipboard.writeText(text); alert("Comprobante copiado"); }
      catch (_) { alert("Toma una captura de pantalla"); }
    }
  };

  if (view === "loading") return (
    <div style={st.page}><style>{css}</style>
      <div style={st.center}><div style={st.card}>
        <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
        <h2 style={st.cardTitle}>Enviando pedido...</h2>
        <p style={st.cardSub}>No cierres esta ventana</p>
      </div></div>
    </div>
  );

  if (view === "success" && orderResult) return (
    <div style={st.page}><style>{css}</style>
      <div style={st.center}>
        <div ref={receiptRef} style={{ ...st.card, maxWidth:420 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🍔</div>
          <h2 style={st.cardTitle}>¡Pedido recibido!</h2>
          <p style={st.codigo}>{orderResult.codigo}</p>
          <p style={st.cardSub}>{orderResult.pago === "Transferencia" ? "Tu pedido quedará confirmado cuando verifiquemos el comprobante." : "Te confirmaremos por WhatsApp antes del jueves."}</p>
          <div style={st.receipt}>
            <Row label="Cliente" value={orderResult.nombre} />
            <Row label="WhatsApp" value={orderResult.whatsapp} />
            <Row label="Pedido" value={orderResult.itemsTxt} />
            <Row label="Pago" value={orderResult.pago} />
            <Row label="Fecha" value={orderResult.fecha} />
            <div style={st.divider} />
            <Row label="TOTAL" value={"$" + orderResult.total.toFixed(2)} bold />
          </div>
          <p style={st.entrega}>📍 Lugar y hora de entrega por confirmar — te lo comunicaremos por WhatsApp</p>
        </div>
        <div style={st.actions}>
          <button style={st.shareBtn} onClick={compartir}>📤 Compartir / Copiar</button>
          <p style={st.tip}>O toma una captura de pantalla para guardar tu comprobante</p>
          <button style={st.ghostBtn} onClick={resetForm}>Hacer otro pedido</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={st.page}><style>{css}</style>
      <div style={st.hero}>
        <p style={st.eyebrow}>pedidos semanales</p>
        <h1 style={st.heroTitle}>🍔 Hamburguesería</h1>
        <p style={st.heroSub}>Pedidos para entrega los viernes</p>
      </div>
      <div style={st.infoBanner}>
        <span>📅 Entrega <strong>los viernes</strong></span>
        <span style={{ opacity:0.3 }}>|</span>
        <span>⏰ Cierre <strong>miércoles 11:59 pm</strong></span>
      </div>
      <div style={st.fw}>
        <div style={st.sec}>
          <h3 style={st.secTitle}>Tus datos</h3>
          <Fld label="Nombre y apellido" err={errores.nombre}>
            <input style={{ ...st.input, ...(errores.nombre?st.iErr:{}) }} placeholder="Ej: Juan Pérez" value={form.nombre} onChange={e=>sf("nombre",e.target.value)} />
          </Fld>
          <Fld label="WhatsApp" err={errores.whatsapp}>
            <input style={{ ...st.input, ...(errores.whatsapp?st.iErr:{}) }} placeholder="0991 234 567" value={form.whatsapp} onChange={e=>sf("whatsapp",e.target.value)} />
          </Fld>
        </div>
        <div style={st.sec}>
          <h3 style={st.secTitle}>Tu pedido</h3>
          <p style={st.secNote}>Elige la cantidad de cada producto</p>
          {form.items.map(item => (
            <div key={item.id} style={st.menuItem}>
              <div style={st.menuInfo}>
                <span style={st.menuName}>{item.nombre}</span>
                <span style={st.menuDesc}>{item.descripcion}</span>
                <span style={st.menuPrice}>${item.precio.toFixed(2)}</span>
              </div>
              <div style={st.qRow}>
                <button style={{ ...st.qBtn, opacity: item.cantidad===0?0.4:1 }} onClick={()=>changeQty(item.id,-1)} disabled={item.cantidad===0}>−</button>
                <span style={st.qNum}>{item.cantidad}</span>
                <button style={st.qBtn} onClick={()=>changeQty(item.id,1)}>+</button>
              </div>
            </div>
          ))}
          {errores.items && <span style={st.err}>{errores.items}</span>}
          <Fld label="Observaciones" opt>
            <textarea style={st.ta} placeholder="Sin cebolla, alergia, etc." value={form.observaciones} onChange={e=>sf("observaciones",e.target.value)} rows={3} />
          </Fld>
        </div>
        {totalItems > 0 && (
          <div style={st.totalBox}>
            <h4 style={st.totalTitle}>Resumen del pedido</h4>
            {form.items.filter(it=>it.cantidad>0).map(it=>(
              <div key={it.id} style={st.totalRow}>
                <span>{it.cantidad} × {it.nombre}</span>
                <span>${(it.cantidad*it.precio).toFixed(2)}</span>
              </div>
            ))}
            <div style={st.totalDivider} />
            <div style={{ ...st.totalRow, ...st.totalFinal }}>
              <span>TOTAL</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        )}
        <div style={st.sec}>
          <h3 style={st.secTitle}>Forma de pago</h3>
          <div style={st.radioRow}>
            {PAGOS.map(p => (
              <button key={p} className={`rb ${form.pago===p?"rb-on":""}`} style={{ ...st.rBtn, ...(form.pago===p?st.rBtnOn:{}) }} onClick={()=>sf("pago",p)}>
                {p==="Efectivo"?"💵":"📱"} {p}
              </button>
            ))}
          </div>
          {errores.pago && <span style={st.err}>{errores.pago}</span>}
          {form.pago === "Transferencia" && (
            <div style={st.bankBox}>
              <p style={st.bankTitle}>Datos para la transferencia</p>
              <div style={st.bankGrid}>
                <span style={st.bLbl}>Banco</span><span style={st.bVal}>{DATOS_BANCARIOS.banco}</span>
                <span style={st.bLbl}>Tipo</span><span style={st.bVal}>{DATOS_BANCARIOS.tipo}</span>
                <span style={st.bLbl}>Número</span><span style={st.bVal}>{DATOS_BANCARIOS.numero}</span>
                <span style={st.bLbl}>Titular</span><span style={st.bVal}>{DATOS_BANCARIOS.titular}</span>
                <span style={st.bLbl}>CI</span><span style={st.bVal}>{DATOS_BANCARIOS.cedula}</span>
                <span style={st.bLbl}>Correo</span><span style={st.bVal}>{DATOS_BANCARIOS.correo}</span>
              </div>
              <p style={st.bankMonto}>Monto a transferir: <strong>${total.toFixed(2)}</strong></p>
              <div style={st.uploadBox}>
                <p style={st.uploadLabel}>Sube tu comprobante (imagen o PDF, máx 5MB)</p>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile} style={{ display:"none" }} />
                <button style={st.uploadBtn} onClick={()=>fileRef.current?.click()}>
                  {form.comprobanteNombre ? "✓ Cambiar archivo" : "📎 Seleccionar archivo"}
                </button>
                {form.comprobanteNombre && <p style={st.fileName}>📄 {form.comprobanteNombre}</p>}
                {errores.comprobante && <span style={st.err}>{errores.comprobante}</span>}
              </div>
            </div>
          )}
        </div>
        <div style={{ ...st.sec, borderBottom:"none" }}>
          <div style={st.chkRow} onClick={()=>sf("acepta",!form.acepta)}>
            <div style={{ ...st.chk, ...(form.acepta?st.chkOn:{}) }}>{form.acepta && "✓"}</div>
            <span style={st.chkTxt}>Entiendo que los pedidos cierran el <strong>miércoles a las 11:59 pm</strong> y que la entrega es el <strong>viernes</strong>. El lugar y hora se confirmarán por WhatsApp. No hay devoluciones después del cierre.</span>
          </div>
          {errores.acepta && <span style={{ ...st.err, marginTop:6 }}>{errores.acepta}</span>}
        </div>
        <button className="sbtn" style={{ ...st.submitBtn, opacity: totalItems===0?0.5:1 }} onClick={handleSubmit} disabled={totalItems===0}>
          {totalItems === 0 ? "Elige al menos un producto" : `Enviar pedido — $${total.toFixed(2)} →`}
        </button>
        <p style={st.fNote}>📱 WhatsApp del negocio: {WHATSAPP_NEGOCIO}</p>
      </div>
    </div>
  );
}

function Fld({ label, opt, err, children }) {
  return (
    <div style={{ marginTop:18 }}>
      {label && <label style={st.fLabel}>{label}{opt && <span style={st.opt}> (opcional)</span>}</label>}
      {children}
      {err && <span style={st.err}>{err}</span>}
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <>
      <span style={st.rLabel}>{label}</span>
      <span style={{ ...st.rVal, ...(bold?{ fontSize:18, color:"#e8a020" }:{}) }}>{value}</span>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input, textarea, button { font-family: 'DM Sans', sans-serif; }
  ::placeholder { color: #a08060; }
  input:focus, textarea:focus { outline: none; border-color: #e8a020 !important; }
  .rb { cursor: pointer; transition: all .15s; }
  .rb:hover { background: #2a1a08 !important; }
  .rb-on { background: #e8a020 !important; color: #1a0a00 !important; border-color: #e8a020 !important; }
  .sbtn { transition: all .15s; }
  .sbtn:hover:not(:disabled) { background: #f0b030 !important; }
  .sbtn:active:not(:disabled) { transform: translateY(1px); }
  .sbtn:disabled { cursor: not-allowed; }
`;

const st = {
  page:{ minHeight:"100vh", background:"#120a00", fontFamily:"'DM Sans',sans-serif", color:"#f5e8d0", paddingBottom:60 },
  hero:{ background:"linear-gradient(160deg,#2a1500,#1a0a00)", borderBottom:"1px solid #1e1008", padding:"48px 24px 40px", textAlign:"center" },
  eyebrow:{ fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:"#e8a020", marginBottom:12 },
  heroTitle:{ fontFamily:"'Playfair Display',serif", fontSize:42, fontWeight:900, color:"#f5e8d0", lineHeight:1.1, marginBottom:8 },
  heroSub:{ fontSize:13, color:"#a08060", fontStyle:"italic" },
  infoBanner:{ background:"#e8a020", padding:"12px 24px", display:"flex", justifyContent:"center", alignItems:"center", gap:16, flexWrap:"wrap", fontSize:13, color:"#1a0a00" },
  fw:{ maxWidth:520, margin:"0 auto", padding:"0 20px" },
  sec:{ marginTop:32, paddingBottom:28, borderBottom:"1px solid #1e1008" },
  secTitle:{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"#f5e8d0", marginBottom:4 },
  secNote:{ fontSize:12, color:"#907050", fontStyle:"italic", marginBottom:12 },
  fLabel:{ display:"block", fontSize:12, fontWeight:600, color:"#c8a870", marginBottom:8, letterSpacing:"0.06em", textTransform:"uppercase" },
  opt:{ fontWeight:400, textTransform:"none", color:"#705040", fontSize:11 },
  input:{ width:"100%", background:"#1e1008", border:"1px solid #2a1a08", borderRadius:8, padding:"12px 14px", fontSize:15, color:"#f5e8d0" },
  iErr:{ borderColor:"#e05030" },
  ta:{ width:"100%", background:"#1e1008", border:"1px solid #2a1a08", borderRadius:8, padding:"12px 14px", fontSize:15, color:"#f5e8d0", resize:"vertical", outline:"none" },
  err:{ display:"block", fontSize:12, color:"#e06040", marginTop:5 },
  menuItem:{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px", background:"#1e1008", border:"1px solid #2a1a08", borderRadius:10, marginBottom:10, gap:12 },
  menuInfo:{ display:"flex", flexDirection:"column", flex:1 },
  menuName:{ fontSize:16, fontWeight:600, color:"#f5e8d0" },
  menuDesc:{ fontSize:12, color:"#907050", fontStyle:"italic", marginTop:2 },
  menuPrice:{ fontSize:14, color:"#e8a020", fontWeight:600, marginTop:6 },
  qRow:{ display:"flex", alignItems:"center", gap:10 },
  qBtn:{ width:34, height:34, borderRadius:8, border:"1px solid #2a1a08", background:"#120a00", color:"#e8a020", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 },
  qNum:{ fontSize:18, fontWeight:700, color:"#f5e8d0", minWidth:22, textAlign:"center" },
  totalBox:{ marginTop:24, background:"#1e1008", border:"2px solid #e8a020", borderRadius:12, padding:"18px 20px" },
  totalTitle:{ fontFamily:"'Playfair Display',serif", fontSize:16, color:"#e8a020", marginBottom:12, fontWeight:700 },
  totalRow:{ display:"flex", justifyContent:"space-between", fontSize:14, color:"#c8a870", padding:"4px 0" },
  totalDivider:{ height:1, background:"#3a2a10", margin:"10px 0" },
  totalFinal:{ fontSize:18, fontWeight:700, color:"#f5e8d0" },
  radioRow:{ display:"flex", gap:12, flexWrap:"wrap", marginTop:6 },
  rBtn:{ padding:"10px 20px", borderRadius:8, border:"1px solid #2a1a08", background:"#1e1008", color:"#c8a870", fontSize:14, fontWeight:500, cursor:"pointer" },
  rBtnOn:{ background:"#e8a020", color:"#1a0a00", borderColor:"#e8a020" },
  bankBox:{ marginTop:16, background:"#1e1008", border:"1px solid #3a2a10", borderRadius:10, padding:"16px" },
  bankTitle:{ fontSize:13, fontWeight:600, color:"#e8a020", marginBottom:12, letterSpacing:"0.05em", textTransform:"uppercase" },
  bankGrid:{ display:"grid", gridTemplateColumns:"auto 1fr", gap:"6px 14px", marginBottom:12 },
  bLbl:{ fontSize:12, color:"#705040" },
  bVal:{ fontSize:13, color:"#f5e8d0", fontWeight:500, wordBreak:"break-word" },
  bankMonto:{ fontSize:14, color:"#c8a870", padding:"10px 12px", background:"#120a00", borderRadius:6, textAlign:"center" },
  uploadBox:{ marginTop:14, paddingTop:14, borderTop:"1px solid #2a1a08" },
  uploadLabel:{ fontSize:12, color:"#c8a870", marginBottom:8, fontWeight:500 },
  uploadBtn:{ width:"100%", padding:"12px", background:"#2a1a08", color:"#e8a020", border:"1px dashed #3a2a10", borderRadius:8, fontSize:14, cursor:"pointer" },
  fileName:{ fontSize:12, color:"#40c060", marginTop:8, wordBreak:"break-word" },
  chkRow:{ display:"flex", gap:12, alignItems:"flex-start", cursor:"pointer" },
  chk:{ width:22, height:22, minWidth:22, borderRadius:5, border:"1px solid #3a2a10", background:"#1e1008", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#1a0a00", fontWeight:700, marginTop:2 },
  chkOn:{ background:"#e8a020", borderColor:"#e8a020" },
  chkTxt:{ fontSize:13, color:"#907050", lineHeight:1.6 },
  submitBtn:{ width:"100%", marginTop:28, padding:"16px", background:"#e8a020", color:"#1a0a00", border:"none", borderRadius:10, fontSize:16, fontWeight:700, cursor:"pointer", letterSpacing:"0.02em" },
  fNote:{ textAlign:"center", marginTop:14, fontSize:12, color:"#705040" },
  center:{ display:"flex", justifyContent:"center", padding:"50px 20px", flexDirection:"column", alignItems:"center" },
  card:{ width:"100%", maxWidth:400, background:"#1e1008", border:"1px solid #2a1a08", borderRadius:16, padding:"36px 24px", textAlign:"center" },
  cardTitle:{ fontFamily:"'Playfair Display',serif", fontSize:24, color:"#f5e8d0", marginBottom:6 },
  codigo:{ fontFamily:"'Playfair Display',serif", fontSize:22, color:"#e8a020", fontWeight:700, letterSpacing:"0.1em", marginBottom:12 },
  cardSub:{ fontSize:13, color:"#907050", lineHeight:1.5, marginBottom:20 },
  receipt:{ display:"grid", gridTemplateColumns:"auto 1fr", gap:"6px 14px", textAlign:"left", background:"#120a00", borderRadius:10, padding:"16px", marginBottom:16 },
  rLabel:{ fontSize:11, color:"#605040", textTransform:"uppercase", letterSpacing:"0.06em", alignSelf:"center" },
  rVal:{ fontSize:13, color:"#f5e8d0", fontWeight:600 },
  divider:{ gridColumn:"1/-1", height:1, background:"#2a1a08", margin:"6px 0" },
  entrega:{ fontSize:12, color:"#907050", padding:"10px", background:"#120a00", borderRadius:6, lineHeight:1.5 },
  actions:{ width:"100%", maxWidth:400, marginTop:16 },
  shareBtn:{ width:"100%", padding:"13px", background:"#e8a020", color:"#1a0a00", border:"none", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer" },
  tip:{ textAlign:"center", fontSize:11, color:"#605040", marginTop:8, marginBottom:14 },
  ghostBtn:{ width:"100%", padding:"11px", background:"transparent", border:"1px solid #2a1a08", borderRadius:8, color:"#c8a870", fontSize:13, cursor:"pointer" },
};
