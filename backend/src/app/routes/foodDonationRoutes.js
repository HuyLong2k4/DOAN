const express = require('express');
const router = express.Router();
const FoodDonationController = require('../controllers/foodDonationController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

router.post('/',    FoodDonationController.createDonation);
router.get('/',     FoodDonationController.getDonations);
router.get('/my',   FoodDonationController.getMyDonations);
router.get('/volunteer/my-deliveries', FoodDonationController.getMyVolunteerDeliveries);
router.get('/:id/available-volunteers', FoodDonationController.getAvailableVolunteers);
router.get('/:id/tracking', FoodDonationController.getReceiverTracking);
router.patch('/:id/connect', FoodDonationController.connectDonation);
router.patch('/:id/receiver-delivery-choice', FoodDonationController.chooseDeliveryByReceiver);
router.patch('/:id/self-pickup-complete', FoodDonationController.completeSelfPickupByReceiver);
router.patch('/:id/receiver-requests/:receiverId/approve', FoodDonationController.approveReceiverRequest);
router.patch('/:id/receiver-requests/:receiverId/reject', FoodDonationController.rejectReceiverRequest);
router.patch('/:id/accept', FoodDonationController.acceptDonation);
router.patch('/:id/reject', FoodDonationController.rejectDonation);
router.patch('/:id/pickup-start', FoodDonationController.startPickup);
router.patch('/:id/delivered', FoodDonationController.markDelivered);

module.exports = router;
