export const {
  PORT = 3000,
  SALT_ROUNDS = 10, // Número de rondas para hashear contraseñas, puedo cambiarlo dependiendo si estoy en produccion o desarrollo
  SECRET_JWT_KEY = 'this-is-an-awesome-secret-key', // No se recomienda poner un valor por defecto, para que así seguro no se olvide en producción (porque nos dará error) e inyectarselo como variable de entorno. debería estar en un archivo .env
} = process.env

// El código va a quedar de la siguiente manera:

// if (!process.env.JWT_SECRET_KEY) {
//   throw new Error('Falta la variable JWT_SECRET en el entorno')
// }

// export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

// export const {
//   PORT = 3000,
//   SALT_ROUNDS = 10
// } = process.env
