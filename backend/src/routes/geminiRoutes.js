const express = require('express');
const router = express.Router();

const {
  analyzeComplaint,
  generateComplaint
} = require('../controllers/geminiController');

router.post('/analyze', analyzeComplaint);

router.post('/generate-complaint', generateComplaint);

module.exports = router;