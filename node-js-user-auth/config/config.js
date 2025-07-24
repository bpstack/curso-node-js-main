// Cargar variables de entorno desde .env si estás usando dotenv
import dotenv from 'dotenv'
dotenv.config()

// Verificación crítica: asegúrate de tener la clave secreta JWT
if (!process.env.SECRET_JWT_KEY) {
  throw new Error('Falta la variable SECRET_JWT_KEY en el entorno')
}

export const {
  PORT = 3000,
  SALT_ROUNDS = 10, // Número de rondas para hashear contraseñas, puedo cambiarlo dependiendo si estoy en produccion o desarrollo
  SECRET_JWT_KEY, // No se recomienda poner un valor, para que así seguro no se olvide en producción (porque nos dará error) e inyectarselo como variable de entorno. debería estar en un archivo .env
} = process.env
