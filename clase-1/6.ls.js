const fs = require('node:fs/promises')

fs.readdir('.')
  .then(files => {
    files.forEach(file => {
      console.log(file)
    })
  })
  .catch(err => {
    if (err) {
      console.error('Error al leer el directorio: ', err)
      return;
    }
  })

// Versión clásica con callback
// const fs = require('fs')

// fs.readdir('.', (err, files) => {
//   if (err) throw err
//   console.log(files)
// })

