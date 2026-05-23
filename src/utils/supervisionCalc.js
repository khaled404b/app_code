import { differenceInDays, addMonths, parseISO, isAfter, isBefore } from 'date-fns';

export const calculateSupervisionStats = (proj) => {
  if (!proj) return null;

  const today = new Date();
  const billingType = proj.billing_type || 'supervision';
  const endDateStr = proj.end_date;

  if (billingType === 'fixed_installments') {
    const installments = proj.installments || [];
    const totalDue = installments.reduce((acc, inst) => acc + parseFloat(inst.amount || 0), 0);
    const collectedAmount = installments
      .filter(inst => inst.is_paid)
      .reduce((acc, inst) => acc + parseFloat(inst.amount || 0), 0);
    const remaining = Math.max(0, totalDue - collectedAmount);

    return {
      billingType,
      dailyRate: 0,
      startBillingDate: proj.start_date ? parseISO(proj.start_date) : today,
      billingDays: 0,
      totalDue,
      remaining,
      collectedAmount,
      isExpired: endDateStr ? isAfter(today, parseISO(endDateStr)) : false
    };
  }

  // Default: supervision
  const startDate = parseISO(proj.start_date);
  const freeMonths = parseInt(proj.free_months || 0);
  const contractValue = parseFloat(proj.contract_value || 0);
  const suspensionDays = parseInt(proj.suspension_days || 0);
  const collectedAmount = parseFloat(proj.collected_amount || 0);

  // 1. Daily Rate (based on 30 days)
  const dailyRate = contractValue / 30;

  // 2. Start Billing Date
  const startBillingDate = addMonths(startDate, freeMonths);

  // 3. Current Billing Days
  let billingDays = 0;
  if (!isBefore(today, startBillingDate)) {
    const calculationEndDate = endDateStr ? parseISO(endDateStr) : today;
    const effectiveEndDate = isAfter(today, calculationEndDate) ? calculationEndDate : today;
    
    const activeDays = differenceInDays(effectiveEndDate, startBillingDate);
    const rawDays = activeDays - suspensionDays;
    
    if (rawDays >= 0) {
      // الدفع مقدم: بمجرد بدء فترة 30 يوماً، يتم احتسابها كاملة (30 يوماً)
      billingDays = Math.floor(rawDays / 30) * 30 + 30;
    }
  }

  // 4. Financials
  const totalDue = billingDays * dailyRate;
  const remaining = totalDue - collectedAmount;

  return {
    billingType,
    dailyRate,
    startBillingDate,
    billingDays,
    totalDue,
    remaining,
    isExpired: endDateStr ? isAfter(today, parseISO(endDateStr)) : false
  };
};
