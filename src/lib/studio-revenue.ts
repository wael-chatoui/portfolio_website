type RevenueRecord = { kind: string; data: Record<string, string> };

export function revenueTotals(records: RevenueRecord[]) {
  let income = 0; let declared = 0;
  for (const { kind, data } of records) {
    if (kind !== 'invoice' || data.paymentUnconfirmed === 'yes' || !['Payé', 'Encaissé'].includes(data.status)) continue;
    const amount = (data.amount || '').match(/^(\d{1,9})(?:[.,](\d{1,2}))?$/);
    if (!amount) continue;
    const cents = Number(amount[1]) * 100 + Number((amount[2] || '').padEnd(2, '0'));
    income += cents;
    if (data.declared === 'yes') declared += cents;
  }
  return { income, declared };
}
