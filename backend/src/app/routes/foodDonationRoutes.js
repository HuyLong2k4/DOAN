const express = require('express');
const router = express.Router();
const FoodDonationController = require('../controllers/foodDonationController');
const authMiddleware = require('../middlewares/authMiddleware');
const { uploadDonationImages } = require('../middlewares/donationUploadMiddleware');

// All routes require authentication
router.use(authMiddleware);

router.post('/',    FoodDonationController.createDonation);
router.post('/uploads', uploadDonationImages.array('files', 6), FoodDonationController.uploadDonationImages);
router.get('/',     FoodDonationController.getDonations);
router.get('/my',   FoodDonationController.getMyDonations);
router.get('/received', FoodDonationController.getMyReceivedDonations);
router.get('/volunteer/summary', FoodDonationController.getVolunteerSummary);
router.get('/volunteer/my-deliveries', FoodDonationController.getMyVolunteerDeliveries);
router.get('/volunteer/delivered', FoodDonationController.getMyVolunteerDeliveryHistory);
router.get('/:id/tracking', FoodDonationController.getReceiverTracking);
router.get('/:id/volunteer-delivery', FoodDonationController.getVolunteerDeliveryDetail);
router.get('/:id', FoodDonationController.getDonationById);
router.patch('/:id/connect', FoodDonationController.connectDonation);
router.patch('/:id/receiver-delivery-choice', FoodDonationController.chooseDeliveryByReceiver);
router.patch('/:id/self-pickup-complete', FoodDonationController.completeSelfPickupByReceiver);
router.patch('/:id/receiver-disconnect', FoodDonationController.disconnectByReceiver);
router.patch('/:id/report-no-show', FoodDonationController.reportVolunteerNoShow);
router.patch('/:id/accept', FoodDonationController.acceptDonation);
router.patch('/:id/reject', FoodDonationController.rejectDonation);
router.patch('/:id/pickup-start', FoodDonationController.startPickup);
router.patch('/:id/delivered', FoodDonationController.markDelivered);
router.patch('/:id/cancel', FoodDonationController.cancelDonation);
router.patch('/:id/release-receiver', FoodDonationController.releaseReceiver);
router.patch('/:id/release', FoodDonationController.releaseDonation);
router.patch('/:id/confirm-received', FoodDonationController.confirmDeliveryReceived);

module.exports = router;
