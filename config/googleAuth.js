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
                let usuario = await Usuario.findOne({ email: profile.emails[0].value });

                if (!usuario) {
                    usuario = await Usuario.create({
                        nombre: profile.displayName,
                        email: profile.emails[0].value,
                        password: '@' + profile.id, // Contraseña temporal
                        confirmado: true
                    });
                }

                return done(null, usuario);
            } catch (error) {
                return done(error);
            }
        }
    )
);

module.exports = passport;
