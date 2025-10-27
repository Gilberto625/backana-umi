const express = require("express");
const {
  registerUser,
  verificarRegistro2FA,
  reenviarRegistro2FA,
  loginUser,
  verificarLogin2FA,
  reenviarLogin2FA,
} = require("../controllers/userController");

const router = express.Router();

// ======== REGISTRO ========
router.post("/register", registerUser);
router.post("/register/2fa/verificar", verificarRegistro2FA);
router.post("/register/2fa/reenviar", reenviarRegistro2FA);

// ======== LOGIN ========
router.post("/login", loginUser);
router.post("/login/2fa/verificar", verificarLogin2FA);
router.post("/login/2fa/reenviar", reenviarLogin2FA);

module.exports = router;
