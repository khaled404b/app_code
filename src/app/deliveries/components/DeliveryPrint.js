import React from 'react';

export function DeliveryPrint({ data }) {
  if (!data) return null;

  const isChecked = (group, label) => {
    if (!data[group]) return false;
    const map = {
      'وثائق / سندات': 'وثائق و سندات',
      'وثائق/سندات': 'وثائق و سندات',
      'رسومات / مخططات': 'رسومات و مخططات',
      'رسومات/مخططات': 'رسومات و مخططات',
      'جدول كميات / مواصفات': 'جدول كميات و مواصفات',
      'جدول كميات/مواصفات': 'جدول كميات و مواصفات',
      'المهندس / الاستشاري': 'المهندس و الاستشاري',
      'المقاول / الشركة / جهة أخرى': 'المقاول و الشركة و جهة أخرى',
      'المقاول/الشركة/جهة أخرى': 'المقاول و الشركة و جهة أخرى',
      'نسخة إلكترونية (CD/DVD)': 'نسخة إلكترونية'
    };
    const dbKey = map[label] || label;
    return !!data[group][dbKey];
  };

  return (
    <div id="delivery-print-template" style={{ 
      display: 'none',
      width: '210mm', 
      height: '297mm', 
      padding: '5mm', 
      background: 'white', 
      direction: 'rtl', 
      fontFamily: 'Arial, sans-serif',
      fontSize: '9.5px', 
      color: '#000',
      lineHeight: '1.2',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <style>{`
        .p-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: -1px; }
        .p-table th, .p-table td { border: 0.5px solid #666; padding: 4px 6px; text-align: right; overflow: hidden; }
        .p-header-box { border: 1px solid #000; padding: 6px; margin-bottom: 5px; }
        .p-label { font-weight: bold; background: #efefef; width: 90px; font-size: 9px; }
        .p-checkbox-box { width: 11px; height: 11px; border: 1px solid #000; display: inline-block; margin-left: 5px; vertical-align: middle; position: relative; background: #fff; }
        .p-checkbox-checked::after { content: '✔'; position: absolute; top: -5px; left: 1px; font-size: 10px; color: #000; }
        .p-section-title { background: #cccccc; font-weight: bold; text-align: center; border: 1px solid #666; padding: 3px; font-size: 11px; }
        .p-signature-area { height: 75px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
        .p-signature-img { max-height: 95%; max-width: 95%; object-fit: contain; }
        .p-center { text-align: center !important; }
        .p-bold { font-weight: bold; }
        .p-small { font-size: 8px; }
      `}</style>

      {/* Header */}
      <div className="p-header-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '80px', textAlign: 'center' }}>
            <img src="/favicon.ico" style={{ width: '30px' }} />
            <div style={{ fontSize: '8px', fontWeight: 'bold' }}>FRAME</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>فريم للإستشارات الهندسية</h1>
            <div style={{ borderTop: '1.5px solid #000', marginTop: '4px', paddingTop: '4px', fontWeight: 'bold', fontSize: '13px' }}>نموذج إرسال المستندات</div>
          </div>
          <div style={{ width: '80px' }}></div>
        </div>
      </div>

      {/* Project Info Section */}
      <table className="p-table">
        <tbody>
          <tr>
            <td className="p-label">اسم المشروع:</td>
            <td colSpan="7" className="p-bold" style={{ fontSize: '10.5px' }}>{data.project_name}</td>
          </tr>
          <tr>
            <td className="p-label">رقم العقد:</td>
            <td colSpan="3">{data.contract_no}</td>
            <td className="p-label">رقم المشروع:</td>
            <td colSpan="3">{data.project_no}</td>
          </tr>
          <tr>
            <td className="p-label">إلى:</td>
            <td colSpan="3">{data.to}</td>
            <td className="p-label">رقم الإرسال:</td>
            <td colSpan="3">{data.transmittal_no}</td>
          </tr>
          <tr>
            <td className="p-label">من:</td>
            <td colSpan="3">{data.from}</td>
            <td className="p-label">رقم المراجعة:</td>
            <td colSpan="3">{data.ref_no}</td>
          </tr>
          <tr>
            <td className="p-label">عناية:</td>
            <td colSpan="3">{data.attn}</td>
            <td className="p-label">التاريخ:</td>
            <td colSpan="3">{data.date}</td>
          </tr>
          <tr>
            <td className="p-label">الموضوع:</td>
            <td colSpan="3">{data.subject}</td>
            <td className="p-label">مرجع العميل:</td>
            <td colSpan="3">{data.client_ref}</td>
          </tr>
        </tbody>
      </table>

      {/* Checklist Area - New Order: Attachments, Purpose, Action Taken */}
      <div style={{ display: 'flex', marginTop: '5px' }}>
        {/* 1. Attachments */}
        <div style={{ flex: 1, borderLeft: '0.5px solid #666' }}>
          <table className="p-table">
            <thead>
              <tr style={{ background: '#efefef' }}>
                <th className="p-center">المرفقات</th>
                <th className="p-center" style={{ width: '35px' }}></th>
              </tr>
            </thead>
            <tbody>
              {[
                'وثائق / سندات', 'رسومات / مخططات', 'تقارير', 
                'أمر تغيير', 'خطاب', 'فاتورة', 
                'جدول كميات / مواصفات', 'نسخة إلكترونية (CD/DVD)'
              ].map(key => (
                <tr key={key} style={{ height: '17px' }}>
                  <td className="p-small">{key}</td>
                  <td className="p-center">
                    <div className={`p-checkbox-box ${isChecked('attachments', key) ? 'p-checkbox-checked' : ''}`} />
                  </td>
                </tr>
              ))}
              <tr style={{ height: '40px' }}>
                <td className="p-bold p-small" style={{ background: '#efefef', verticalAlign: 'middle' }}>طريقة الإرسال:</td>
                <td className="p-center" style={{ verticalAlign: 'middle' }}>
                   <div style={{ fontSize: '8px', fontWeight: 'bold' }}>مرفق مع هذا الإرسال</div>
                   <div className="p-checkbox-box p-checkbox-checked" style={{ marginTop: '2px' }}></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* 2. Purpose */}
        <div style={{ flex: 1, borderLeft: '0.5px solid #666' }}>
          <table className="p-table">
            <thead>
              <tr style={{ background: '#efefef' }}>
                <th className="p-center">مقدم من أجل</th>
                <th className="p-center" style={{ width: '35px' }}></th>
              </tr>
            </thead>
            <tbody>
              {[
                'للموافقة', 'للمراجعة والتعليق', 'حسب الطلب', 
                'للمعلومات والسجلات فقط', 'للإجراء اللازم', 'أخرى: ....................'
              ].map(key => (
                <tr key={key} style={{ height: '17px' }}>
                  <td className="p-small">{key}</td>
                  <td className="p-center">
                    <div className={`p-checkbox-box ${isChecked('purpose', key.startsWith('أخرى') ? 'أخرى' : key) ? 'p-checkbox-checked' : ''}`} />
                  </td>
                </tr>
              ))}
              <tr><td colSpan="2" style={{ height: '70px' }}></td></tr>
            </tbody>
          </table>
        </div>

        {/* 3. Action Taken */}
        <div style={{ flex: 1.3 }}>
          <table className="p-table">
            <thead>
              <tr style={{ background: '#efefef' }}>
                <th className="p-center" style={{ width: '20px' }}></th>
                <th className="p-center">الإجراء المتخذ / الرموز</th>
                <th className="p-center" style={{ width: '35px' }}></th>
              </tr>
            </thead>
            <tbody>
              {[
                { k: 'A', v: 'موافقة' },
                { k: 'B', v: 'موافقة مع ملاحظات، ادرج التعليقات' },
                { k: 'C', v: 'موافقة مع تعليقات، راجع وأعد التقديم' },
                { k: 'D', v: 'غير موافق عليه' },
                { k: 'N', v: 'تمت الإشارة' },
                { k: 'R', v: 'تمت المراجعة - مطابق' },
                { k: 'S', v: 'تمت المراجعة مع ملاحظات، ادرج التعليقات' },
                { k: 'T', v: 'مراجعة مع تعليقات، راجع وأعد التقديم' },
                { k: 'sep', v: 'إرسال منفصل' }
              ].map((item, i) => (
                <tr key={i} style={{ height: '17px' }}>
                  <td className="p-center p-bold">{item.k === 'sep' ? '' : item.k}</td>
                  <td className="p-small">{item.v}</td>
                  <td className="p-center">
                    <div className={`p-checkbox-box ${isChecked('action_codes', item.k === 'sep' ? 'إرسال منفصل' : item.k) ? 'p-checkbox-checked' : ''}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document List Table - Added Row Notes */}
      <div className="p-section-title" style={{ marginTop: '5px' }}>قائمة المستندات</div>
      <table className="p-table">
        <thead>
          <tr style={{ background: '#efefef' }}>
            <th style={{ width: '22px' }} className="p-center">م</th>
            <th className="p-center" style={{ width: '100px' }}>المستند</th>
            <th style={{ width: '55px' }} className="p-center">الرقم</th>
            <th style={{ width: '60px' }} className="p-center">التاريخ</th>
            <th className="p-center">وصف المستند / عنوان الوثيقة</th>
            <th style={{ width: '35px' }} className="p-center">النسخ</th>
            <th className="p-center" style={{ width: '110px' }}>الملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {data.document_list?.map((doc, i) => (
            <tr key={i} style={{ height: '20px' }}>
              <td className="p-center p-bold">{i + 1}</td>
              <td className="p-small">{doc.document}</td>
              <td className="p-center p-small">{doc.number}</td>
              <td className="p-center p-small">{doc.date}</td>
              <td className="p-small">{doc.description}</td>
              <td className="p-center p-small">{doc.version}</td>
              <td className="p-small">{doc.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer / Signatures Area matching Image */}
      <div style={{ marginTop: '5px' }}>
        <table className="p-table">
          <tbody>
            <tr>
              <td className="p-label" style={{ width: '100px' }}>اسم المرسل:</td>
              <td style={{ width: '220px' }} className="p-bold p-small">{data.sender_name}</td>
              <td className="p-label p-center" style={{ width: '130px' }}>التوقيع</td>
              <td className="p-label p-center" style={{ width: '130px' }}>الختم</td>
            </tr>
            <tr>
              <td colSpan="2" style={{ height: '90px', verticalAlign: 'top', padding: '5px' }}>
                 <div className="p-label" style={{ width: 'auto', background: 'none', marginBottom: '2px' }}>اسم المستلم:</div>
                 <div className="p-bold" style={{ fontSize: '10px' }}>{data.receiver_name}</div>
                 <div className="p-label" style={{ width: 'auto', background: 'none', marginTop: '15px', marginBottom: '2px' }}>تاريخ الاستلام:</div>
                 <div style={{ marginTop: '10px' }}>___________________</div>
              </td>
              <td className="p-signature-area">
                {data.signatures?.sender && <img src={data.signatures.sender} className="p-signature-img" />}
              </td>
              <td className="p-signature-area">
                {data.signatures?.stamp && <img src={data.signatures.stamp} className="p-signature-img" />}
              </td>
            </tr>
            <tr>
              <td className="p-label">اعتماد المالك:</td>
              <td className="p-bold p-small">{data.client_approval}</td>
              <td className="p-label p-center">الملاحظات:</td>
              <td className="p-bold p-small" style={{ fontSize: '8.5px' }}>{data.notes}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Distribution */}
      <div className="p-section-title" style={{ marginTop: '5px', fontSize: '10px' }}>توزيع النسخ</div>
      <div style={{ display: 'flex', border: '0.5px solid #666', borderTop: '0', padding: '5px' }}>
        {[
          'المهندس / الاستشاري',
          'المقاول / الشركة / جهة أخرى',
          'الجهة المالكة'
        ].map(key => (
          <div key={key} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className={`p-checkbox-box ${isChecked('distribution', key) ? 'p-checkbox-checked' : ''}`} />
            <span style={{ fontWeight: 'bold', fontSize: '9px' }}>{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
