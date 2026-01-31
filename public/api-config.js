window.API_BASE_URL = window.API_BASE_URL || "https://aplicacion-pelu-7.onrender.com";
console.log('API Base URL:', window.API_BASE_URL);

// helper de depuración para ver request/response
async function debugFetch(url, opts = {}) {
  console.log('DEBUG REQUEST', url, opts.method || 'GET', opts.headers || {}, opts.body || null);
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch(e) { parsed = text; }
    console.log('DEBUG RESPONSE', res.status, parsed);
    return { res, parsed };
  } catch (err) {
    console.error('DEBUG FETCH ERROR', err);
    throw err;
  }
}

// Ejecutar en la consola del navegador
(async () => {
  const token = localStorage.getItem("token");
  const payload = {
    tipo: "solicitud_cita",
    usuario: localStorage.getItem("usuario") || "test",
    cuenta: localStorage.getItem("rol") || "invitado",
    servicio: "Corte", // ajustar según el servicio real
    idInvitado: null
  };
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  await debugFetch(`${window.API_BASE_URL}/api/auditoria/registrar`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
})();
