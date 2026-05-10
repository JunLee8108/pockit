// hex 색의 상대 명도를 계산해 흰색/검정 글씨를 자동 선택
// W3C WCAG: https://www.w3.org/TR/WCAG20/#relativeluminancedef

const hexToRgb = (hex) => {
  if (!hex) return null;
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return { r, g, b };
};

const channelLuminance = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

export const getReadableTextColor = (
  bgHex,
  { dark = "#0c0c0c", light = "#ffffff" } = {},
) => {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return light;
  const L =
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b);
  // 임계값 0.55 — 중간 채도 색에서도 읽기 편하도록 흰글씨 쪽으로 약간 보수적
  return L > 0.55 ? dark : light;
};
