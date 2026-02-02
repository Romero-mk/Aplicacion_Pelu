const { Router } = require('express');
const router = Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Passport Google strategy (no sessions)
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] && profile.emails[0].value;
    let user = await Usuario.findOne({ proveedorId: profile.id, proveedor: 'google' });
    if (!user && email) {
      user = await Usuario.findOne({ usuario: email });
    }

    if (user) {
      user.proveedor = 'google';
      user.proveedorId = profile.id;
      await user.save();
      return done(null, user);
    }

    const nuevo = new Usuario({
      usuario: email || `google_${profile.id}`,
      password: '',
      rol: 'usuario',
      proveedor: 'google',
      proveedorId: profile.id
    });
    await nuevo.save();
    return done(null, nuevo);
  } catch (err) {
    return done(err);
  }
}));

router.post('/register', async (req, res) => {

  const Auditoria = require('../models/Auditoria');

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

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login.html' }), async (req, res) => {
  try {
    const user = req.user;
    const token = jwt.sign(
      { id: user._id, usuario: user.usuario, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Redirect to a small page that saves token into localStorage
    const redirectUrl = `/oauth-success.html?token=${token}&usuario=${encodeURIComponent(user.usuario)}&rol=${user.rol}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error(error);
    return res.redirect('/login.html');
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
