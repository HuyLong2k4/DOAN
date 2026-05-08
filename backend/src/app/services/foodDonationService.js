/**
 * FoodDonationService — facade giữ tương thích với code cũ.
 *
 * Logic thật được tách thành các module nhỏ trong `./foodDonation/`:
 *   - donorActions.js      — createDonation, cancelDonationByDonor
 *   - receiverActions.js   — connect, chooseDelivery, completeSelfPickup
 *   - volunteerActions.js  — accept/reject/release, startPickup, completeDelivery
 *   - queries.js           — getDonations, getMyDonations, tracking, available volunteers, summaries
 *   - receiverConfirm.js   — confirmDeliveryReceived (sau AWAITING_CONFIRMATION)
 *   - maintenance.js       — cron expire + auto-confirm
 *   - pickupCode.js        — sinh + verify pickup_code
 *   - locationFilter.js    — filter donor theo bán kính (dùng bởi foodRequestService)
 *   - distance.js          — Haversine + Google Distance Matrix
 *   - points.js            — cộng điểm donor/volunteer
 */

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

    // ── Receiver ──────────────────────────────────────────────────────────
    static connectDonationByReceiver(donationId, receiverId) {
        return receiverActions.connectDonationByReceiver(donationId, receiverId);
    }
    static chooseDeliveryByReceiver(donationId, receiverId, deliveryType, preferredVolunteerId) {
        return receiverActions.chooseDeliveryByReceiver(donationId, receiverId, deliveryType, preferredVolunteerId);
    }
    static completeSelfPickupByReceiver(donationId, receiverId) {
        return receiverActions.completeSelfPickupByReceiver(donationId, receiverId);
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
    static getMyDonations(donorId) {
        return queries.getMyDonations(donorId);
    }
    static getVolunteerSummary(volunteerId) {
        return queries.getVolunteerSummary(volunteerId);
    }
    static getMyVolunteerDeliveries(volunteerId) {
        return queries.getMyVolunteerDeliveries(volunteerId);
    }
    static getAvailableVolunteersForDonation(donationId, receiverId, limit) {
        return queries.getAvailableVolunteersForDonation(donationId, receiverId, limit);
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
}

module.exports = FoodDonationService;
