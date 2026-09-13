const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// Get all announcements (all roles - filtered by role)
router.get('/', announcementController.getAllAnnouncements);

// Get announcement by ID
router.get('/:id', announcementController.getAnnouncementById);

// Admin always allowed; Teacher needs the matching permission via their role.
router.post('/', roleCheck('ADMIN', 'TEACHER'), requirePermission('announcements.create'), announcementController.createAnnouncement);
router.put('/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('announcements.edit'), announcementController.updateAnnouncement);
router.delete('/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('announcements.delete'), announcementController.deleteAnnouncement);
router.patch('/:id/toggle', roleCheck('ADMIN', 'TEACHER'), requirePermission('announcements.edit'), announcementController.toggleAnnouncementStatus);

module.exports = router;
