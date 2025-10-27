require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('./config/googleAuth');
const session = require('express-session');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Configuración de sesión para Passport
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'session_secret_cambiar',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // En producción cambiar a true con HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

// Rutas
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend funcionando correctamente' });
});

// Conexión a la base de datos
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => {
    console.error('❌ Error al conectar a MongoDB:', err);
    process.exit(1);
  });

// Puerto de la aplicación
const PORT = process.env.PORT || 5000;

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor en funcionamiento en el puerto ${PORT}`);
});