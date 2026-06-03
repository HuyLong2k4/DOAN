/**
 * Bảng màu ngữ nghĩa của app — neo quanh màu chủ đạo #008080.
 * Tông trầm (low-saturation) cho cảm giác sạch, thống nhất. Mỗi ý nghĩa đúng 1 màu:
 * dùng token ở đây thay vì hardcode hex để giữ giao diện đồng bộ.
 */
export const roleUi = {
  colors: {
    // ── Trung tính ─────────────────────────────────────────────
    pageBg: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceAlt: '#FAFAFA',
    border: '#E6E6E6',
    divider: '#E0E0E0',
    textPrimary: '#111111',
    textSecondary: '#666666',
    textMuted: '#8A8A8A',

    // ── Chủ đạo (primary) ──────────────────────────────────────
    primary: '#008080',
    primaryStrong: '#006666',
    primarySoft: '#E0F2F1',

    // ── Thành công (success) — xanh trầm, hơi ngả teal ─────────
    success: '#4C8463',
    successText: '#2F6B47',
    successSoft: '#E7F0EA',

    // ── Chờ/cảnh báo (warning) — hổ phách trầm ─────────────────
    warning: '#B5853C',
    warningText: '#8A6320',
    warningSoft: '#F3ECDA',

    // ── Lỗi/nguy hiểm (danger) — đỏ gạch trầm ──────────────────
    danger: '#BD5B52',
    dangerText: '#A1453E',
    dangerSoft: '#F4E7E5',

    // ── Thông tin (info) — lam xám trầm ────────────────────────
    info: '#4A7299',
    infoSoft: '#E6EBF1',
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 10,
    full: 999,
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 10,
    md: 12,
    lg: 18,
    xl: 24,
  },
};
