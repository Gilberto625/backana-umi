const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Usuario = require('../models/Usuario');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                let usuario = await Usuario.findOne({ email });

                if (!usuario) {
                    // Dividir el nombre completo en partes
                    const nombreCompleto = profile.displayName || profile.name?.givenName || 'Usuario';
                    const partes = nombreCompleto.split(' ');

                    const nombre = partes[0] || 'Usuario';
                    const ap = partes[1] || 'Google';
                    const am = partes[2] || 'User';

                    // Generar username único basado en email
                    const baseUsername = email.split('@')[0];
                    let username = baseUsername;
                    let contador = 1;

                    // Verificar si el username ya existe
                    while (await Usuario.findOne({ username })) {
                        username = `${baseUsername}${contador}`;
                        contador++;
                    }

                    usuario = await Usuario.create({
                        nombre,
                        ap,
                        am,
                        username,
                        email,
                        password: '@Google_' + profile.id, // Contraseña temporal para autenticación Google
                        telefono: '0000000000', // Telefono temporal (Google no lo proporciona)
                        preguntaSecreta: 'Autenticación con Google',
                        respuestaSecreta: '@Google_Auth_' + profile.id,
                        verificado: true, // Ya verificado por Google
                        rol: 'usuario'
                    });
                }

                return done(null, usuario);
            } catch (error) {
                console.error('Error en autenticación Google:', error);
                return done(error);
            }
        }
    )
);

// Serializar usuario para la sesión
passport.serializeUser((usuario, done) => {
    done(null, usuario.id);
});

// Deserializar usuario desde la sesión
passport.deserializeUser(async (id, done) => {
    try {
        const usuario = await Usuario.findById(id);
        done(null, usuario);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
