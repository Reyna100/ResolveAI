
const pool = require('../config/database');

const registerUser = async (req, res) => {
  try {
    const {
      full_name,
      mobile,
      email,
      state,
      district,
      preferred_language
    } = req.body;

    if (!full_name || !mobile || !state || !district) {
      return res.status(400).json({
        success: false,
        message: 'Full name, mobile, state and district are required.'
      });
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid 10-digit Indian mobile number.'
      });
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email address.'
      });
    }

    const allowedLanguages = ['English', 'Tamil', 'Hindi'];
    const language = preferred_language || 'English';

    if (!allowedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported preferred language.'
      });
    }

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE mobile = ?',
      [mobile]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This mobile number is already registered.'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO users
       (full_name, mobile, email, state, district, preferred_language)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        full_name.trim(),
        mobile,
        email || null,
        state.trim(),
        district.trim(),
        language
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Citizen registered successfully.',
      user: {
        id: result.insertId,
        full_name: full_name.trim(),
        mobile,
        email: email || null,
        state: state.trim(),
        district: district.trim(),
        preferred_language: language
      }
    });

  } catch (error) {
    console.error('User registration error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to register citizen.'
    });
  }
};

module.exports = {
  registerUser
};
