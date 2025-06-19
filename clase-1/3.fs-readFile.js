const fs = require('node:fs')

console.log('Leyendo el primer archivo...')
fs.readFile('./archivo.txt', 'utf-8', (err, text) => {
  if (err) {
    console.error('Error leyendo archivo 1:', err)
    return
  }
  console.log('primer texto:', text)
})

console.log('--> Hacer cosas mientras lee el archivo...')

console.log('Leyendo el segundo archivo...')
fs.readFile('./archivo2.txt', 'utf-8', (err, text) => {
  if (err) {
    console.error('Error leyendo archivo 2:', err)
    return
  }
  console.log('segundo texto:', text)
})
