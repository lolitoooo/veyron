const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Format non supporté. Utilisez JPG ou PNG.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: fileFilter
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'L\'image est trop volumineuse. Taille maximale: 2MB' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

exports.uploadSingleImage = [
  upload.single('image'),
  handleMulterError,
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé' });
      }
      
      const filename = path.basename(req.file.path);
      const imageUrl = `http://localhost:3000/images/${filename}`;
      
      res.status(200).json({
        success: true,
        data: {
          url: imageUrl,
          filename: filename
        },
        message: 'Image téléchargée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload de l\'image',
        error: error.message
      });
    }
  }
];

exports.uploadMultipleImages = [
  upload.array('images', 5),
  handleMulterError,
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé' });
      }
      
      const fileData = req.files.map(file => {
        const filename = path.basename(file.path);
        return {
          url: `http://localhost:3000/images/${filename}`,
          filename: filename
        };
      });
      
      res.status(200).json({
        success: true,
        data: fileData,
        message: `${req.files.length} image(s) téléchargée(s) avec succès`
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload des images:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload des images',
        error: error.message
      });
    }
  }
];
