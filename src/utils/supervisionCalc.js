import { differenceInDays, addMonths, parseISO, isAfter, min, max } from 'date-fns';

export const calculateSupervisionStats = (proj) => {
  if (!proj) return null;

  const today = new Date();
  const startDate = parseISO(proj.start_date);
  const freeMonths = parseInt(proj.free_months || 0);
  const contractValue = parseFloat(proj.contract_value || 0);
  const suspensionDays = parseInt(proj.suspension_days || 0);
  const collectedAmount = parseFloat(proj.collected_amount || 0);
  const endDateStr = proj.end_date;

  // 1. Daily Rate (based on 30 days)
  const dailyRate = contractValue / 30;

  // 2. Start Billing Date
  const startBillingDate = addMonths(startDate, freeMonths);

  // 3. Current Billing Days
  let billingDays = 0;
  if (isAfter(today, startBillingDate)) {
    const calculationEndDate = endDateStr ? parseISO(endDateStr) : today;
    const effectiveEndDate = isAfter(today, calculationEndDate) ? calculationEndDate : today;
    
    const rawDays = differenceInDays(effectiveEndDate, startBillingDate);
    billingDays = Math.max(0, rawDays - suspensionDays);
  }

  // 4. Financials
  const totalDue = billingDays * dailyRate;
  const remaining = totalDue - collectedAmount;

  return {
    dailyRate,
    startBillingDate,
    billingDays,
    totalDue,
    remaining,
    isExpired: endDateStr ? isAfter(today, parseISO(endDateStr)) : false
  };
};
