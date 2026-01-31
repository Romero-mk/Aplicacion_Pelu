const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    if (!usuario || !password) {
      return res.status(400).json({ msg: "Datos incompletos" });
    }

    const existe = await Usuario.findOne({ usuario });
    if (existe) {
      return res.status(400).json({ msg: "Usuario ya existe" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    await new Auditoria({
  usuario: user.usuario,
  rol: user.rol,
  accion: "login",
  servicio: "N/A"
}).save();

    const nuevoUsuario = new Usuario({
      usuario,
      password: hash,
      rol: "usuario" 
    });

    await nuevoUsuario.save();

    res.json({ msg: "Usuario creado correctamente" });
    const Auditoria = require("../models/Auditoria");


  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    if (!usuario || !password) {
      return res.status(400).json({ msg: "Datos incompletos" });
    }

    const user = await Usuario.findOne({ usuario });
    if (!user) {
      return res.status(400).json({ msg: "Usuario no existe" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ msg: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user._id, usuario: user.usuario, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      msg: "Login exitoso",
      token,
      usuario: user.usuario,
      rol: user.rol
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});


router.post("/actualizarAdmin", async (req, res) => {
  try {
    const resultado = await Usuario.findOneAndUpdate(
      { usuario: "admin" },
      { rol: "admin" },
      { new: true }
    );

    if (!resultado) {
      return res.status(400).json({ msg: "Usuario admin no existe" });
    }

    res.json({ msg: "Rol de admin actualizado", usuario: resultado });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

module.exports = router;
