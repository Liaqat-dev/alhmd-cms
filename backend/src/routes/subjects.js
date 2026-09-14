const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const auth = require('../middleware/auth');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

router.get('/', requirePermission('subjects.view'), subjectController.getAllSubjects);
router.get('/:id', requirePermission('subjects.view'), subjectController.getSubjectById);
router.post('/', requirePermission('subjects.create'), subjectController.createSubject);
router.post('/bulk', requirePermission('subjects.create'), subjectController.bulkCreateSubjects);
router.put('/:id', requirePermission('subjects.edit'), subjectController.updateSubject);
router.delete('/:id', requirePermission('subjects.delete'), subjectController.deleteSubject);

module.exports = router;
