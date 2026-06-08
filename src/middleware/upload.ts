import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { ValidationError } from '@/types';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) => {
    callback(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    callback(null, `logo-${uniqueSuffix}${ext}`);
  },
});

// File filter to only accept image files (png, jpg, jpeg)
const fileFilter = (req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  const allowedMimetypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedMimetypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new ValidationError('Invalid file type. Only JPEG, PNG and JPG images are allowed.') as any);
  }
};

// Multer upload middleware configuration
export const uploadLogo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
