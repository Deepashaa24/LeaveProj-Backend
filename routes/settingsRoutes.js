const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getSettings)
  .put(updateSettings);

module.exports = router;
