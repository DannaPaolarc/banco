// ============================================
// middleware/auth.js — Verificar token JWT
// ============================================
// El JWT (JSON Web Token) es como una pulsera de entrada a un evento.
// Al hacer login, el servidor te da la pulsera.
// En cada petición siguiente, presentas la pulsera para demostrar quién eres.
 
const jwt = require('jsonwebtoken');
require('dotenv').config();
 
function verificarToken(req, res, next) {
  // El token viene en el header "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extraemos solo el token
 
  if (!token) {
    return res.status(401).json({ 
      error: 'Acceso denegado. No se proporcionó token.' 
    });
  }
 
  try {
    // Verificamos que el token sea válido y no haya expirado
    const usuario = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = usuario; // Guardamos los datos del usuario para usarlos en la ruta
    next(); // Continúa al siguiente paso
  } catch (error) {
    return res.status(403).json({ 
      error: 'Token inválido o expirado. Inicia sesión nuevamente.' 
    });
  }
}
 
module.exports = verificarToken;
 