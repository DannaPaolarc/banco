// ============================================
// db/connection.js — Conexión a MySQL
// ============================================
const mysql = require('mysql2/promise');
require('dotenv').config();
 
// Creamos un "pool" de conexiones
// Un pool es como tener varios cajeros disponibles al mismo tiempo
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,   // Máximo 10 conexiones simultáneas
  queueLimit: 0
});
 
// Función para verificar que la conexión funciona al inicio
async function verificarConexion() {
  try {
    const conn = await pool.getConnection();
    console.log('✓ Conexión a MySQL exitosa');
    conn.release();
  } catch (error) {
    console.error('✗ Error conectando a MySQL:', error.message);
    process.exit(1); // Detiene el servidor si no hay conexión
  }
}
 
verificarConexion();
 
module.exports = pool;
 