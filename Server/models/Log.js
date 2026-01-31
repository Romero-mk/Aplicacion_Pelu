const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  tipo: { type: String, required: true }, // 'login', 'solicitud_cita', etc
  usuario: { type: String, required: true }, // nombre del usuario o "Invitado"
  cuenta: { type: String, required: true }, // "usuario" o "invitado"
  servicio: { type: String, default: null }, // servicio solicitado (si aplica)
  idInvitado: { type: String, default: null }, // ID del invitado
  detalles: { type: String, default: null }, // detalles adicionales
  fecha: {
    type: Date,
    default: Date.now
  },
  hora: {
    type: String,
    default: () => new Date().toLocaleTimeString('es-ES')
  }
});

module.exports = mongoose.model("Log", LogSchema);
