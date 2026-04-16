// ============================================
// routes/clientes.js — Vista de clientes (solo admin)
// ============================================
const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const verificarToken = require('../middleware/auth');
 
// Middleware para verificar que es admin
function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ 
      error: 'Solo los administradores pueden acceder a esta sección.' 
    });
  }
  next();
}
 
// GET /api/clientes — Reporte completo de clientes (usa la vista de MySQL)
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const [clientes] = await pool.query(
      'SELECT * FROM vistas_reporte_clientes ORDER BY nombre'
    );
    res.json({ clientes });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes.' });
  }
});
 
// GET /api/clientes/:id/resumen — Resumen de un cliente (usa stored procedure)
router.get('/:id/resumen', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { id } = req.params;
 
    // Llamamos al stored procedure sp_obtener_resumen_cliente
    await pool.query('CALL sp_obtener_resumen_cliente(?, @num_cuentas, @balance)');
    const [[resultado]] = await pool.query(
      'CALL sp_obtener_resumen_cliente(?, @n, @b); SELECT @n AS num_cuentas, @b AS balance_total',
      [id]
    );
 
    // Manera alternativa más directa
    const [cuentas] = await pool.query(
      `SELECT COUNT(*) AS num_cuentas, COALESCE(SUM(saldo), 0) AS balance_total
       FROM cuentas WHERE cliente_id = ?`,
      [id]
    );
 
    res.json({ resumen: cuentas[0] });
  } catch (error) {
    console.error('Error en resumen:', error);
    res.status(500).json({ error: 'Error al obtener resumen.' });
  }
});
 
module.exports = router;