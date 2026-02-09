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


usuarioSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

UsuarioSchema.index({ usuario: 1 }, { 
  unique: true, 
  sparse: true,
  collation: { locale: 'en', strength: 2 }
});

UsuarioSchema.index({ proveedorId: 1 }, { sparse: true });

module.exports = mongoose.model("Usuario", UsuarioSchema);
