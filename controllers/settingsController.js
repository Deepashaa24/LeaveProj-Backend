const Settings = require('../models/Settings');

/**
 * @desc    Get settings
 * @route   GET /api/settings
 * @access  Private (Admin)
 */
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update settings
 * @route   PUT /api/settings
 * @access  Private (Admin)
 */
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        ...req.body,
        lastUpdatedBy: req.user.id
      });
    } else {
      settings = await Settings.findByIdAndUpdate(
        settings._id,
        {
          ...req.body,
          lastUpdatedBy: req.user.id
        },
        {
          new: true,
          runValidators: true
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};
