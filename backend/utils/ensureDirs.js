const fs = require('fs');
const path = require('path');

function ensureDirectoriesExist() {
  const dirs = [
    path.join(__dirname, '../public'),
    path.join(__dirname, '../public/uploads'),
    path.join(__dirname, '../public/uploads/products')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Dossier créé: ${dir}`);
    }
  });
}

module.exports = ensureDirectoriesExist;
