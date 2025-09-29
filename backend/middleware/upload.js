const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoriesExist = () => {
  const directories = [
    'uploads/profiles',
    'uploads/pets',
    'uploads/posts'
  ];

  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

// Initialize directories
ensureDirectoriesExist();

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    
    // Determine upload path based on field name
    switch (file.fieldname) {
      case 'profilePicture':
        uploadPath += 'profiles/';
        break;
      case 'petPhoto':
        uploadPath += 'pets/';
        break;
      case 'postImages':
        uploadPath += 'posts/';
        break;
      default:
        uploadPath += 'misc/';
    }
    
    const fullPath = path.join(__dirname, '..', uploadPath);
    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    
    // Clean filename (remove special characters)
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    
    cb(null, `${cleanBaseName}_${uniqueSuffix}${ext}`);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files per upload
  },
  fileFilter: fileFilter
});

// Custom error handler for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size allowed is 5MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 5 files allowed.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name for file upload.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + error.message
        });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next();
};

// Upload configurations for different use cases
const uploadConfigs = {
  // Single profile picture
  profilePicture: upload.single('profilePicture'),
  
  // Single pet photo
  petPhoto: upload.single('petPhoto'),
  
  // Multiple pet photos (up to 5)
  petPhotos: upload.array('petPhotos', 5),
  
  // Multiple post images (up to 5)
  postImages: upload.array('postImages', 5),
  
  // Any single image
  singleImage: upload.single('image')
};

// Utility function to get file URL
const getFileUrl = (req, filename) => {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? process.env.BASE_URL || 'https://your-backend-url.render.com'
    : `http://localhost:${process.env.PORT || 5000}`;
  
  return `${baseUrl}/uploads/${filename}`;
};

// Utility function to delete file
const deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`File deleted: ${fullPath}`);
      return true;
    } catch (error) {
      console.error(`Error deleting file ${fullPath}:`, error);
      return false;
    }
  }
  return false;
};

// Utility function to get relative path from full path
const getRelativePath = (fullPath) => {
  const uploadsIndex = fullPath.indexOf('uploads');
  return uploadsIndex !== -1 ? fullPath.substring(uploadsIndex) : fullPath;
};

module.exports = {
  upload,
  uploadConfigs,
  handleUploadError,
  getFileUrl,
  deleteFile,
  getRelativePath
};