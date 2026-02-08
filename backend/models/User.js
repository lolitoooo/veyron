const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Veuillez ajouter un prénom'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Veuillez ajouter un nom'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Veuillez ajouter un email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez ajouter un email valide'
    ]
  },
  password: {
    type: String,
    required: function() {
      return this.authMethod === 'email';
    },
    minlength: [12, 'Le mot de passe doit contenir au moins 12 caractères'],
    select: false
  },
  authMethod: {
    type: String,
    enum: ['email', 'google', 'magic-link'],
    default: 'email'
  },
  oauthProvider: {
    type: String,
    enum: ['google', null],
    default: null
  },
  oauthId: {
    type: String,
    default: null
  },
  magicLinkToken: String,
  magicLinkExpire: Date,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorBackupCodes: {
    type: [String],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profilePhotoUrl: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  birthDate: {
    type: String,
    default: ''
  },
  newsletterSubscribed: {
    type: Boolean,
    default: false
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  activationToken: String,
  activationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.lastPasswordChange = Date.now();
  next();
});

UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role 
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

UserSchema.methods.getActivationToken = function() {
  const activationToken = crypto.randomBytes(20).toString('hex');

  this.activationToken = crypto
    .createHash('sha256')
    .update(activationToken)
    .digest('hex');

  this.activationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return activationToken;
};

UserSchema.methods.getMagicLinkToken = function() {
  const magicToken = crypto.randomBytes(32).toString('hex');

  this.magicLinkToken = crypto
    .createHash('sha256')
    .update(magicToken)
    .digest('hex');

  this.magicLinkExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

  return magicToken;
};

UserSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};

UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 3;
  const lockTime = 5 * 60 * 1000;

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', UserSchema);