const multer = require('multer');
const path = require('path');

// Ensure the 'uploads' directory exists
const fs = require('fs');
const dir = './uploads';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

// Configure how files are stored
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save files to the 'uploads' folder
  },
  filename: function (req, file, cb) {
    // Create a unique filename to prevent conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Check for valid image file types
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only .jpeg, .png, and .jpg image formats are allowed!'), false); // Reject the file
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB file size limit
  },
  fileFilter: fileFilter
});

module.exports = upload;