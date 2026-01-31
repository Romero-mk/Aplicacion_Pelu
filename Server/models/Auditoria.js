const mongoose = require("mongoose");

const AuditoriaSchema = new mongoose.Schema({
  usuario: { type: String, required: true },
  rol: { type: String, required: true }, 
  accion: { type: String, required: true },
  servicio: { type: String, default: "N/A" },
  fecha: { type: Date, default: Date.now }
});
const express = require("express");
const Auditoria = require("../models/Auditoria");
const jwt = require("jsonwebtoken");

const router = express.Router();

const verificarAdmin = (req, res, next) => {
  try {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ msg: "Sin token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.rol !== "admin") {
      return res.status(403).json({ msg: "Acceso denegado" });
    }

    next();
  } catch (error) {
    res.status(401).json({ msg: "Token inválido" });
  }
};

router.get("/", verificarAdmin, async (req, res) => {
  try {
    const logs = await Auditoria.find().sort({ fecha: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener auditoría" });
  }
});

module.exports = router;

module.exports = mongoose.model("Auditoria", AuditoriaSchema);
