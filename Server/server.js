const express = require("express");
const conectarDB = require("./config/db");
const path = require("path"); 
require("dotenv").config();

const app = express();


conectarDB();


app.use(express.json());
app.use(express.static("public"));


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/../public/login.html");
});

app.use("/api/citas", require("./routes/citas"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/auditoria", require("./routes/auditoria"));





app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
  
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
});






