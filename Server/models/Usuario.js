const mongoose = require("mongoose");

const UsuarioSchema = new mongoose.Schema({
  usuario: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: false,
    minlength: 6
  },
  rol: {
    type: String,
    enum: ["admin", "usuario"],
    default: "usuario"
  },
  proveedor: { 
    type: String, 
    default: null 
  },
  proveedorId: { 
    type: String, 
    default: null 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índice único para evitar duplicados
UsuarioSchema.index({ usuario: 1 }, { unique: true });

module.exports = mongoose.model("Usuario", UsuarioSchema);
