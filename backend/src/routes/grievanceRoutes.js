
const express = require('express');
const router = express.Router();

const {
  createGrievance,
  getGrievanceById
} = require('../controllers/grievanceController');

router.post('/', createGrievance);

router.get('/:id', getGrievanceById);

module.exports = router;
