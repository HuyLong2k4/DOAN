import type { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface RewardLevel {
  title: string;
  min: number;
  max: number;
  icon: IoniconName;
  color: string;
}

export type RewardRole = 'DONOR' | 'VOLUNTEER';

export const DONOR_LEVELS: RewardLevel[] = [
  { title: 'New Donor',    min: 0,    max: 99,       icon: 'leaf-outline',   color: '#9E9E9E' },
  { title: 'Bronze Donor', min: 100,  max: 299,      icon: 'medal-outline',  color: '#CD7F32' },
  { title: 'Silver Donor', min: 300,  max: 699,      icon: 'medal-outline',  color: '#A8A8A8' },
  { title: 'Gold Donor',   min: 700,  max: 1499,     icon: 'medal-outline',  color: '#FFD700' },
  { title: 'Super Donor',  min: 1500, max: 2999,     icon: 'star-outline',   color: '#FF8C00' },
  { title: 'Legend Donor', min: 3000, max: Infinity, icon: 'trophy-outline', color: '#7B2FF7' },
];

export const VOLUNTEER_LEVELS: RewardLevel[] = [
  { title: 'New Helper',     min: 0,    max: 99,       icon: 'leaf-outline',         color: '#9E9E9E' },
  { title: 'Active Helper',  min: 100,  max: 299,      icon: 'bicycle-outline',      color: '#4CAF50' },
  { title: 'Trusted Helper', min: 300,  max: 699,      icon: 'shield-checkmark-outline', color: '#008080' },
  { title: 'Hero',           min: 700,  max: 1499,     icon: 'flash-outline',        color: '#FF8C00' },
  { title: 'Champion',       min: 1500, max: 2999,     icon: 'ribbon-outline',       color: '#E91E63' },
  { title: 'Legend Helper',  min: 3000, max: Infinity, icon: 'trophy-outline',       color: '#7B2FF7' },
];

export function getLevelsForRole(role: RewardRole | string | undefined): RewardLevel[] {
  return role === 'VOLUNTEER' ? VOLUNTEER_LEVELS : DONOR_LEVELS;
}

export function getRewardLevel(
  points: number,
  role: RewardRole | string | undefined
): { level: RewardLevel; index: number; levels: RewardLevel[] } {
  const levels = getLevelsForRole(role);
  for (let i = levels.length - 1; i >= 0; i -= 1) {
    if (points >= levels[i].min) return { level: levels[i], index: i, levels };
  }
  return { level: levels[0], index: 0, levels };
}
