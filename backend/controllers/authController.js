// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ===== REGISTER =====
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, fullName } = req.body;
    const t = req.t;

    // Check existing user
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      const messageKey = existingUser.email === email ? 
        'auth.register.email_exists' : 
        'auth.register.username_exists';
      return res.status(409).json({
        success: false,
        message: t(messageKey)
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: t('auth.register.password_weak')
      });
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      fullName,
      role: 'user',
      isActive: true,
      language: req.locale || 'en',
      createdAt: new Date()
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: t('auth.register.success'),
      data: { user, token }
    });
  } catch (error) {
    next(error);
  }
};

// ===== LOGIN =====
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const t = req.t;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: t('auth.login.email_required')
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: t('auth.login.password_required')
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: t('auth.login.failure')
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: t('auth.login.failure')
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: t('auth.login.success'),
      data: { user, token }
    });
  } catch (error) {
    next(error);
  }
};

// ===== GET PROFILE =====
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -verificationToken -verificationExpires');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// ===== UPDATE PROFILE =====
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const userId = req.user.id;
    const t = req.t;

    // Campi che non possono essere modificati
    delete updates._id;
    delete updates.email;
    delete updates.username;
    delete updates.role;
    delete updates.createdAt;

    // Se c'è una password, hashala
    if (updates.password) {
      const salt = await bcrypt.genSalt(12);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password -verificationToken -verificationExpires');

    res.json({
      success: true,
      message: t('auth.profile.updated'),
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// ===== LOGOUT =====
exports.logout = async (req, res, next) => {
  res.json({
    success: true,
    message: req.t('auth.logout.success')
  });
};

// ===== CHANGE LANGUAGE =====
exports.changeLanguage = async (req, res, next) => {
  try {
    const { language } = req.body;
    const t = req.t;

    if (!['en', 'zh', 'ms', 'ta'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { language },
      { new: true }
    );

    res.json({
      success: true,
      message: t('auth.profile.updated'),
      data: { user, language }
    });
  } catch (error) {
    next(error);
  }
};
