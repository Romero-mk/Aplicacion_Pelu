const { Router } = require('express');
const router = Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

router.post('/register', async (req, res) => {
  // require perezoso: asegurar que Auditoria se cargue sólo cuando se use
  const Auditoria = require('../models/Auditoria'); // ajustar ruta si es necesario

  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ msg: "Datos incompletos" });
    }

    const existe = await Usuario.findOne({ usuario });
    if (existe) {
      return res.status(400).json({ msg: "Usuario ya existe" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const nuevoUsuario = new Usuario({
      usuario,
      password: hash,
      rol: "usuario" 
    });

    await nuevoUsuario.save();

    // registrar auditoría sin bloquear
    try {
      await Auditoria.registrar({
        tipo: 'registro_usuario',
        usuario: req.body.usuario || req.body.email || 'desconocido',
        detalle: 'Registro exitoso'
      });
    } catch (auditErr) {
      console.warn('Error al registrar auditoria:', auditErr);
    }

    res.status(201).json({ msg: 'Usuario registrado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error interno' });
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
