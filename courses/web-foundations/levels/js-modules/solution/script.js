export function formatReceipt(number) {
  return 'LAB-' + String(number).padStart(3, '0');
}
