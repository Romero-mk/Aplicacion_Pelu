const mongoose = require("mongoose");

const UsuarioSchema = new mongoose.Schema({
  usuario: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: false
  },
  rol: {
    type: String,
    enum: ["admin", "usuario"],
    default: "usuario"
  },
  proveedor: { 
    type: String, 
    enum: ["local", "google", null],
    default: null 
  },
  proveedorId: { 
    type: String, 
    default: null,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collation: { locale: 'en', strength: 2 } 
});

// Pre-save hook para marcar proveedor local si tiene password
UsuarioSchema.pre('save', function() {
  if (!this.proveedor && this.password) {
    this.proveedor = 'local';
  }
  next();
});

// Crear índice único con opciones correctas
UsuarioSchema.index({ usuario: 1 }, { 
  unique: true, 
  sparse: true,
  collation: { locale: 'en', strength: 2 }
});

// Índice para proveedorId
UsuarioSchema.index({ proveedorId: 1 }, { sparse: true });

module.exports = mongoose.model("Usuario", UsuarioSchema);
