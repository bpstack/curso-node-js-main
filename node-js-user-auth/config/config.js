export const {
  PORT = 3000,
  SALT_ROUNDS = 10, // Número de rondas para hashear contraseñas, puedo cambiarlo dependiendo si estoy en produccion o desarrollo
} = process.env
