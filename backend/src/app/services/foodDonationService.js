const donorActions = require('./foodDonation/donorActions');
const receiverActions = require('./foodDonation/receiverActions');
const volunteerActions = require('./foodDonation/volunteerActions');
const queries = require('./foodDonation/queries');
const receiverConfirm = require('./foodDonation/receiverConfirm');
const maintenance = require('./foodDonation/maintenance');

class FoodDonationService {
    // ── Donor ─────────────────────────────────────────────────────────────
    static createDonation(donorId, data) {
        return donorActions.createDonation(donorId, data);
    }
    static cancelDonationByDonor(donationId, donorId) {
        return donorActions.cancelDonationByDonor(donationId, donorId);
    }
    static releaseReceiverByDonor(donationId, donorId) {
        return donorActions.releaseReceiverByDonor(donationId, donorId);
    }

    // ── Receiver ──────────────────────────────────────────────────────────
    static connectDonationByReceiver(donationId, receiverId) {
        return receiverActions.connectDonationByReceiver(donationId, receiverId);
    }
    static chooseDeliveryByReceiver(donationId, receiverId, deliveryType) {
        return receiverActions.chooseDeliveryByReceiver(donationId, receiverId, deliveryType);
    }
    static completeSelfPickupByReceiver(donationId, receiverId, pickupCode) {
        return receiverActions.completeSelfPickupByReceiver(donationId, receiverId, pickupCode);
    }
    static disconnectDonationByReceiver(donationId, receiverId) {
        return receiverActions.disconnectDonationByReceiver(donationId, receiverId);
    }
    static reportVolunteerNoShow(donationId, receiverId) {
        return receiverActions.reportVolunteerNoShow(donationId, receiverId);
    }
    static confirmDeliveryReceived(donationId, receiverId) {
        return receiverConfirm.confirmDeliveryReceived(donationId, receiverId);
    }

    // ── Volunteer ─────────────────────────────────────────────────────────
    static acceptDonationByVolunteer(donationId, volunteerId) {
        return volunteerActions.acceptDonationByVolunteer(donationId, volunteerId);
    }
    static rejectDonationByVolunteer(donationId, volunteerId) {
        return volunteerActions.rejectDonationByVolunteer(donationId, volunteerId);
    }
    static releaseDonationByVolunteer(donationId, volunteerId) {
        return volunteerActions.releaseDonationByVolunteer(donationId, volunteerId);
    }
    static startPickupByVolunteer(donationId, volunteerId, pickupCode) {
        return volunteerActions.startPickupByVolunteer(donationId, volunteerId, pickupCode);
    }
    static completeDeliveryByVolunteer(donationId, volunteerId) {
        return volunteerActions.completeDeliveryByVolunteer(donationId, volunteerId);
    }

    // ── Queries ───────────────────────────────────────────────────────────
    static getDonations(viewer, filter) {
        return queries.getDonations(viewer, filter);
    }
    static getDonationById(donationId, viewer) {
        return queries.getDonationById(donationId, viewer);
    }
    static getMyDonations(donorId) {
        return queries.getMyDonations(donorId);
    }
    static getVolunteerSummary(volunteerId) {
        return queries.getVolunteerSummary(volunteerId);
    }
    static getMyVolunteerDeliveries(volunteerId) {
        return queries.getMyVolunteerDeliveries(volunteerId);
    }
    static getReceiverTracking(donationId, receiverId) {
        return queries.getReceiverTracking(donationId, receiverId);
    }

    // ── Cron tasks ────────────────────────────────────────────────────────
    static expireOverdueDonations() {
        return maintenance.expireOverdueDonations();
    }
    static autoConfirmStaleDeliveries(timeoutHours) {
        return maintenance.autoConfirmStaleDeliveries(timeoutHours);
    }
    static cancelStaleOnTheWayDeliveries(timeoutHours) {
        return maintenance.cancelStaleOnTheWayDeliveries(timeoutHours);
    }
}

module.exports = FoodDonationService;
