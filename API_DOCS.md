# Documentación del API - Backend con 2FA

## Configuración Inicial

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno (.env)

Debes completar el archivo `.env` con tus credenciales:

```env
# MongoDB
MONGO_URI=mongodb+srv://tu_usuario:tu_password@cluster.mongodb.net/?appName=tuapp

# Puerto del servidor
PORT=4000

# Frontend URL
FRONTEND_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# JWT Secret (genera uno aleatorio y seguro)
JWT_SECRET=tu_secreto_jwt_super_seguro_cambiar_esto

# SMTP para envío de correos (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password_de_gmail

# Google OAuth 2.0 (obtén en Google Cloud Console)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

### 3. Iniciar el servidor
```bash
npm start
# o con nodemon
npx nodemon index.js
```

---

## Endpoints del API

### Base URL
```
http://localhost:4000
```

---

## 1. REGISTRO CON 2FA

### 1.1 Registrar Usuario (Paso 1)
Crea un nuevo usuario y envía código 2FA por correo.

**Endpoint:** `POST /api/users/register`

**Body:**
```json
{
  "nombre": "Juan",
  "apellidopaterno": "Pérez",
  "apellidomaterno": "García",
  "username": "juanperez",
  "correo": "juan@example.com",
  "contrasena": "password123",
  "telefono": "5551234567",
  "preguntasecreta": "¿Nombre de tu primera mascota?",
  "respuestasecreta": "Firulais"
}
```

**Respuesta exitosa (201):**
```json
{
  "mensaje": "Usuario registrado con éxito",
  "usuario": {
    "_id": "507f1f77bcf86cd799439011",
    "nombre": "Juan",
    "ap": "Pérez",
    "am": "García",
    "username": "juanperez",
    "email": "juan@example.com",
    "verificado": false,
    "rol": "usuario"
  },
  "requires2fa": true,
  "canal": "email",
  "destino": "ju***@example.com",
  "tempToken": "uuid-token-aqui"
}
```

### 1.2 Verificar Código 2FA de Registro (Paso 2)
Valida el código de 6 dígitos enviado por correo.

**Endpoint:** `POST /api/users/register/2fa/verificar`

**Body:**
```json
{
  "tempToken": "uuid-token-del-paso-anterior",
  "codigo": "123456"
}
```

**Respuesta exitosa (200):**
```json
{
  "ok": true
}
```

### 1.3 Reenviar Código 2FA de Registro
Reenvía un nuevo código si expiró el anterior.

**Endpoint:** `POST /api/users/register/2fa/reenviar`

**Body:**
```json
{
  "tempToken": "uuid-token-del-registro"
}
```

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "canal": "email",
  "destino": "ju***@example.com"
}
```

---

## 2. LOGIN CON 2FA

### 2.1 Iniciar Sesión (Paso 1)
Verifica credenciales y envía código 2FA.

**Endpoint:** `POST /api/users/login`

**Body:**
```json
{
  "username": "juanperez",
  "contrasena": "password123"
}
```

**Respuesta exitosa (200):**
```json
{
  "mensaje": "Credenciales correctas. Verifica el código enviado a tu correo.",
  "requires2fa": true,
  "canal": "email",
  "destino": "ju***@example.com",
  "tempToken": "uuid-token-aqui"
}
```

### 2.2 Verificar Código 2FA de Login (Paso 2)
Valida el código y recibe el token JWT.

**Endpoint:** `POST /api/users/login/2fa/verificar`

**Body:**
```json
{
  "tempToken": "uuid-token-del-login",
  "codigo": "654321"
}
```

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "507f1f77bcf86cd799439011",
    "nombre": "Juan",
    "ap": "Pérez",
    "am": "García",
    "username": "juanperez",
    "email": "juan@example.com",
    "rol": "usuario",
    "verificado": true
  }
}
```

### 2.3 Reenviar Código 2FA de Login
Reenvía código si expiró.

**Endpoint:** `POST /api/users/login/2fa/reenviar`

**Body:**
```json
{
  "tempToken": "uuid-token-del-login"
}
```

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "canal": "email",
  "destino": "ju***@example.com"
}
```

---

## 3. AUTENTICACIÓN CON GOOGLE

### 3.1 Iniciar Login con Google
Redirige al usuario a Google para autenticarse.

**Endpoint:** `GET /api/auth/google`

**Uso desde el frontend:**
```html
<a href="http://localhost:4000/api/auth/google">
  Iniciar sesión con Google
</a>
```

### 3.2 Callback de Google (Automático)
Google redirige aquí después de la autenticación exitosa.

**Endpoint:** `GET /api/auth/google/callback`

Después de validar, el backend redirige a:
```
http://localhost:3000/auth/google/success?token=JWT_TOKEN_AQUI
```

Tu frontend debe:
1. Capturar el token de la URL
2. Guardarlo en localStorage/sessionStorage
3. Redirigir al usuario al dashboard

**Ejemplo en React:**
```javascript
// En tu página de callback
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (token) {
    localStorage.setItem('authToken', token);
    navigate('/dashboard');
  }
}, []);
```

---

## 4. RUTAS PROTEGIDAS (Ejemplo)

Para proteger rutas con autenticación JWT:

```javascript
const authMiddleware = require('./middlewares/authMiddleware');

// Ruta protegida (cualquier usuario autenticado)
router.get('/perfil', authMiddleware(), (req, res) => {
  res.json({ usuario: req.user });
});

// Ruta solo para admins
router.get('/admin/dashboard', authMiddleware(['admin']), (req, res) => {
  res.json({ mensaje: 'Panel de administrador' });
});
```

**Uso desde el frontend:**
```javascript
fetch('http://localhost:4000/api/users/perfil', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## Errores Comunes

### Error 400 - Código incorrecto
```json
{
  "error": "Código incorrecto"
}
```

### Error 400 - Código expirado
```json
{
  "error": "Código expirado"
}
```

### Error 401 - Credenciales inválidas
```json
{
  "error": "Credenciales inválidas"
}
```

### Error 401 - Token expirado
```json
{
  "error": "Token expirado. Por favor inicia sesión nuevamente."
}
```

### Error 429 - Demasiados intentos
```json
{
  "error": "Demasiados intentos"
}
```

---

## Flujo Completo de Uso

### Registro:
1. Frontend envía datos a `/api/users/register`
2. Backend responde con `tempToken`
3. Usuario recibe código por email
4. Frontend envía código + tempToken a `/api/users/register/2fa/verificar`
5. Registro completado

### Login:
1. Frontend envía credenciales a `/api/users/login`
2. Backend responde con `tempToken`
3. Usuario recibe código por email
4. Frontend envía código + tempToken a `/api/users/login/2fa/verificar`
5. Backend responde con JWT token
6. Frontend guarda token y redirige al dashboard

### Google OAuth:
1. Usuario hace clic en "Iniciar con Google"
2. Redirige a `/api/auth/google`
3. Usuario autoriza en Google
4. Google redirige a callback
5. Backend genera JWT y redirige al frontend con token
6. Frontend guarda token

---

## Configuración de Google Cloud Console

1. Ve a https://console.cloud.google.com/
2. Crea un nuevo proyecto
3. Habilita "Google+ API"
4. Ve a "Credenciales" > "Crear credenciales" > "ID de cliente de OAuth 2.0"
5. Configura:
   - Tipo: Aplicación web
   - URIs de redireccionamiento autorizados: `http://localhost:4000/api/auth/google/callback`
   - Orígenes autorizados: `http://localhost:4000`
6. Copia CLIENT_ID y CLIENT_SECRET al archivo `.env`

---

## Configuración de Gmail App Password

1. Ve a https://myaccount.google.com/security
2. Activa "Verificación en 2 pasos"
3. Ve a "Contraseñas de aplicaciones"
4. Genera una nueva contraseña para "Correo"
5. Copia la contraseña de 16 caracteres al `.env` como `EMAIL_PASS`

---

## Seguridad

- ✅ Los códigos 2FA expiran en 5 minutos
- ✅ Máximo 5 intentos por código
- ✅ Las contraseñas se hashean con bcrypt
- ✅ Los tokens JWT expiran en 7 días
- ✅ El archivo .env está excluido de git
- ⚠️ IMPORTANTE: Cambia `JWT_SECRET` a algo aleatorio y seguro
- ⚠️ IMPORTANTE: Nunca compartas tu archivo `.env`
- ⚠️ Los códigos OTP se almacenan en memoria (en producción usa Redis)

---

## Testing con Postman/Thunder Client

Importa esta colección de ejemplo o prueba manualmente cada endpoint siguiendo la documentación.
