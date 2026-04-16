// ============================================
// routes/cuentas.js — Gestión de cuentas
// ============================================
const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const verificarToken = require('../middleware/auth');
 
// TODAS las rutas aquí requieren token (el usuario debe estar logueado)
 
// GET /api/cuentas — Lista las cuentas del usuario autenticado (o todas si es admin)
router.get('/', verificarToken, async (req, res) => {
  try {
    let query;
    let params;
 
    if (req.usuario.rol === 'admin') {
      // El admin ve TODAS las cuentas con datos del cliente
      query = `
        SELECT cu.id, cu.numero_cuenta, cu.tipo_cuenta, cu.saldo, cu.estado,
               cl.nombre AS cliente_nombre, cl.email AS cliente_email
        FROM cuentas cu
        JOIN clientes cl ON cu.cliente_id = cl.id
        ORDER BY cl.nombre, cu.numero_cuenta
      `;
      params = [];
    } else {
      // El cliente solo ve SUS propias cuentas
      query = `
        SELECT cu.id, cu.numero_cuenta, cu.tipo_cuenta, cu.saldo, cu.estado
        FROM cuentas cu
        WHERE cu.cliente_id = ?
        ORDER BY cu.numero_cuenta
      `;
      params = [req.usuario.cliente_id];
    }
 
    const [cuentas] = await pool.query(query, params);
    res.json({ cuentas });
 
  } catch (error) {
    console.error('Error obteniendo cuentas:', error);
    res.status(500).json({ error: 'Error al obtener las cuentas.' });
  }
});
 
// GET /api/cuentas/:id — Detalle de una cuenta específica
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
 
    const [rows] = await pool.query(
      `SELECT cu.id, cu.numero_cuenta, cu.tipo_cuenta, cu.saldo, cu.estado,
              cl.nombre AS cliente_nombre, cl.email AS cliente_email
       FROM cuentas cu
       JOIN clientes cl ON cu.cliente_id = cl.id
       WHERE cu.id = ?`,
      [id]
    );
 
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada.' });
    }
 
    const cuenta = rows[0];
 
    // Verificar que el cliente solo vea SUS cuentas
    if (req.usuario.rol !== 'admin' && 
        cuenta.cliente_id !== req.usuario.cliente_id) {
      return res.status(403).json({ error: 'No tienes acceso a esta cuenta.' });
    }
 
    res.json({ cuenta });
 
  } catch (error) {
    console.error('Error obteniendo cuenta:', error);
    res.status(500).json({ error: 'Error al obtener la cuenta.' });
  }
});
 
module.exports = router;