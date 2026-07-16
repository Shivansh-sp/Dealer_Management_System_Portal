import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  globalSearch,
  uploadDocument,
  getDocuments,
  getDashboardAnalytics,
  saveDigitalDocument,
} from '../controllers/dashboardController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Ensure upload folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed.'));
    }
  },
});

router.use(authenticate);

router.get('/search', globalSearch);
router.get('/analytics', getDashboardAnalytics);
router.get('/documents', getDocuments);
router.post('/documents/upload', upload.single('file'), uploadDocument);
router.post('/documents/digital', saveDigitalDocument);

export default router;
