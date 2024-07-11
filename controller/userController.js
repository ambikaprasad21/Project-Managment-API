const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cloudinary = require('./../config/cloudinary');
const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (
    file.mimetype == 'image/png' ||
    file.mimetype == 'image/jpg' ||
    file.mimetype == 'image/jpeg' ||
    file.mimetype == 'video/mp4' ||
    file.mimetype == 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(
      new AppError('Only .png, .jpg, .jpeg .mp4 and .pdf format allowed!'),
    );
  }
};

exports.upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.resizeUserPic = async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/uploads/images/${req.file.filename}`);
  next();
};

exports.uploadPic = catchAsync(async (req, res) => {
  const userpic = await cloudinary.uploader.upload(
    `${path.resolve(__dirname, '../public/uploads/images')}/${
      req.file.filename
    }`,
    {
      format: 'jpeg',
    },
  );

  if (!userpic) {
    return next(new AppError('Error uploading profile pic', 400));
  }

  await User.findByIdAndUpdate(req.user._id, { photo: userpic.secure_url });

  fs.unlink(
    `${path.resolve(__dirname, '../public/uploads/images')}/${
      req.file.filename
    }`,
    (err) => {
      if (err) {
        throw new AppError('Error removing file from server');
      } else {
        console.log('file deleted from server successfully');
      }
    },
  );

  res.status(200).json({
    status: 'success',
    data: {
      cloudianryPaht: userpic.secure_url,
      filename: req.file.filename,
    },
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  user.password = newPassword;
  user.confirmPassword = confirmPassword;
  await user.save();
  const token = await createLoginToken(user._id);
  sendLoginTokenToCookie(res, token);
});

exports.visibility = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('There is no user with this credential', 400));
  }

  user.profile = !profile;
  await user.save();
  res.status(200).json({
    status: 'success',
  });
});
