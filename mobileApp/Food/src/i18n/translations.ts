import type { AppLanguage } from '../store/languageStore';
import { type AuthKey, authEn, authVi } from './keys/auth';
import { type DonorKey, donorEn, donorVi } from './keys/donor';
import { type ReceiverKey, receiverEn, receiverVi } from './keys/receiver';
import { type VolunteerKey, volunteerEn, volunteerVi } from './keys/volunteer';
import { type TrackingKey, trackingEn, trackingVi } from './keys/tracking';
import { type FeedbackKey, feedbackEn, feedbackVi } from './keys/feedback';
import { type ChatKey, chatEn, chatVi } from './keys/chat';
import { type RewardsKey, rewardsEn, rewardsVi } from './keys/rewards';
import { type RequestKey, requestEn, requestVi } from './keys/request';
import { type ListsKey, listsEn, listsVi } from './keys/lists';
import { type CommonKey, commonEn, commonVi } from './keys/common';

/**
 * TranslationKey aggregates all per-namespace keys.
 * Keys are split into ./keys/<namespace>.ts to keep this file small.
 */
export type TranslationKey =
  | AuthKey
  | DonorKey
  | ReceiverKey
  | VolunteerKey
  | TrackingKey
  | FeedbackKey
  | ChatKey
  | RewardsKey
  | RequestKey
  | ListsKey
  | CommonKey;

const en: Record<TranslationKey, string> = {
  ...authEn,
  ...donorEn,
  ...receiverEn,
  ...volunteerEn,
  ...trackingEn,
  ...feedbackEn,
  ...chatEn,
  ...rewardsEn,
  ...requestEn,
  ...listsEn,
  ...commonEn,
};

const vi: Record<TranslationKey, string> = {
  ...authVi,
  ...donorVi,
  ...receiverVi,
  ...volunteerVi,
  ...trackingVi,
  ...feedbackVi,
  ...chatVi,
  ...rewardsVi,
  ...requestVi,
  ...listsVi,
  ...commonVi,
};

const dictionaries: Record<AppLanguage, Record<TranslationKey, string>> = {
  en,
  vi,
};

export function translate(language: AppLanguage, key: TranslationKey): string {
  return dictionaries[language][key] || key;
}
