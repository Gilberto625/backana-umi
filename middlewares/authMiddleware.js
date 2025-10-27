const jwt = require("jsonwebtoken");

/**
 * Middleware de autenticación con JWT
 * @param {Array} roles - Array de roles permitidos (opcional)
 * @returns {Function} Middleware function
 */
const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    try {
      // Obtener el token del header Authorization
      let token = req.header("Authorization");

      if (!token) {
        return res.status(401).json({ error: "Acceso denegado. No hay token proporcionado." });
      }

      // Si el token viene con el formato "Bearer <token>", extraer solo el token
      if (token.startsWith("Bearer ")) {
        token = token.slice(7, token.length).trim();
      }

      // Verificar el token con la clave secreta del .env
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // Verificar roles si se especificaron
      if (roles.length > 0 && !roles.includes(decoded.rol)) {
        return res.status(403).json({
          error: "Acceso denegado. No tienes permisos suficientes.",
          rolRequerido: roles,
          tuRol: decoded.rol
        });
      }

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expirado. Por favor inicia sesión nuevamente." });
      }
      res.status(400).json({ error: "Token inválido." });
    }
  };
};

module.exports = authMiddleware;