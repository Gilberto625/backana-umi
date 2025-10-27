const express = require('express');
const mongoose = require('mongoose');
const passport = require('./config/googleAuth');

const app = express();

// Middleware
app.use(express.json());
app.use(passport.initialize());

// Rutas
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profesionales', require('./routes/profesionales'));
app.use('/api/turnos', require('./routes/turnos'));

// Conexión a la base de datos
mongoose
  .connect('mongodb://localhost:27017/tu_basededatos', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.log(err));

// Puerto de la aplicación
const PORT = process.env.PORT || 5000;

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor en funcionamiento en el puerto ${PORT}`);
});