import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

let pythonProcess = null;

export async function POST(request) {
  try {
    const { action } = await request.json();

    if (action === 'start-fastapi') {
      // Sadece çalışmıyorsa başlat
      if (!pythonProcess) {
        const scriptPath = path.resolve(process.cwd(), 'python_api', 'app.py');
        console.log("Python API başlatılıyor:", scriptPath);
        
        // Python uygulamasını arka planda (detached) çalıştır
        // Windows'ta 'start /B' arka planda çalıştırır, e-ticaret sitesini bloklamaz
        pythonProcess = exec(`start /B python "${scriptPath}"`, {
          cwd: path.resolve(process.cwd(), 'python_api'),
          windowsHide: true,
          detached: true
        });

        pythonProcess.on('error', (err) => {
          console.error("Python başlatma hatası:", err);
          pythonProcess = null;
        });
      }
      return NextResponse.json({ success: true, message: 'FastAPI sunucusu başlatıldı.' });
    }

    if (action === 'start-ai-video') {
      const desktopPath = path.resolve(process.env.USERPROFILE || process.env.HOME, 'Desktop', 'AI-VİDEO');
      
      // Video backend ve frontend başlat
      exec(`start cmd /c "cd /d ${desktopPath} && uvicorn main:app --host 0.0.0.0 --port 8001"`, { detached: true });
      exec(`start cmd /c "cd /d ${desktopPath}\\frontend && npm run dev"`, { detached: true });
      
      // Tarayıcıyı aç
      setTimeout(() => {
        exec('start http://localhost:5173');
      }, 4000);

      return NextResponse.json({ success: true, message: 'AI Video aracı başlatıldı.' });
    }

    return NextResponse.json({ success: false, error: 'Bilinmeyen işlem' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
