const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const auth = require('../middleware/auth');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// Get all announcements (all roles - filtered by role)
router.get('/', announcementController.getAllAnnouncements);

// Get announcement by ID
router.get('/:id', announcementController.getAnnouncementById);

router.post('/', requirePermission('announcements.create'), announcementController.createAnnouncement);
router.put('/:id', requirePermission('announcements.edit'), announcementController.updateAnnouncement);
router.delete('/:id', requirePermission('announcements.delete'), announcementController.deleteAnnouncement);
router.patch('/:id/toggle', requirePermission('announcements.edit'), announcementController.toggleAnnouncementStatus);

module.exports = router;
