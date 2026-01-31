const express = require("express");
const router = express.Router();
const Log = require("../models/Log");
const jwt = require("jsonwebtoken");

// Middleware para verificar JWT
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

// Registrar evento de auditoría
router.post("/registrar", async (req, res) => {
  try {
    const { tipo, usuario, cuenta, servicio, idInvitado, detalles } = req.body;

    if (!tipo || !usuario || !cuenta) {
      return res.status(400).json({ msg: "Datos incompletos" });
    }

    const nuevoLog = new Log({
      tipo,
      usuario,
      cuenta,
      servicio: servicio || null,
      idInvitado: idInvitado || null,
      detalles: detalles || null
    });

    await nuevoLog.save();
    res.json({ msg: "Evento registrado" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al registrar evento" });
  }
});

// Obtener historial de auditoría (solo admin)
router.get("/historial", verificarToken, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ msg: "No tienes permiso para ver la auditoría" });
    }

    const logs = await Log.find().sort({ fecha: -1, _id: -1 }).limit(500);
    res.json(logs);

  } catch (error) {
    res.status(500).json({ msg: "Error al obtener historial" });
  }
});

// Obtener estadísticas de auditoría (solo admin)
router.get("/estadisticas", verificarToken, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ msg: "No tienes permiso para ver estadísticas" });
    }

    const totalLogs = await Log.countDocuments();
    const loginsHoy = await Log.countDocuments({
      tipo: "login",
      fecha: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    const citasPorServicio = await Log.aggregate([
      { $match: { tipo: "solicitud_cita" } },
      { $group: { _id: "$servicio", cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } }
    ]);

    const usuariosUnicos = await Log.distinct("usuario", { tipo: "login" });

    res.json({
      totalLogs,
      loginsHoy,
      citasPorServicio,
      usuariosUnicos: usuariosUnicos.length
    });

  } catch (error) {
    res.status(500).json({ msg: "Error al obtener estadísticas" });
  }
});

module.exports = router;
