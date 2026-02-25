export const formatMoney = (amountInMinor, currency) => {
  if (!currency) return String(amountInMinor);

  const value = amountInMinor / Math.pow(10, currency.decimal_places);

  const formatted = new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: currency.decimal_places,
    maximumFractionDigits: currency.decimal_places,
  }).format(Math.abs(value));

  const sign = amountInMinor < 0 ? "-" : "";

  return currency.symbol_position === "before"
    ? `${sign}${currency.symbol}${formatted}`
    : `${sign}${formatted}${currency.symbol}`;
};

// 축약 포맷 (차트용)
export const formatMoneyShort = (amountInMinor, currency) => {
  if (!currency) return String(amountInMinor);

  const value = Math.abs(amountInMinor) / Math.pow(10, currency.decimal_places);
  const sign = amountInMinor < 0 ? "-" : "";

  let display;
  if (value >= 100000000) display = (value / 100000000).toFixed(1) + "억";
  else if (value >= 10000 && currency.decimal_places === 0)
    display = (value / 10000).toFixed(0) + "만";
  else if (value >= 1000000) display = (value / 1000000).toFixed(1) + "M";
  else if (value >= 1000) display = (value / 1000).toFixed(1) + "K";
  else display = value.toLocaleString(currency.locale);

  return `${sign}${currency.symbol}${display}`;
};

// 사용자 입력 → 최소 단위 정수 변환
export const toMinorUnit = (displayValue, decimalPlaces) => {
  const num = parseFloat(displayValue) || 0;
  return Math.round(num * Math.pow(10, decimalPlaces));
};

// 최소 단위 정수 → 표시용 숫자 변환
export const toDisplayValue = (minorUnit, decimalPlaces) => {
  return (minorUnit / Math.pow(10, decimalPlaces)).toFixed(decimalPlaces);
};
