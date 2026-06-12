export function formatCurrency(amount: string): string {
  return `$${parseFloat(amount).toFixed(2)}`
}
