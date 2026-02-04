const mongoose = require("mongoose");

const conectarDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error("MONGO_URI no está configurada en las variables de entorno");
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: "majority"
    });
    
    console.log("✓ MongoDB conectado correctamente");
    
    // Limpiar índices corruptos en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      // mongoose.connection.collection("usuarios").collection.dropIndex("usuario_1").catch(() => {});
    }
    
    return mongoose.connection;
  } catch (error) {
    console.error("✗ Error MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = conectarDB;
