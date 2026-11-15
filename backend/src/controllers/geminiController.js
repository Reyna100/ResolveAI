const {
  analyzeComplaint: analyzeComplaintRequest,
  generateComplaintDraft
} = require('../services/geminiService');

const allowedLanguages = ['English', 'Tamil', 'Hindi'];

function validateComplaintText(complaint_text) {
  if (
    !complaint_text ||
    typeof complaint_text !== 'string' ||
    !complaint_text.trim()
  ) {
    return 'Complaint text is required';
  }

  if (complaint_text.length > 5000) {
    return 'Complaint text must not exceed 5000 characters';
  }

  return null;
}

function logGeminiError(error) {
  console.error('========== GEMINI ERROR ==========');
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('HTTP status:', error.status);
  console.error('Error details:', error.details || 'Not provided');
  console.error('==================================');
}

async function analyzeComplaint(req, res) {
  try {
    const { complaint_text, language } = req.body;

    const complaintError = validateComplaintText(complaint_text);

    if (complaintError) {
      return res.status(400).json({
        success: false,
        message: complaintError
      });
    }

    const selectedLanguage = language || 'English';

    if (!allowedLanguages.includes(selectedLanguage)) {
      return res.status(400).json({
        success: false,
        message: 'Supported languages are English, Tamil and Hindi'
      });
    }

    const result = await analyzeComplaintRequest({
      complaint_text: complaint_text.trim(),
      language: selectedLanguage
    });

    return res.status(200).json({
      success: true,
      message: 'Missing information analysis completed',
      data: result
    });

  } catch (error) {
    logGeminiError(error);

    return res.status(502).json({
      success: false,
      message:
        error.message ||
        'Complaint analysis failed. Please try again in a moment.'
    });
  }
}

async function generateComplaint(req, res) {
  try {
    const {
      complaint_text,
      language,
      category,
      confidence,
      location,
      duration,
      additional_details,
      answers
    } = req.body;

    const complaintError = validateComplaintText(complaint_text);

    if (complaintError) {
      return res.status(400).json({
        success: false,
        message: complaintError
      });
    }

    const allowedLanguages = ['English', 'Tamil', 'Hindi'];
    const selectedLanguage = language || 'English';

    if (!allowedLanguages.includes(selectedLanguage)) {
      return res.status(400).json({
        success: false,
        message: 'Supported languages are English, Tamil and Hindi'
      });
    }

    if (
      answers !== undefined &&
      answers !== null &&
      !Array.isArray(answers)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Answers must be an array'
      });
    }

    const result = await generateComplaintDraft({
      complaint_text: complaint_text.trim(),
      language: selectedLanguage,
      category: category || '',
      confidence: confidence ?? null,
      location: location || '',
      duration: duration || '',
      additional_details: additional_details || '',
      answers: answers || []
    });

    return res.status(200).json({
      success: true,
      message: 'Complaint draft generated successfully',
      data: result
    });

  } catch (error) {
    logGeminiError(error);

    return res.status(502).json({
      success: false,
      message:
        error.message ||
        'Gemini generation failed. Please try again in a moment.'
    });
  }
}

module.exports = {
  analyzeComplaint,
  generateComplaint
};