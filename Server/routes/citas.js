const express = require("express");
const router = express.Router();
const Cita = require("../models/Cita");
const jwt = require("jsonwebtoken");
const Auditoria = require("../models/Auditoria");



const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ msg: "Token no proporcionado" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token inválido" });
  }
};

router.post("/", async (req, res) => {
  try {
    const { cliente, telefono, servicio, fecha, hora, usuario, idInvitado } = req.body;
    
   
    const authHeader = req.headers.authorization;
    let usuarioFinal = usuario;
    let idInvitadoFinal = idInvitado;

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        usuarioFinal = decoded.usuario;
        idInvitadoFinal = null; 
      } catch (error) {
        
      }
    }


    if (!usuarioFinal && idInvitadoFinal) {
      usuarioFinal = `invitado_${idInvitadoFinal}`;
    }

    if (!cliente || !telefono || !servicio || !fecha || !hora || (!usuarioFinal && !idInvitadoFinal)) {
      return res.status(400).json({ msg: "Datos incompletos" });
    }

    
    const existe = await Cita.findOne({ fecha, hora });
    if (existe) {
      return res.status(400).json({ msg: "⚠️ Esa fecha y hora ya están reservadas" });
    }

    const nuevaCita = new Cita({
      usuario: usuarioFinal,
      idInvitado: idInvitadoFinal,
      cliente,
      telefono,
      servicio,
      fecha,
      hora
    });

    await nuevaCita.save();
    res.json({ msg: "✅ Cita reservada correctamente" });
await new Auditoria({
  usuario: cliente,
  rol: "usuario",
  accion: "reserva",
  servicio
}).save();

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al guardar la cita" });
  }
});


router.get("/publico", async (req, res) => {
  try {
    const idInvitado = req.query.idInvitado;
    
    let filtro = {};
    if (idInvitado) {
  
      filtro = { idInvitado: idInvitado };
    }
    
    const citas = await Cita.find(filtro).sort({ fecha: 1, hora: 1 });
    res.json(citas);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener citas" });
  }
});

router.get("/todas", verificarToken, async (req, res) => {
  try {
 
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ msg: "No tienes permiso para ver todas las citas" });
    }

    const citas = await Cita.find().sort({ fecha: 1, hora: 1 });
    res.json(citas);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener citas" });
  }
});


router.get("/mis-citas", verificarToken, async (req, res) => {
  try {
    const citas = await Cita.find({ usuario: req.usuario.usuario }).sort({ fecha: 1, hora: 1 });
    res.json(citas);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener citas" });
  }
});

module.exports = router;





