import { NextResponse } from 'next/server';
import CloudConvert from 'cloudconvert';

// ملاحظة: هذا المحرك يتطلب مفتاح API من CloudConvert ليعمل بدقة هندسية 100%
// يمكنك الحصول على مفتاح مجاني في دقيقتين من موقع cloudconvert.com
const cloudConvert = new CloudConvert('YOUR_API_KEY_HERE');

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const targetFormat = formData.get('to').toLowerCase();

    if (!file) {
      return NextResponse.json({ error: 'لم يتم اختيار ملف' }, { status: 400 });
    }

    // في بيئة التطوير بدون مفتاح، سنقوم بمحاكاة التحويل بشكل أفضل أو استخدام محرك محلي
    // ولكن للإنتاج، استخدم CloudConvert
    
    // سنقوم بقراءة الملف كـ Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // بدء مهمة التحويل
    const job = await cloudConvert.jobs.create({
      tasks: {
        'import-my-file': {
          operation: 'import/upload',
        },
        'convert-my-file': {
          operation: 'convert',
          input: 'import-my-file',
          output_format: targetFormat,
        },
        'export-my-file': {
          operation: 'export/url',
          input: 'convert-my-file',
        },
      },
    });

    const uploadTask = job.tasks.filter((task) => task.name === 'import-my-file')[0];

    await cloudConvert.tasks.upload(uploadTask, buffer, file.name);

    // انتظار انتهاء المهمة
    const finishedJob = await cloudConvert.jobs.wait(job.id);
    const exportTask = finishedJob.tasks.filter((task) => task.operation === 'export/url' && task.status === 'finished')[0];
    const fileUrl = exportTask.result.files[0].url;

    // جلب الملف النهائي
    const response = await fetch(fileUrl);
    const finalFileBuffer = await response.arrayBuffer();

    return new NextResponse(finalFileBuffer, {
      headers: {
        'Content-Type': targetFormat === 'pdf' ? 'application/pdf' : 'application/octet-stream',
        'Content-Disposition': `attachment; filename="converted_${file.name.split('.')[0]}.${targetFormat}"`,
      },
    });

  } catch (error) {
    console.error('Conversion Error:', error);
    return NextResponse.json({ error: 'فشل التحويل: تأكد من مفتاح API أو جودة الملف' }, { status: 500 });
  }
}
