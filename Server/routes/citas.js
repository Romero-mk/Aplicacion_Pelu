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


router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const cita = await Cita.findById(id);
    if (!cita) return res.status(404).json({ msg: 'Cita no encontrada' });

  
    if (req.usuario.rol !== 'admin' && req.usuario.usuario !== cita.usuario) {
      return res.status(403).json({ msg: 'No tienes permiso para modificar esta cita' });
    }


    const MINUTES_BEFORE = parseInt(process.env.EDIT_WINDOW_MINUTES || '120', 10); 

    const fechaParts = cita.fecha.split('-');
    const horaParts = cita.hora.split(':');
    const citaDate = new Date(
      parseInt(fechaParts[0], 10),
      parseInt(fechaParts[1], 10) - 1,
      parseInt(fechaParts[2], 10),
      parseInt(horaParts[0], 10),
      parseInt(horaParts[1], 10)
    );

    const ahora = new Date();
    const diffMinutes = (citaDate - ahora) / (1000 * 60);
    if (diffMinutes < MINUTES_BEFORE) {
      return res.status(400).json({ msg: `No se puede modificar la cita dentro de ${MINUTES_BEFORE} minutos antes` });
    }

    const { cliente, telefono, servicio, fecha, hora } = req.body;
    if (fecha && hora) {
     
      const existe = await Cita.findOne({ fecha, hora, _id: { $ne: id } });
      if (existe) return res.status(400).json({ msg: 'Esa fecha y hora ya están reservadas' });
    }

    if (cliente) cita.cliente = cliente;
    if (telefono) cita.telefono = telefono;
    if (servicio) cita.servicio = servicio;
    if (fecha) cita.fecha = fecha;
    if (hora) cita.hora = hora;

    await cita.save();

    try {
      const Auditoria = require('../models/Auditoria');
      await new Auditoria({ usuario: req.usuario.usuario, rol: req.usuario.rol, accion: 'modificacion_cita', servicio: cita.servicio }).save();
    } catch (e) {
      console.warn('No se pudo registrar auditoria de modificación:', e.message);
    }

    res.json({ msg: 'Cita modificada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al modificar cita' });
  }
});

module.exports = router;





