const jwt = require("jsonwebtoken");

/**
 * Genera un token JWT para un usuario
 * @param {string} userId - ID del usuario
 * @param {string} rol - Rol del usuario (opcional)
 * @returns {string} Token JWT
 */
const generarJWT = (userId, rol = "usuario") => {
  try {
    const payload = {
      id: userId,
      rol: rol,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d", // Token válido por 7 días
    });

    return token;
  } catch (error) {
    console.error("Error al generar JWT:", error);
    throw new Error("Error al generar token");
  }
};

/**
 * Verifica un token JWT
 * @param {string} token - Token a verificar
 * @returns {object} Payload decodificado
 */
const verificarJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Token inválido o expirado");
  }
};

module.exports = {
  generarJWT,
  verificarJWT,
};
