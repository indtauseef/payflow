export function amountToPaise(value) {
  const text = String(value ?? '').trim();
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(text)) return null;
  const [rupees, fraction = ''] = text.split('.');
  const paise = Number(rupees) * 100 + Number((fraction + '00').slice(0, 2));
  if (!Number.isSafeInteger(paise) || paise < 100 || paise > 10_000_000) return null;
  return paise;
}

export function formatUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}
