const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const cuentasRoutes = require('./routes/cuentas');
const transaccionesRoutes = require('./routes/transacciones');
const clientesRoutes = require('./routes/clientes');

const app = express();

// 1. PRIMERO: Configurar CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. SEGUNDO: ¡ESTA ES LA LÍNEA QUE FALTABA! (Lectura de JSON)
app.use(express.json()); 

// 3. TERCERO: Headers manuales (Opcional pero ayuda a Android)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/cuentas', cuentasRoutes);
app.use('/api/transacciones', transaccionesRoutes);
app.use('/api/clientes', clientesRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: 'API Banco Avanzado funcionando correctamente ✓' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});