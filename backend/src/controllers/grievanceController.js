
const pool = require('../config/database');

const allowedLanguages = ['English', 'Tamil', 'Hindi'];

const createGrievance = async (req, res) => {
  try {
    const {
      user_id,
      complaint_text,
      category,
      confidence,
      location,
      duration,
      additional_details,
      language
    } = req.body;

    if (
      !complaint_text ||
      typeof complaint_text !== 'string' ||
      !complaint_text.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Complaint description is required.'
      });
    }

    if (complaint_text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Complaint description is too long.'
      });
    }

    if (
      user_id !== undefined &&
      user_id !== null &&
      (!Number.isInteger(Number(user_id)) || Number(user_id) <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.'
      });
    }

    if (
      confidence !== undefined &&
      confidence !== null &&
      (
        typeof confidence !== 'number' ||
        !Number.isFinite(confidence) ||
        confidence < 0 ||
        confidence > 1
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Confidence must be a number between 0 and 1.'
      });
    }

    const selectedLanguage = language || 'English';

    if (!allowedLanguages.includes(selectedLanguage)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported complaint language.'
      });
    }

    if (user_id !== undefined && user_id !== null) {
      const [users] = await pool.execute(
        'SELECT id FROM users WHERE id = ?',
        [user_id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Citizen account not found.'
        });
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO grievances
       (
         user_id,
         complaint_text,
         category,
         confidence,
         location,
         duration,
         additional_details,
         language
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id || null,
        complaint_text.trim(),
        category || null,
        confidence ?? null,
        location || null,
        duration || null,
        additional_details || null,
        selectedLanguage
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Grievance draft created successfully.',
      grievance: {
        id: result.insertId,
        complaint_text: complaint_text.trim(),
        category: category || null,
        confidence: confidence ?? null,
        status: 'Draft'
      }
    });

  } catch (error) {
    console.error('Create grievance error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to create grievance.'
    });
  }
};

const getGrievanceById = async (req, res) => {
  try {
    const grievanceId = Number(req.params.id);

    if (!Number.isInteger(grievanceId) || grievanceId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grievance ID.'
      });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM grievances WHERE id = ?',
      [grievanceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found.'
      });
    }

    return res.status(200).json({
      success: true,
      grievance: rows[0]
    });

  } catch (error) {
    console.error('Get grievance error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve grievance.'
    });
  }
};

module.exports = {
  createGrievance,
  getGrievanceById
};
