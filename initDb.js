const fs = require('fs');
const path = require('path');

const initialData = {
  users: [
    { id: '1', name: 'المدير', role: 'admin', username: 'admin', password: '123' },
    { id: '2', name: 'موظف', role: 'employee', username: 'user', password: '123' }
  ],
  clients: [
    {
      id: 'c1', code: 'CL-001', name: 'فواز', phone: '97525321', email: 'khaledzaben09@gmail.com', 
      project_name: 'villa', location: 'metla3', contract_date: '2025-02-20', start_date: '2025-02-20', 
      end_date: '2025-08-20', status: 'نشط', construction: true, offers: true, supervision: true, invoices: true, notes: ''
    }
  ],
  tasks: [
    {
      id: 't1', client_id: 'c1', service_type: 'أعمال البناء والإنشاء', description: 'بناء هيكل اسود', 
      assignee: 'احمد السوري', start_date: '2025-03-10', expected_end_date: '2025-05-08', actual_end_date: '', 
      progress: 0, status: 'جارية', priority: 'عالية', delay_days: 0, notes: ''
    }
  ],
  offers: [
    {
      id: 'o1', request_code: 'PR-001', client_id: 'c1', service_type: 'الإشراف الهندسي', description: '', 
      company_name: 'شركة الخليج للإنشاءات', offer_no: '1', receive_date: '2025-03-10', offer_value: 1500, 
      validity_date: '2025-04-10', status: 'مختار', is_selected: true, price_diff: 0, notes: ''
    }
  ],
  supervision: [
    {
      id: 's1', client_id: 'c1', project_name: '', contract_type: 'شهري', contract_value: 150, 
      start_date: '2025-03-10', free_months: 3, calc_start_date: '2025-06-10', end_date: '', daily_rate: 5, 
      pause_days: 0, remaining_free: 0, billed_days: 5, due_fees: 25, collected_fees: 0, remaining_fees: 25, 
      status: 'نشط', notes: ''
    }
  ],
  invoices: [
    {
      id: 'i1', invoice_no: '1', client_id: 'c1', issue_date: '2025-05-20', due_date: '2025-06-09', 
      service_type: 'أعمال البناء والإنشاء', service_description: '', amount: 50, status: 'معلقة', 
      payment_date: '', delay_days: 4, notes: '', file_url: ''
    }
  ],
  settings: {
    service_types: ['أعمال البناء والإنشاء', 'الإشراف الهندسي', 'التصميم المعماري', 'التصميم الداخلي', 'الاستشارات الهندسية', 'إدارة المشاريع', 'المساحة والرفع', 'رسومات تنفيذية', 'دراسات جدوى', 'رخصة بناء', 'تصريح تعديلات', 'خريطة موقع', 'رفع حدودي', 'اعتماد مخطط', 'شهادة إتمام', 'معاملة بلدية', 'معاملة وزارية', 'وثائق قانونية'],
    task_statuses: ['لم تبدأ', 'جارية', 'منجزة', 'متأخرة', 'موقوفة', 'ملغاة'],
    priorities: ['عاجلة جداً', 'عالية', 'متوسطة', 'منخفضة'],
    supervision_statuses: ['نشط', 'موقوف', 'منتهي', 'ملغي'],
    contract_types: ['يومي', 'شهري', 'ربع سنوي', 'سنوي', 'مبلغ ثابت'],
    offer_statuses: ['قيد الدراسة', 'مختار', 'مرفوض', 'انتهت الصلاحية'],
    invoice_statuses: ['معلقة', 'مدفوعة', 'متأخرة', 'جزئياً', 'ملغاة'],
    client_statuses: ['نشط', 'منتهي', 'موقوف', 'مرتقب'],
    companies: ['شركة الخليج للإنشاءات', 'مكتب النور الهندسي', 'شركة الإتقان للمقاولات', 'مجموعة التطوير العمراني', 'مؤسسة البناء الحديث', 'شركة الريادة التقنية', 'مكتب الدقة للاستشارات', 'مؤسسة الأمانة للمقاولات', 'شركة الجودة للتشطيبات', 'أخرى 1', 'أخرى 2', 'أخرى 3']
  }
};

fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(initialData, null, 2), 'utf-8');
console.log('Database initialized successfully.');
