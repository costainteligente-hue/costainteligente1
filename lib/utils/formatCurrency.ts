/**
 * Format a number as MXN currency.
 * Examples:
 *   formatCurrency(4500)        → "$ 4,500 MXN"
 *   formatCurrency(1200.5)      → "$ 1,201 MXN"
 *   formatCurrency(8000, 'USD') → "$ 8,000 USD"
 */
export function formatCurrency(
  amount: number,
  currency: 'MXN' | 'USD' = 'MXN',
): string {
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currency}`;
}

/**
 * Calculate discounted price and round to 2 decimals.
 * Example: applyDiscount(4500, 15) → 3825.00
 */
export function applyDiscount(price: number, discountPercent: number): number {
  const discounted = price * (1 - discountPercent / 100);
  return Math.round(discounted * 100) / 100;
}

/**
 * Format price with discount shown as strikethrough label data.
 * Returns { original, discounted, savings }
 */
export function priceWithDiscount(
  price: number,
  discountPercent: number,
): { original: string; discounted: string; savings: string } {
  const discountedAmount = applyDiscount(price, discountPercent);
  return {
    original: formatCurrency(price),
    discounted: formatCurrency(discountedAmount),
    savings: formatCurrency(price - discountedAmount),
  };
}
