const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getUserCount,
  getAllUsers,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const {
  uploadProfilePhoto,
  deleteProfilePhoto
} = require('../controllers/profilePhotoController');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

router.post('/profile-photo', protect, upload.single('profilePhoto'), uploadProfilePhoto);
router.delete('/profile-photo', protect, deleteProfilePhoto);

router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);
router.put('/addresses/:id/set-default', protect, setDefaultAddress);

router.get('/count', protect, authorize('admin'), getUserCount);
router.get('/all', protect, authorize('admin'), getAllUsers);

router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;