const express = require('express');
const multer = require('multer');
const router = express.Router();
const studentController = require('../controllers/studentController');
const studentDocumentController = require('../controllers/studentDocumentController');
const auth = require('../middleware/auth');
const requirePermission = require('../middleware/requirePermission');
const allowSelfOrPermission = require('../middleware/allowSelfOrPermission');

const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
      return cb(new Error('Only image or PDF files are allowed'));
    }
    cb(null, true);
  },
});

// All routes require authentication
router.use(auth);

// A student may always view their own profile; anyone else needs students.view.
router.get('/:id', allowSelfOrPermission(u => u.role === 'STUDENT' ? u.id : null, 'students.view'), studentController.getStudentById);

router.get('/', requirePermission('students.view'), studentController.getAllStudents);
router.post('/', requirePermission('students.create'), studentController.createStudent);
router.put('/:id', requirePermission('students.edit'), studentController.updateStudent);
router.delete('/:id', requirePermission('students.delete'), studentController.deleteStudent);

// Get students by class (for teachers marking attendance)
router.get('/class/:classId', requirePermission('students.view'), studentController.getStudentsByClass);

// Documents — a student may view/download their own; uploading/deleting is staff-only.
const ownStudentId = u => u.role === 'STUDENT' ? u.id : null;
router.get('/:id/documents', allowSelfOrPermission(ownStudentId, 'students.view'), studentDocumentController.listStudentDocuments);
router.get('/:id/documents/:docId/file', allowSelfOrPermission(ownStudentId, 'students.view'), studentDocumentController.downloadStudentDocument);
router.post('/:id/documents', requirePermission('students.edit'), uploadDocument.single('document'), studentDocumentController.uploadStudentDocument);
router.delete('/:id/documents/:docId', requirePermission('students.edit'), studentDocumentController.deleteStudentDocument);

module.exports = router;
