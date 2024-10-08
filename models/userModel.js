const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Project = require('./projectModel');
const Notification = require('./notificationModel');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'User should have firstname'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'User should have lastname'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'User should have a email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'User should have a password'],
      minlenght: 10,
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, 'ConfirmPassword is required'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Password and confirm password are not same',
      },
    },
    photo: String,
    role: {
      type: String,
      enum: {
        values: ['admin', 'user'],
        message: 'Role either can be: admin, user',
      },
      default: 'user',
    },
    // notifications: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'Notification',
    //   },
    // ],
    projectsCreated: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Project',
      },
    ],
    projectIdAssigned: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Project',
      },
    ],
    numberOfProjectsAllowed: {
      type: Number,
      default: 2,
    },

    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpiresAt: Date,
    active: {
      type: Boolean,
    },
    subscription: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Subscription',
      },
    ],
    profile: {
      type: Boolean,
      default: true,
    },
    bio: {
      type: String,
    },
    skills: [],
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

// userSchema.virtual('members', {
//   ref: 'Member',
//   foreignField: 'managerId',
//   localField: '_id',
// });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  //  hashing password
  this.password = await bcrypt.hash(this.password, 12);

  this.confirmPassword = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// userSchema.pre(/^find/, function (next) {
//   this.populate({ path: 'notifications', select: '-id' });
//   next();
// });

userSchema.methods.correctPassword = async function (
  inputPassword,
  userPassword,
) {
  return await bcrypt.compare(inputPassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return changedTimestamp > JWTTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpiresAt = Date.now() + 5 * 60 * 1000;
  return resetToken;
};

// userSchema.pre(/^find/, function (next) {
//   this.populate('members');
//   next();
// });

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
