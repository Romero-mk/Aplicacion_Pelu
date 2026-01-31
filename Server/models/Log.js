const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  tipo: { type: String, required: true }, 
  usuario: { type: String, required: true },
  cuenta: { type: String, required: true }, 
  servicio: { type: String, default: null },
  idInvitado: { type: String, default: null }, 
  detalles: { type: String, default: null }, 
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
