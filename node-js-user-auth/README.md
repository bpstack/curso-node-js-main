1. Instalación del proyecto
2. Usuarios en la base de datos
3. Registro de usuarios
4. Autenticación básica con login y password (Yaak)
5. Verificación de autenticación (Usando hashes y salts)
6. Sesión de usuarios con cookie (localstorage no es recomendable)
7. Json Web Tokens (JWT)
8. Refactorizar con un middleware
9. Cerrar sesión
10. Refresh token
11. Más adelante: Passport y OAuth 2.0 (en un futuro)

¡Perfecta pregunta, Bori! Una vez que tienes tu **`UserRepository` completo** y el **`index.js` con las rutas montadas**, ya estás muy cerca de tener tu sistema de autenticación funcional. Aquí te detallo **los siguientes pasos** en orden lógico:

---

### ✅ 1. **Implementar el login (con JWT)**

- Verifica username/email y password (comparación con bcrypt).
- Si es válido, **genera un token JWT**.
- Devuelve ese token al cliente (normalmente en el body o en una cookie segura).

🔐 Ejemplo básico:

```js
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from './config/config.js'

const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
  expiresIn: '2h',
})
```

---

### ✅ 2. **Proteger rutas privadas con middleware**

Crea un middleware para verificar el token en peticiones protegidas:

```js
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Token requerido' })

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
```

Y lo usas así:

```js
app.get('/private', authMiddleware, (req, res) => {
  res.json({ message: 'Estás autenticado', user: req.user })
})
```

---

### ✅ 3. **Opcional: logout (lado cliente)**

- El logout en JWT suele hacerse **borrando el token** del lado cliente (navegador, app).
- Si usas cookies, puedes hacer un endpoint que envíe una cookie vacía o con `expires`.

---

### ✅ 4. **Roles y permisos (autorización)**

Puedes extender el middleware para verificar que el usuario tenga un rol específico:

```js
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado' })
    }
    next()
  }
}
```

Usarías esto en una ruta:

```js
app.post('/admin-only', authMiddleware, authorizeRoles('admin'), handler)
```

---

### ✅ 5. **Testear el sistema de principio a fin**

Comprueba:

- Registro correcto
- Login con credenciales válidas
- Login con credenciales incorrectas
- Acceso a rutas privadas sin token → falla
- Acceso con token válido → OK
- Acceso con token expirado → falla
- Roles → funcionan bien

---

### ✅ 6. **Mejoras opcionales**

- Guardar fecha de último login
- Bloquear usuarios (La funcionalidad de bloquear usuarios debe tener tanto la lógica en user-repository.js como una ruta en index.js para poder llamarla desde fuera (por ejemplo, desde un panel de administración))
- Refrescar tokens (refresh tokens)
- Soporte para OAuth (Google, GitHub...) si es necesario
  Esto último es brutal si lo hago XD es una forma alternativa de autenticación, muy común hoy en día, que permite a los usuarios iniciar sesión usando una cuenta externa en lugar de registrarse manualmente con usuario y contraseña.

  ✅ Ventajas
  .No necesitas gestionar contraseñas.
  .Más seguro (Google/GitHub hacen el trabajo sucio).
  .Es más rápido para el usuario (inicio de sesión en 1 clic).
  .Permite login unificado en varias plataformas.

🔧 ¿Cómo se implementa en Node.js?
.Usa una librería como passport.js con el paquete passport-google-oauth20, passport-github2, etc.
.Configuras tus credenciales en la consola de Google o GitHub.
.Creas una ruta /auth/google o /auth/github.
.El usuario es redirigido a Google/GitHub, inicia sesión allí.
.Cuando vuelve a tu web, tu app recibe los datos del usuario y los almacena o los usa.

¿Cómo funciona la gestión de usuarios con OAuth?
El usuario se autentica en Google (o GitHub, etc).
Google te devuelve un perfil con datos básicos (email, nombre, foto, ID único).
Tu backend recibe ese perfil y busca en tu base de datos si ese usuario ya existe (usando el email o el ID de Google).
Si existe, simplemente inicias sesión para ese usuario.
Si no existe, creas un nuevo usuario en tu base de datos con los datos que te ha dado Google.

Ejemplo en Node.js con passport.js:

```js
import passport from 'passport'
import GoogleStrategy from 'passport-google-oauth20'

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      // Aquí es donde buscas o creas el usuario
      // ...
      done(null, user)  // Devuelve el usuario
    }
  )
)
// Cuando recibes el profile de Google:
const userGoogleId = profile.id
const email = profile.emails[0].value
const name = profile.displayName

// Buscas usuario por Google ID o email
let user = await User.findOne({ googleId: userGoogleId })

if (!user) {
// Si no existe, creas nuevo usuario
user = await User.create({
googleId: userGoogleId,
email,
name,
// No hay password porque es OAuth
})
}  // preguntar todo esto a chatgpt

// Continúas con la sesión o JWT

---
cosas a considerar
- intentar hacer login y sesion
```
