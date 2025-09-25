// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'orderuploads', // Cloudinary folder name
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'], // optional
    public_id: (req, file) => Date.now() + '-' + file.originalname,
  },
});

module.exports = {
  cloudinary,
  storage,
};
