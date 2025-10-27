# Guía de Integración: Backend con Frontend React

## 📋 Información del Proyecto

**Backend:** Node.js + Express + MongoDB + 2FA + Google OAuth
**Frontend:** React (Create React App)
**Backend URL:** http://localhost:4000
**Frontend URL:** http://localhost:3000

---

## 🔧 Paso 1: Configuración del Frontend

### 1.1 Clonar y configurar el repositorio del frontend

```bash
git clone https://github.com/Gilberto625/front-umi.git
cd front-umi
npm install
```

### 1.2 Crear archivo `.env` en el frontend

Crea un archivo `.env` en la raíz del proyecto React:

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:4000

# Google OAuth (debe coincidir con el backend)
REACT_APP_GOOGLE_CLIENT_ID=840156484089-cjlud6ktv2kfi66b596c8tpg4c5sff65s.apps.googleusercontent.com
```

### 1.3 Instalar dependencias adicionales (si son necesarias)

```bash
# Para hacer peticiones HTTP
npm install axios

# Para manejo de rutas (si no está instalado)
npm install react-router-dom

# Para Google OAuth (opcional, si prefieres usar el botón de Google)
npm install @react-oauth/google
```

---

## 🌐 Paso 2: Configuración de Servicios API en React

### 2.1 Crear archivo de configuración API

Crea `src/services/api.js`:

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🔐 Paso 3: Servicios de Autenticación

### 3.1 Crear `src/services/authService.js`

```javascript
import api from './api';

const authService = {
  // ============ REGISTRO CON 2FA ============
  register: async (userData) => {
    const response = await api.post('/api/users/register', {
      nombre: userData.nombre,
      apellidopaterno: userData.apellidoPaterno,
      apellidomaterno: userData.apellidoMaterno,
      username: userData.username,
      correo: userData.correo,
      contrasena: userData.contrasena,
      telefono: userData.telefono,
      preguntasecreta: userData.preguntaSecreta,
      respuestasecreta: userData.respuestaSecreta,
    });
    return response.data; // { tempToken, requires2fa, destino, ... }
  },

  // Verificar código 2FA de registro
  verifyRegister2FA: async (tempToken, codigo) => {
    const response = await api.post('/api/users/register/2fa/verificar', {
      tempToken,
      codigo,
    });
    return response.data; // { ok: true }
  },

  // Reenviar código de registro
  resendRegister2FA: async (tempToken) => {
    const response = await api.post('/api/users/register/2fa/reenviar', {
      tempToken,
    });
    return response.data;
  },

  // ============ LOGIN CON 2FA ============
  login: async (username, contrasena) => {
    const response = await api.post('/api/users/login', {
      username,
      contrasena,
    });
    return response.data; // { tempToken, requires2fa, destino, ... }
  },

  // Verificar código 2FA de login
  verifyLogin2FA: async (tempToken, codigo) => {
    const response = await api.post('/api/users/login/2fa/verificar', {
      tempToken,
      codigo,
    });

    // Guardar token JWT
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.usuario));
    }

    return response.data; // { ok: true, token, usuario }
  },

  // Reenviar código de login
  resendLogin2FA: async (tempToken) => {
    const response = await api.post('/api/users/login/2fa/reenviar', {
      tempToken,
    });
    return response.data;
  },

  // ============ GOOGLE OAUTH ============
  loginWithGoogle: () => {
    // Redirigir al endpoint de Google OAuth del backend
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  },

  // ============ OTROS ============
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};

export default authService;
```

---

## 📱 Paso 4: Componentes de Ejemplo

### 4.1 Componente de Registro (`src/components/Register.jsx`)

```javascript
import React, { useState } from 'react';
import authService from '../services/authService';

function Register() {
  const [step, setStep] = useState(1); // 1: form, 2: 2FA
  const [formData, setFormData] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    username: '',
    correo: '',
    contrasena: '',
    telefono: '',
    preguntaSecreta: '',
    respuestaSecreta: '',
  });
  const [tempToken, setTempToken] = useState('');
  const [codigo2FA, setCodigo2FA] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.register(formData);

      if (response.requires2fa) {
        setTempToken(response.tempToken);
        setStep(2);
        alert(`Código enviado a ${response.destino}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.verifyRegister2FA(tempToken, codigo2FA);
      alert('Registro completado exitosamente! Ahora puedes iniciar sesión.');
      window.location.href = '/login';
    } catch (err) {
      setError(err.response?.data?.error || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const handleResend2FA = async () => {
    try {
      await authService.resendRegister2FA(tempToken);
      alert('Código reenviado exitosamente');
    } catch (err) {
      setError('Error al reenviar código');
    }
  };

  if (step === 2) {
    return (
      <div className="register-container">
        <h2>Verificación 2FA - Registro</h2>
        <p>Ingresa el código de 6 dígitos enviado a tu correo</p>

        <form onSubmit={handleVerify2FA}>
          <input
            type="text"
            placeholder="Código de 6 dígitos"
            value={codigo2FA}
            onChange={(e) => setCodigo2FA(e.target.value)}
            maxLength="6"
            required
          />

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar'}
          </button>

          <button type="button" onClick={handleResend2FA}>
            Reenviar código
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="register-container">
      <h2>Registro de Usuario</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="apellidoPaterno"
          placeholder="Apellido Paterno"
          value={formData.apellidoPaterno}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="apellidoMaterno"
          placeholder="Apellido Materno"
          value={formData.apellidoMaterno}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="username"
          placeholder="Nombre de usuario"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="correo"
          placeholder="Correo electrónico"
          value={formData.correo}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="contrasena"
          placeholder="Contraseña"
          value={formData.contrasena}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="telefono"
          placeholder="Teléfono"
          value={formData.telefono}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="preguntaSecreta"
          placeholder="Pregunta secreta"
          value={formData.preguntaSecreta}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="respuestaSecreta"
          placeholder="Respuesta secreta"
          value={formData.respuestaSecreta}
          onChange={handleChange}
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}

export default Register;
```

### 4.2 Componente de Login (`src/components/Login.jsx`)

```javascript
import React, { useState } from 'react';
import authService from '../services/authService';

function Login() {
  const [step, setStep] = useState(1); // 1: credentials, 2: 2FA
  const [username, setUsername] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [codigo2FA, setCodigo2FA] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(username, contrasena);

      if (response.requires2fa) {
        setTempToken(response.tempToken);
        setStep(2);
        alert(`Código enviado a ${response.destino}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.verifyLogin2FA(tempToken, codigo2FA);

      // Redirigir al dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authService.loginWithGoogle();
  };

  if (step === 2) {
    return (
      <div className="login-container">
        <h2>Verificación 2FA</h2>
        <p>Ingresa el código enviado a tu correo</p>

        <form onSubmit={handleVerify2FA}>
          <input
            type="text"
            placeholder="Código de 6 dígitos"
            value={codigo2FA}
            onChange={(e) => setCodigo2FA(e.target.value)}
            maxLength="6"
            required
          />

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Usuario o correo"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Iniciando...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="divider">O</div>

      <button onClick={handleGoogleLogin} className="google-btn">
        Iniciar sesión con Google
      </button>
    </div>
  );
}

export default Login;
```

### 4.3 Callback de Google OAuth (`src/components/GoogleCallback.jsx`)

```javascript
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Guardar token en localStorage
      localStorage.setItem('authToken', token);

      // Obtener información del usuario (opcional)
      // Puedes hacer una petición al backend para obtener los datos del usuario

      // Redirigir al dashboard
      navigate('/dashboard');
    } else {
      // Error en la autenticación
      alert('Error al autenticar con Google');
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Procesando autenticación...</h2>
      <p>Por favor espera...</p>
    </div>
  );
}

export default GoogleCallback;
```

---

## 🛡️ Paso 5: Proteger Rutas

### 5.1 Crear componente ProtectedRoute (`src/components/ProtectedRoute.jsx`)

```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

function ProtectedRoute({ children }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
```

---

## 🗺️ Paso 6: Configurar Rutas en App.js

```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import GoogleCallback from './components/GoogleCallback';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/google/success" element={<GoogleCallback />} />
        <Route path="/auth/google/error" element={<Navigate to="/login" />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## 🚀 Paso 7: Iniciar Ambos Servidores

### Terminal 1 - Backend:
```bash
cd backana-umi
npm start
# o
npx nodemon index.js
```

### Terminal 2 - Frontend:
```bash
cd front-umi
npm start
```

El frontend se abrirá en: http://localhost:3000
El backend estará en: http://localhost:4000

---

## ✅ Verificación de Integración

### 1. Probar Registro:
1. Ve a http://localhost:3000/register
2. Llena el formulario
3. Deberías recibir un código por correo
4. Ingresa el código
5. Deberías ver mensaje de éxito

### 2. Probar Login:
1. Ve a http://localhost:3000/login
2. Ingresa credenciales
3. Deberías recibir código por correo
4. Ingresa el código
5. Deberías ser redirigido al dashboard

### 3. Probar Google OAuth:
1. Ve a http://localhost:3000/login
2. Haz clic en "Iniciar sesión con Google"
3. Autoriza con tu cuenta de Google
4. Deberías ser redirigido al dashboard

---

## 🔧 Solución de Problemas

### Error de CORS:
Si ves errores de CORS en la consola del navegador:
- Verifica que `FRONTEND_ORIGIN` en el backend `.env` sea `http://localhost:3000`
- Asegúrate de que el backend tenga `credentials: true` en la configuración de CORS

### Token no se guarda:
- Verifica en DevTools → Application → Local Storage
- Debe aparecer `authToken` y `user`

### Google OAuth no funciona:
- Verifica que en Google Cloud Console la URL de callback sea exactamente:
  `http://localhost:4000/api/auth/google/callback`
- Agrega `http://localhost:3000` a los orígenes autorizados

---

## 📚 Recursos Adicionales

- **Documentación del Backend:** Ver `API_DOCS.md`
- **React Router:** https://reactrouter.com/
- **Axios:** https://axios-http.com/

---

¿Tienes alguna pregunta sobre la integración?
