const express = require('express');
const router = express.Router();
const passport = require('../config/googleAuth');
const { generarJWT } = require('../helpers/jwt');

// Rutas existentes...

// Añadir estas rutas para autenticación de Google
router.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        const token = generarJWT(req.user.id);
        res.redirect(`${process.env.FRONTEND_URL}/confirmar?token=${token}`);
    }
);

// Otras rutas existentes...

module.exports = router;