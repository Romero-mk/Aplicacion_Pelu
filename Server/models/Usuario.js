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

// --- CORRECCIÓN AQUÍ ---
// Cambiamos a una función async sin 'next' para evitar el TypeError
UsuarioSchema.pre('save', async function() {
  if (!this.proveedor && this.password) {
    this.proveedor = 'local';
  }
  // En funciones async, Mongoose entiende que al terminar la ejecución, 
  // debe continuar con el guardado automáticamente.
});

// Crear índice único
UsuarioSchema.index({ usuario: 1 }, { 
  unique: true, 
  sparse: true,
  collation: { locale: 'en', strength: 2 }
});

UsuarioSchema.index({ proveedorId: 1 }, { sparse: true });

module.exports = mongoose.model("Usuario", UsuarioSchema);
