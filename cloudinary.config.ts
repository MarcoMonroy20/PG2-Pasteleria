// Cloudinary Configuration
// Configuración para el sistema híbrido de imágenes

export const CLOUDINARY_ENABLED = process.env.EXPO_PUBLIC_CLOUDINARY_ENABLED === 'true';

// Cloudinary configuration - FROM environment variables OR fallback
export const cloudinaryConfig = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfh83zgqi',
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'pasteleria-upload',
  apiKey: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '544228462686976',
  apiSecret: process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || 'P0dQzg7wNG8DV4kdp_0ZLO5ExiM'
};

// Upload URL for Cloudinary
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;

// Instructions for setup:
// 1. Go to https://cloudinary.com/
// 2. Create a free account
// 3. Get your Cloud Name, API Key, and API Secret from Dashboard
// 4. Create an Upload Preset (unsigned) in Settings > Upload
// 5. For production, use environment variables:
//    - EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
//    - EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
//    - EXPO_PUBLIC_CLOUDINARY_API_KEY
//    - EXPO_PUBLIC_CLOUDINARY_API_SECRET
//    - EXPO_PUBLIC_CLOUDINARY_ENABLED=true

export default cloudinaryConfig;
