export type FinanceInput = {
  income: number | null;
  livingCost: number | null;
  existingDebt: number | null;
  newPayment: number | null;
  loanAmount: number | null;
  propertyValue: number | null;
};

export type RuleConfig = {
  version: string;
  ltvMax: number;
  dsrMax: number;
  dtiMax: number;
  minRemaining: number;
};

export type MetricResult = {
  value: number | null;
  formula: string;
  threshold: number | null;
  result: "pass" | "fail" | "insufficient_data";
  reason: string;
};

export const defaultRules: RuleConfig = {
  version: "Quy tắc v1.0",
  ltvMax: 0.7,
  dsrMax: 0.5,
  dtiMax: 0.4,
  minRemaining: 0,
};

const ratio = (value: number | null, base: number | null, threshold: number, formula: string): MetricResult => {
  if (value === null || base === null || base <= 0) {
    return { value: null, formula, threshold, result: "insufficient_data", reason: "Chưa đủ dữ liệu hoặc mẫu số không hợp lệ." };
  }
  const result = value / base;
  return {
    value: result,
    formula,
    threshold,
    result: result <= threshold ? "pass" : "fail",
    reason: result <= threshold ? "Trong ngưỡng cho phép." : "Vượt ngưỡng cho phép.",
  };
};

export function calculateFinance(input: FinanceInput, rules: RuleConfig = defaultRules) {
  const remaining = input.income === null || input.livingCost === null || input.existingDebt === null || input.newPayment === null
    ? { value: null, formula: "I − C − D − A", threshold: rules.minRemaining, result: "insufficient_data" as const, reason: "Chưa đủ dữ liệu để tính số tiền còn lại." }
    : {
        value: input.income - input.livingCost - input.existingDebt - input.newPayment,
        formula: "I − C − D − A",
        threshold: rules.minRemaining,
        result: input.income - input.livingCost - input.existingDebt - input.newPayment >= rules.minRemaining ? "pass" as const : "fail" as const,
        reason: input.income - input.livingCost - input.existingDebt - input.newPayment >= rules.minRemaining ? "Đạt mức còn lại tối thiểu." : "Thấp hơn mức còn lại tối thiểu.",
      };

  return {
    ltv: ratio(input.loanAmount, input.propertyValue, rules.ltvMax, "P / V"),
    dsr: ratio(input.existingDebt !== null && input.newPayment !== null ? input.existingDebt + input.newPayment : null, input.income, rules.dsrMax, "(D + A) / I"),
    dti: ratio(input.existingDebt, input.income, rules.dtiMax, "D / I"),
    remaining,
    ruleVersion: rules.version,
  };
}

export function calculateMonthlyPayment(principal: number, annualRate: number, months: number) {
  if (!principal || !months) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (!monthlyRate) return principal / months;
  return (principal * monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
}
