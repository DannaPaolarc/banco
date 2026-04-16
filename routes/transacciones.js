// ============================================
// routes/transacciones.js — Historial y transferencias
// ============================================
const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const verificarToken = require('../middleware/auth');
 
// GET /api/transacciones — Historial de transacciones
router.get('/', verificarToken, async (req, res) => {
  try {
    let query;
    let params;
 
    if (req.usuario.rol === 'admin') {
      query = `
        SELECT t.id, t.monto, t.tipo_movimiento, t.fecha_hora,
               co.numero_cuenta AS cuenta_origen,
               cd.numero_cuenta AS cuenta_destino
        FROM transacciones t
        LEFT JOIN cuentas co ON t.cuenta_origen_id = co.id
        LEFT JOIN cuentas cd ON t.cuenta_destino_id = cd.id
        ORDER BY t.fecha_hora DESC
        LIMIT 50
      `;
      params = [];
    } else {
      // Cliente solo ve transacciones de sus cuentas
      query = `
        SELECT t.id, t.monto, t.tipo_movimiento, t.fecha_hora,
               co.numero_cuenta AS cuenta_origen,
               cd.numero_cuenta AS cuenta_destino
        FROM transacciones t
        LEFT JOIN cuentas co ON t.cuenta_origen_id = co.id
        LEFT JOIN cuentas cd ON t.cuenta_destino_id = cd.id
        WHERE co.cliente_id = ? OR cd.cliente_id = ?
        ORDER BY t.fecha_hora DESC
        LIMIT 30
      `;
      params = [req.usuario.cliente_id, req.usuario.cliente_id];
    }
 
    const [transacciones] = await pool.query(query, params);
    res.json({ transacciones });
 
  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    res.status(500).json({ error: 'Error al obtener transacciones.' });
  }
});
 
// POST /api/transacciones/transferir — Realizar una transferencia
// Llama al stored procedure sp_transferencia_bancaria
router.post('/transferir', verificarToken, async (req, res) => {
  const { cuenta_origen_id, cuenta_destino_id, monto } = req.body;
 
  if (!cuenta_origen_id || !cuenta_destino_id || !monto) {
    return res.status(400).json({ 
      error: 'Se requieren cuenta origen, destino y monto.' 
    });
  }
 
  if (monto <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0.' });
  }
 
  try {
    // Llamamos al stored procedure de la base de datos
    const [result] = await pool.query(
      'CALL sp_transferencia_bancaria(?, ?, ?)',
      [cuenta_origen_id, cuenta_destino_id, parseFloat(monto)]
    );
 
    const mensaje = result[0][0]?.mensaje || 'Operación completada';
    
    if (mensaje.toLowerCase().includes('error') || 
        mensaje.toLowerCase().includes('insuficiente')) {
      return res.status(400).json({ error: mensaje });
    }
 
    res.json({ mensaje });
 
  } catch (error) {
    console.error('Error en transferencia:', error);
    res.status(500).json({ 
      error: 'Error al procesar la transferencia.' 
    });
  }
});
 
module.exports = router;