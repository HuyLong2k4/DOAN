const express = require('express');
const router = express.Router();
const FoodRequestController = require('../controllers/foodRequestController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', FoodRequestController.createRequest);
router.get('/', FoodRequestController.getRequests);
router.get('/my', FoodRequestController.getMyRequests);
router.patch('/:id/accept', FoodRequestController.acceptRequestByDonor);
router.delete('/:id', FoodRequestController.deleteMyRequest);

module.exports = router;
