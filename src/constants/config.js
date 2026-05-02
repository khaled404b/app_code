export const STATUS_CFG = {
  INVOICES: {
    'مدفوعة': { color: '#059669', bg: '#ecfdf5', badge: 'badge-green' },
    'معلقة':  { color: '#d97706', bg: '#fffbeb', badge: 'badge-orange' },
    'متأخرة': { color: '#dc2626', bg: '#fef2f2', badge: 'badge-red' },
  },
  TASKS: {
    'متأخرة':      { color: '#dc2626', bg: '#fef2f2', badge: 'badge-red', priority: 1 },
    'جارية':       { color: '#2563eb', bg: '#eff6ff', badge: 'badge-blue', priority: 2 },
    'معلقة':       { color: '#d97706', bg: '#fffbeb', badge: 'badge-orange', priority: 3 },
    'منجزة':       { color: '#059669', bg: '#ecfdf5', badge: 'badge-green', priority: 4 },
  }
};

export const SERVICES_DEFAULT = [
  'تصميم معماري', 
  'إشراف هندسي', 
  'رفع مساحي', 
  'استشارات هندسية', 
  'تقرير فني', 
  'أخرى'
];
