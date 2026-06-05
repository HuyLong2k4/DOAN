import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { http } from '../../../src/api/http';
import { getOrCreateDonationConversation } from '../../../src/api/chat.api';
import { getMyStats } from '../../../src/api/user.api';
import { useAuthStore } from '../../../src/store/authStore';
import DonationPostCard from '../../../src/components/DonationPostCard';
import DonationHistoryCard from '../../../src/components/DonationHistoryCard';
import { roleUi } from '../../../src/theme/roleUi';
import { useI18n } from '@/src/i18n/useI18n';
import HomeHeader from '../../../src/components/HomeHeader';
import { getRewardLevel } from '../../../src/constants/rewardLevels';
import type {
  ApprovedReceiverRequest,
  DonorDonation,
  ReceiverBrief,
  ReceiverFoodRequest,
} from './_components/types';

const FAQS = [
  { q: 'Who will pick up the food?' },
  { q: 'Can we perform one-time donations?' },
];

export default function HomeScreen() {
  const router    = useRouter();
  const user      = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const points    = user?.points ?? 0;
  const { level } = getRewardLevel(points, 'DONOR');
  const { t }     = useI18n();

  const [activeTab, setActiveTab]         = useState<'my' | 'requests'>('my');
  const [openFaq, setOpenFaq]             = useState<number | null>(null);
  const [donations, setDonations]         = useState<DonorDonation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [openingChatDonationId, setOpeningChatDonationId] = useState<string | null>(null);
  const [receiverFoodRequests, setReceiverFoodRequests] = useState<ReceiverFoodRequest[]>([]);
  const [acceptingFoodRequestId, setAcceptingFoodRequestId] = useState<string | null>(null);
  const [cancellingDonationId, setCancellingDonationId] = useState<string | null>(null);
  const [releasingDonationId, setReleasingDonationId] = useState<string | null>(null);

  const isDonationOpen = (donation: DonorDonation) => {
    const normalizedStatus = String(donation.status || '').toUpperCase();
    return normalizedStatus !== 'COMPLETED' && normalizedStatus !== 'DELIVERED';
  };

  const approvedReceiverRequests = useMemo<ApprovedReceiverRequest[]>(() => {
    return donations
      .filter(isDonationOpen)
      .filter((d) => Boolean(d.selected_receiver_id))
      .map((d) => ({
        donationId: d._id,
        donationTitle: d.title,
        receiver: (d.selected_receiver_id as ReceiverBrief) || { _id: d._id, full_name: 'Receiver' },
        deliveryType: d.delivery_type || null,
      }));
  }, [donations]);

  const myPostDonations = useMemo(() => {
    return donations
      .filter((d) => {
        const status = String(d.status || '').toUpperCase();
        return status !== 'COMPLETED' && status !== 'DELIVERED' && status !== 'CANCELLED';
      })
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [donations]);

  // "Ủng hộ" = số đơn hoàn tất thành công (khớp cách backend đếm: status COMPLETED).
  const completedDonations = donations.filter(
    (d) => String(d.status || '').toUpperCase() === 'COMPLETED',
  ).length;

  const hasReceiverRequestsContent =
    receiverFoodRequests.length > 0 ||
    approvedReceiverRequests.length > 0;

  const handleCancelDonation = (donationId: string) => {
    Alert.alert(
      t('donor.cancel.confirmTitle'),
      t('donor.cancel.confirmMessage'),
      [
        { text: t('donor.cancel.confirmNo'), style: 'cancel' },
        {
          text: t('donor.cancel.confirmYes'),
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingDonationId(donationId);
              const res = await http.patch(`/food-donations/${donationId}/cancel`);
              setDonations((prev) =>
                prev.map((d) => (d._id === donationId ? { ...d, status: 'CANCELLED' } : d)),
              );
              Alert.alert(
                t('donor.cancel.successTitle'),
                res.data?.message || t('donor.cancel.successBody'),
              );
            } catch (err: any) {
              Alert.alert(
                t('donor.cancel.failedTitle'),
                err?.response?.data?.message || t('donor.cancel.failedBody'),
              );
            } finally {
              setCancellingDonationId(null);
            }
          },
        },
      ],
    );
  };

  const handleReleaseReceiver = (donationId: string) => {
    const donation = donations.find((it) => it._id === donationId);
    const isFromRequest = Boolean(donation?.from_food_request);

    const confirmTitle = isFromRequest
      ? t('donor.releaseReceiver.fromRequestConfirmTitle')
      : t('donor.releaseReceiver.confirmTitle');
    const confirmMessage = isFromRequest
      ? t('donor.releaseReceiver.fromRequestConfirmMessage')
      : t('donor.releaseReceiver.confirmMessage');
    const defaultSuccessBody = isFromRequest
      ? t('donor.releaseReceiver.fromRequestSuccessBody')
      : t('donor.releaseReceiver.successBody');

    Alert.alert(
      confirmTitle,
      confirmMessage,
      [
        { text: t('donor.releaseReceiver.confirmNo'), style: 'cancel' },
        {
          text: t('donor.releaseReceiver.confirmYes'),
          style: 'destructive',
          onPress: async () => {
            try {
              setReleasingDonationId(donationId);
              const res = await http.patch(`/food-donations/${donationId}/release-receiver`);
              const cameFromRequest = res.data?.from_food_request ?? isFromRequest;

              setDonations((prev) =>
                prev.map((d) => {
                  if (d._id !== donationId) return d;
                  if (cameFromRequest) {
                    // Donation huỷ hoàn toàn.
                    return {
                      ...d,
                      status: 'CANCELLED',
                      can_release_receiver: false,
                      release_state: 'finalized',
                    };
                  }
                  // Release receiver — donation về PENDING.
                  return {
                    ...d,
                    status: 'PENDING',
                    selected_receiver_id: null,
                    volunteer_id: null,
                    delivery_id: null,
                    delivery_type: null,
                    selected_at: null,
                    release_eligible_at: null,
                    can_release_receiver: false,
                    release_state: null,
                    pickup_code: null,
                    delivery_status: null,
                  };
                }),
              );
              Alert.alert(
                t('donor.releaseReceiver.successTitle'),
                res.data?.message || defaultSuccessBody,
              );
            } catch (err: any) {
              Alert.alert(
                t('donor.releaseReceiver.failedTitle'),
                err?.response?.data?.message || t('donor.cancel.failedBody'),
              );
            } finally {
              setReleasingDonationId(null);
            }
          },
        },
      ],
    );
  };

  const handleAcceptFoodRequest = async (requestId: string) => {
    try {
      setAcceptingFoodRequestId(requestId);
      const res = await http.patch(`/food-requests/${requestId}/accept`);
      const updatedRequest = res.data?.data || null;
      setReceiverFoodRequests((prev) =>
        prev.map((item) =>
          item._id === requestId
            ? {
                ...item,
                status: 'ACCEPTED',
                accepted_by_donor_id: (user as any)?.id || (user as any)?._id || null,
                linked_donation_id: updatedRequest?.linked_donation_id ?? item.linked_donation_id ?? null,
              }
            : item,
        ),
      );
      Alert.alert(t('donor.alert.acceptSuccessTitle'), res.data?.message || t('donor.alert.acceptSuccessBody'));
    } catch (err: any) {
      Alert.alert(t('donor.alert.acceptFailedTitle'), err?.response?.data?.message || t('donor.alert.acceptFailedBody'));
    } finally {
      setAcceptingFoodRequestId(null);
    }
  };

  const openVolunteerChat = async (donationId: string) => {
    try {
      setOpeningChatDonationId(donationId);
      const res = await getOrCreateDonationConversation(donationId, 'VOLUNTEER');
      const conversation = res.data?.data;

      if (!conversation?.id) {
        throw new Error(t('donor.alert.chatCreateFailed'));
      }

      router.push({
        pathname: '/(stack)/chat/[conversationId]',
        params: {
          conversationId: conversation.id,
          title: conversation.counterpart?.full_name || t('donor.chatTitleFallback'),
        },
      } as any);
    } catch (err: any) {
      Alert.alert(t('donor.alert.chatOpenFailedTitle'), err?.response?.data?.message || err?.message || t('donor.alert.chatOpenFailedBody'));
    } finally {
      setOpeningChatDonationId(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          setLoadingDonations(true);

          const [donationRes, requestRes, statsRes] = await Promise.all([
            http.get('/food-donations/my'),
            http.get('/food-requests'),
            getMyStats().catch(() => null),
          ]);

          if (!active) return;

          setDonations(donationRes.data.data ?? []);
          setReceiverFoodRequests(requestRes.data?.data ?? []);

          // Server cộng điểm cho donor khi receiver xác nhận đơn. user.points chỉ
          // set lúc login → đồng bộ lại điểm mới nhất để Stats row hiển thị đúng.
          const freshPoints = (statsRes?.data?.data as { points?: number } | undefined)?.points;
          const store = useAuthStore.getState();
          if (freshPoints != null && store.user && store.user.points !== freshPoints) {
            store.setUser({ ...store.user, points: freshPoints });
          }
        } catch { /* ignore */ }
        finally {
          if (active) {
            setLoadingDonations(false);
          }
        }
      })();
      return () => { active = false; };
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Header ── */}
        <HomeHeader
          greeting={t('donor.greeting')}
          firstName={firstName}
          rolePrefix={t('donor.rolePrefix')}
          roleLabel={t('donor.role')}
          containerStyle={styles.header}
        />

        {/* ── Badge ── */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: level.color + '22', borderColor: level.color + '55', borderWidth: 1 }]}>
            <Ionicons name={level.icon} size={13} color={level.color} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: level.color }]}>{level.title}</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <StatItem value={String(completedDonations)} label={t('donor.stats.donations')} />
          <StatItem value={String(points)} label={t('donor.stats.points')} />
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === 'my' && styles.tabActive]} onPress={() => setActiveTab('my')}>
            <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>{t('donor.tab.myPost')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'requests' && styles.tabActive]} onPress={() => setActiveTab('requests')}>
            <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>{t('donor.tab.requests')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tab Content ── */}
        {activeTab === 'my' ? (
          loadingDonations ? (
            <View style={styles.emptyCard}><ActivityIndicator color={c.primary} /></View>
          ) : myPostDonations.length > 0 ? (
            <View style={{ marginHorizontal: 18, marginTop: 1, marginBottom: 10 }}>
              {myPostDonations.map(d => (
                <DonationPostCard
                  key={d._id}
                  d={d}
                  onCancel={handleCancelDonation}
                  cancelling={cancellingDonationId === d._id}
                  onReleaseReceiver={handleReleaseReceiver}
                  releasing={releasingDonationId === d._id}
                />
              ))}
              <View style={styles.emptyCard}>
                <Text style={styles.emptyHint}>{t('donor.empty.promptDonate')}</Text>
                <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(stack)/DONOR/donate' as any)}>
                  <Text style={styles.createBtnText}>{t('donor.empty.createMoreDonation')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyHint}>{t('donor.empty.nothingYet')}</Text>
              <Text style={styles.emptyHint}>{t('donor.empty.promptDonate')}</Text>
              <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(stack)/DONOR/donate' as any)}>
                <Text style={styles.createBtnText}>{t('donor.empty.createDonationPost')}</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          loadingDonations ? (
            <View style={styles.emptyCard}><ActivityIndicator color={c.primary} /></View>
          ) : hasReceiverRequestsContent ? (
            <View style={styles.requestListWrap}>
              {receiverFoodRequests.length > 0 ? (
                <View style={styles.approvedSection}>
                  <Text style={styles.approvedSectionTitle}>{t('donor.receiverRequests.title')}</Text>
                  {receiverFoodRequests.map((req) => {
                    const receiver = typeof req.receiver_id === 'object' ? req.receiver_id : null;
                    const receiverName = receiver?.full_name || t('donor.receiverFallback');
                    const qty = `${req.requested_quantity ?? 0} ${req.unit || t('donor.portion')}`;
                    const neededBefore = req.needed_before
                      ? new Date(req.needed_before).toLocaleDateString('vi-VN')
                      : t('donor.notSpecified');
                    const accepting = acceptingFoodRequestId === req._id;
                    const isAccepted = req.status === 'ACCEPTED';
                    const linkedDonation = typeof req.linked_donation_id === 'object' ? req.linked_donation_id : null;

                    return (
                      <View key={`receiver-food-request:${req._id}`} style={styles.receiverReqCard}>
                        <View style={styles.receiverReqHead}>
                          <Ionicons
                            name={isAccepted ? 'checkmark-circle' : 'document-text-outline'}
                            size={22}
                            color={isAccepted ? c.successText : c.primaryStrong}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.receiverReqName}>{receiverName}</Text>
                            <Text style={styles.receiverReqSub} numberOfLines={1}>{t('donor.request.label')}: {req.title}</Text>
                            <Text style={styles.receiverReqSub}>{t('donor.qty.label')}: {qty}</Text>
                            <Text style={styles.receiverReqSub}>{t('donor.neededBefore.label')}: {neededBefore}</Text>
                          </View>
                          {isAccepted ? (
                            <View style={styles.acceptedBadge}>
                              <Text style={styles.acceptedBadgeText}>{t('donor.requestAccepted')}</Text>
                            </View>
                          ) : null}
                        </View>

                        {isAccepted ? (
                          linkedDonation?._id ? (
                            <TouchableOpacity
                              style={styles.viewDonationBtn}
                              onPress={() => setActiveTab('my')}
                            >
                              <Ionicons name="open-outline" size={16} color={c.primaryStrong} />
                              <Text style={styles.viewDonationBtnText}>{t('donor.viewDonation')}</Text>
                            </TouchableOpacity>
                          ) : null
                        ) : (
                          <TouchableOpacity
                            style={[styles.receiverAcceptFoodReqBtn, accepting && styles.actionBtnDisabled]}
                            disabled={accepting}
                            onPress={() => handleAcceptFoodRequest(req._id)}
                          >
                            <Ionicons name="checkmark-circle-outline" size={16} color={c.primaryStrong} />
                            <Text style={styles.receiverAcceptFoodReqBtnText}>
                              {accepting ? t('donor.accepting') : t('donor.accept')}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {approvedReceiverRequests.length > 0 ? (
                <View style={styles.approvedSection}>
                  <Text style={styles.approvedSectionTitle}>{t('donor.approvedRequestsTitle')}</Text>
                  {approvedReceiverRequests.map((req) => (
                    <View key={`approved:${req.donationId}:${req.receiver._id}`} style={styles.approvedReqCard}>
                      <View style={styles.receiverReqHead}>
                        <Ionicons name="checkmark-circle-outline" size={22} color={c.successText} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.receiverReqName}>{req.receiver.full_name || t('donor.receiverFallback')}</Text>
                          <Text style={styles.receiverReqSub} numberOfLines={1}>{t('donor.donationLabel')}: {req.donationTitle}</Text>
                        </View>
                        <View
                          style={[
                            styles.approvedBadge,
                            req.deliveryType === 'VIA_AGENT'
                              ? styles.approvedBadgeViaAgent
                              : req.deliveryType === 'SELF_PICKUP'
                                ? styles.approvedBadgeSelfPickup
                                : styles.approvedBadgeAwaiting,
                          ]}
                        >
                          <Text style={styles.approvedBadgeText}>
                            {req.deliveryType === 'VIA_AGENT'
                              ? t('donor.delivery.viaAgent')
                              : req.deliveryType === 'SELF_PICKUP'
                                ? t('donor.delivery.selfPickup')
                                : t('donor.delivery.awaitingChoice')}
                          </Text>
                        </View>
                      </View>

                      {req.deliveryType === 'VIA_AGENT' ? (
                        <TouchableOpacity
                          style={[styles.openVolunteerChatBtn, openingChatDonationId === req.donationId && styles.actionBtnDisabled]}
                          onPress={() => openVolunteerChat(req.donationId)}
                          disabled={openingChatDonationId === req.donationId}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={14} color={c.primaryStrong} />
                          <Text style={styles.openVolunteerChatBtnText}>
                            {openingChatDonationId === req.donationId ? t('donor.openingChat') : t('donor.chatWithVolunteer')}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : approvedReceiverRequests.length > 0 ? (
            <View style={styles.requestListWrap}>
              <View style={styles.approvedSection}>
                <Text style={styles.approvedSectionTitle}>{t('donor.approvedRequestsTitle')}</Text>
                {approvedReceiverRequests.map((req) => (
                  <View key={`approved:${req.donationId}:${req.receiver._id}`} style={styles.approvedReqCard}>
                    <View style={styles.receiverReqHead}>
                      <Ionicons name="checkmark-circle-outline" size={22} color={c.successText} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.receiverReqName}>{req.receiver.full_name || t('donor.receiverFallback')}</Text>
                        <Text style={styles.receiverReqSub} numberOfLines={1}>{t('donor.donationLabel')}: {req.donationTitle}</Text>
                      </View>
                      <View
                        style={[
                          styles.approvedBadge,
                          req.deliveryType === 'VIA_AGENT'
                            ? styles.approvedBadgeViaAgent
                            : req.deliveryType === 'SELF_PICKUP'
                              ? styles.approvedBadgeSelfPickup
                              : styles.approvedBadgeAwaiting,
                        ]}
                      >
                        <Text style={styles.approvedBadgeText}>
                          {req.deliveryType === 'VIA_AGENT'
                            ? t('donor.delivery.viaAgent')
                            : req.deliveryType === 'SELF_PICKUP'
                              ? t('donor.delivery.selfPickup')
                              : t('donor.delivery.awaitingChoice')}
                        </Text>
                      </View>
                    </View>

                    {req.deliveryType === 'VIA_AGENT' ? (
                      <TouchableOpacity
                        style={[styles.openVolunteerChatBtn, openingChatDonationId === req.donationId && styles.actionBtnDisabled]}
                        onPress={() => openVolunteerChat(req.donationId)}
                        disabled={openingChatDonationId === req.donationId}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color={c.primaryStrong} />
                        <Text style={styles.openVolunteerChatBtnText}>
                          {openingChatDonationId === req.donationId ? t('donor.openingChat') : t('donor.chatWithVolunteer')}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyGray}>{t('donor.noReceiverRequests')}</Text>
            </View>
          )
        )}

        {/* ── Donation History ── */}
        <View style={styles.containTitle}>
          <Text style={styles.title}>{t('donor.history.title')}</Text>
          <TouchableOpacity onPress={() => router.push('/(stack)/DONOR/historyDonation')}>
            <Text style={styles.detailView}>
              {t('donor.viewAll')}
            </Text>
          </TouchableOpacity>
        </View>
        {loadingDonations ? (
          <View style={styles.emptyCard}><ActivityIndicator color={c.primary} /></View>
        ) : donations.length === 0 ? (
          <View style={[styles.emptyCard, { marginBottom: 20 }]}>
            <Text style={styles.emptyGray}>{t('donor.noDonationsYet')}</Text>
          </View>
        ) : (
          donations.slice(0, 3).map(d => (
            <DonationHistoryCard key={d._id} d={d} />
          ))
        )}

        {/* ── FAQs ── */}
        <Text style={styles.sectionTitle}>{t('donor.faq.title')}</Text>
        {FAQS.map((_faq, i) => (
          <TouchableOpacity key={i} style={styles.faqItem} onPress={() => setOpenFaq(openFaq === i ? null : i)} activeOpacity={0.7}>
            <Text style={styles.faqQ}>{i === 0 ? t('donor.faq.pickup') : t('donor.faq.oneTime')}</Text>
            <Ionicons name={openFaq === i ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const c = roleUi.colors;
const r = roleUi.radius;

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: c.pageBg },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8 },
  badgeRow:        { paddingHorizontal: 18, marginBottom: 14 },
  badge:           { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:       { fontSize: 12, fontWeight: '700' },
  statsRow:        { flexDirection: 'row', marginHorizontal: 18, marginBottom: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: r.lg, paddingVertical: 12 },
  statItem:        { flex: 1, alignItems: 'center' },
  statValue:       { fontSize: 22, fontWeight: '700', color: '#111' },
  statLabel:       { fontSize: 10, color: '#888', textAlign: 'center', marginBottom: 2 },
  tabs:            { flexDirection: 'row', marginHorizontal: 18, marginBottom: 2, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  tab:             { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive:       { borderBottomWidth: 2, borderBottomColor: '#111' },
  tabText:         { fontSize: 14, color: '#999' },
  tabTextActive:   { color: '#111', fontWeight: '700' },
  requestListWrap: { marginHorizontal: 18, marginTop: 8, marginBottom: 16, gap: 10 },
  receiverReqCard: {
    backgroundColor: c.surface,
    borderRadius: r.lg,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  receiverReqHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  receiverReqName: { fontSize: 14, color: '#111', fontWeight: '700' },
  receiverReqSub: { fontSize: 12, color: '#666', marginTop: 2 },
  receiverReqActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  receiverRejectBtn: {
    flex: 1,
    backgroundColor: c.dangerSoft,
    borderRadius: r.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  receiverRejectBtnText: { color: c.dangerText, fontWeight: '700', fontSize: 13 },
  receiverApproveBtn: {
    flex: 1,
    backgroundColor: c.primarySoft,
    borderRadius: r.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  receiverApproveBtnText: { color: c.primaryStrong, fontWeight: '700', fontSize: 13 },
  receiverAcceptFoodReqBtn: {
    marginTop: 10,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: '#D5E0EC',
    backgroundColor: c.primarySoft,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  receiverAcceptFoodReqBtnText: { color: c.primaryStrong, fontWeight: '700', fontSize: 13 },
  actionBtnDisabled: { opacity: 0.6 },
  acceptedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: c.successSoft,
  },
  acceptedBadgeText: { color: c.successText, fontWeight: '700', fontSize: 10, letterSpacing: 0.3 },
  viewDonationBtn: {
    marginTop: 10,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: '#D5E0EC',
    backgroundColor: c.primarySoft,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  viewDonationBtnText: { color: c.primaryStrong, fontWeight: '700', fontSize: 13 },
  approvedSection: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  approvedSectionTitle: {
    fontSize: 13,
    color: '#111',
    fontWeight: '700',
    marginBottom: 8,
  },
  approvedReqCard: {
    backgroundColor: c.surface,
    borderRadius: r.lg,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  openVolunteerChatBtn: {
    marginTop: 10,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: '#D5E0EC',
    backgroundColor: c.primarySoft,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  openVolunteerChatBtnText: {
    color: c.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
  },
  approvedBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  approvedBadgeViaAgent: { backgroundColor: c.primarySoft },
  approvedBadgeSelfPickup: { backgroundColor: c.successSoft },
  approvedBadgeAwaiting: { backgroundColor: c.warningSoft },
  approvedBadgeText: { fontSize: 11, color: '#111', fontWeight: '700' },
  emptyCard:       { backgroundColor: c.surface, marginHorizontal: 18, marginTop: 1, padding: 28, alignItems: 'center', marginBottom: 20, borderRadius: r.lg, borderWidth: 1, borderColor: c.border },
  emptyGray:       { fontSize: 13, color: '#bbb', marginBottom: 8 },
  emptyHint:       { fontSize: 14, color: '#555', marginBottom: 16 },
  createBtn:       { backgroundColor: c.primary, borderRadius: r.sm, paddingVertical: 12, paddingHorizontal: 28 },
  createBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  containTitle:    { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', margin: 18 },
  title:           { fontSize: 16, fontWeight: 600},
  detailView:      { fontSize: 16, color: c.primary},
  sectionTitle:    { fontSize: 15, fontWeight: '700', color: '#111', paddingHorizontal: 18, marginTop: 8 },
  faqItem:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.surface, marginHorizontal: 18, marginBottom: 8, borderRadius: r.md, paddingHorizontal: 14, paddingVertical: 16, borderWidth: 1, borderColor: c.border },
  faqQ:            { fontSize: 14, color: '#111', flex: 1, marginRight: 8 },
});
