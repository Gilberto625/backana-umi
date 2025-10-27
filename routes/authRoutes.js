const express = require('express');
const router = express.Router();
const passport = require('../config/googleAuth');
const { generarJWT } = require('../helpers/jwt');

// ======== AUTENTICACIÓN CON GOOGLE ========

// Ruta para iniciar el flujo de autenticación con Google
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback de Google después de la autenticación
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        try {
            // Generar token JWT para el usuario autenticado
            const token = generarJWT(req.user.id, req.user.rol);

            // Redirigir al frontend con el token
            res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}`);
        } catch (error) {
            console.error('Error en callback de Google:', error);
            res.redirect(`${process.env.FRONTEND_URL}/auth/google/error`);
        }
    }
);

module.exports = router;