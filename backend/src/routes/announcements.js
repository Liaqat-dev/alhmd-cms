const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(auth);

// Get all announcements (all roles - filtered by role)
router.get('/', announcementController.getAllAnnouncements);

// Get announcement by ID
router.get('/:id', announcementController.getAnnouncementById);

// Admin only routes
router.post('/', roleCheck('ADMIN'), announcementController.createAnnouncement);
router.put('/:id', roleCheck('ADMIN'), announcementController.updateAnnouncement);
router.delete('/:id', roleCheck('ADMIN'), announcementController.deleteAnnouncement);
router.patch('/:id/toggle', roleCheck('ADMIN'), announcementController.toggleAnnouncementStatus);

module.exports = router;
