// ============================================
// routes/auth.js — Login y autenticación
// ============================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
require('dotenv').config();
 
// POST /api/auth/login
// Recibe: { email, password }
// Devuelve: { token, usuario }
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
 
  // Validación básica
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email y contraseña son requeridos.' 
    });
  }
 
  try {
    // Buscar el usuario en la base de datos junto con su rol y datos de cliente
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.password, u.activo, u.rol_id,
              r.nombre AS rol_nombre,
              c.nombre AS cliente_nombre, c.id AS cliente_id
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       LEFT JOIN clientes c ON u.cliente_id = c.id
       WHERE u.email = ?`,
      [email]
    );
 
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }
 
    const usuario = rows[0];
 
    // Verificar si la cuenta está activa
    if (!usuario.activo) {
      return res.status(403).json({ error: 'Cuenta desactivada.' });
    }
 
    // Comparar contraseña con el hash guardado en la base de datos
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }
 
    // Actualizar fecha de último login
    await pool.query(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?',
      [usuario.id]
    );
 
    // Crear el token JWT — expira en 8 horas
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        rol: usuario.rol_nombre,
        cliente_id: usuario.cliente_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
 
    // Respuesta exitosa
    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.cliente_nombre || 'Administrador',
        rol: usuario.rol_nombre
      }
    });
 
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});
 
// GET /api/auth/verificar — Verifica si el token sigue válido
const verificarToken = require('../middleware/auth');
router.get('/verificar', verificarToken, (req, res) => {
  res.json({ 
    valido: true, 
    usuario: req.usuario 
  });
});
 
module.exports = router;