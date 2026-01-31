const mongoose = require("mongoose");

const CitaSchema = new mongoose.Schema({
  usuario: { type: String, required: true },
  idInvitado: { type: String, default: null },
  cliente: { type: String, required: true },
  telefono: { type: String, required: true },
  servicio: { type: String, required: true },
  fecha: { type: String, required: true },
  hora: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Cita", CitaSchema);




