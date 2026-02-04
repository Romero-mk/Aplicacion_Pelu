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
      return res.status(400).json({ msg: "Usuario y contraseña son requeridos" });
    }

 
    if (usuario.length < 3) {
      return res.status(400).json({ msg: "El usuario debe tener al menos 3 caracteres" });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(usuario)) {
      return res.status(400).json({ msg: "Usuario solo puede contener letras, números y guiones bajos" });
    }


    if (password.length < 6) {
      return res.status(400).json({ msg: "La contraseña debe tener al menos 6 caracteres" });
    }

    const usuarioLower = usuario.toLowerCase();
    const existe = await Usuario.findOne({ usuario: usuarioLower });
    
    if (existe) {
      return res.status(400).json({ msg: "El usuario ya está registrado" });
    }

    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);


    const nuevoUsuario = new Usuario({
      usuario: usuarioLower,
      password: passwordHash,
      rol: "usuario" 
    });

   
    await nuevoUsuario.save();

   
    try {
      await Auditoria.registrar({
        tipo: 'registro_usuario',
        usuario: usuarioLower,
        detalle: 'Registro exitoso'
      });
    } catch (auditErr) {
      console.warn('Error al registrar auditoria:', auditErr);
    }

    console.log(`✓ Usuario registrado: ${usuarioLower}`);
    res.status(201).json({ 
      msg: 'Usuario registrado correctamente',
      usuario: nuevoUsuario.usuario
    });
    
  } catch (err) {
    console.error('Error en registro:', err);
    
   
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: messages.join(', ') });
    }
    
  
    if (err.code === 11000) {
      return res.status(400).json({ msg: "El usuario ya está registrado" });
    }
    
    res.status(500).json({ msg: 'Error al registrar usuario' });
  }
});

router.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    if (!usuario || !password) {
      return res.status(400).json({ msg: "Usuario y contraseña son requeridos" });
    }

    const user = await Usuario.findOne({ usuario: usuario.toLowerCase() });
    
    if (!user) {
      return res.status(400).json({ msg: "Usuario o contraseña incorrectos" });
    }

    if (!user.password) {
      return res.status(400).json({ msg: "Este usuario no tiene contraseña configurada" });
    }

    const passwordValida = await bcrypt.compare(password, user.password);
    
    if (!passwordValida) {
      return res.status(400).json({ msg: "Usuario o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: user._id, usuario: user.usuario, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log(`✓ Login exitoso: ${user.usuario}`);
    res.json({
      msg: "Login exitoso",
      token,
      usuario: user.usuario,
      rol: user.rol
    });

  } catch (error) {
    console.error('Error en login:', error);
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
