const express = require("express");
const passport = require('passport');
const conectarDB = require("./config/db");
const path = require("path"); 
require("dotenv").config();

const app = express();

// Conectar a la base de datos
conectarDB().catch(err => {
  console.error("Error fatal al conectar BD:", err);
  process.exit(1);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(express.static(path.join(__dirname, "..", "public")));

// Rutas
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

app.use("/api/citas", require("./routes/citas"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/auditoria", require("./routes/auditoria"));


app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  res.status(500).json({ msg: "Error interno del servidor" });
});


app.use((req, res) => {
  res.status(404).json({ msg: "Ruta no encontrada" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✓ Servidor corriendo en el puerto ${PORT}`);
});






