import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const OUTPUTS_DIR = path.join(os.homedir(), 'Desktop', 'AI-VİDEO', 'outputs');

// GET: List all available videos
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!fs.existsSync(OUTPUTS_DIR)) {
      return NextResponse.json({ videos: [] });
    }

    // Ürün-video eşleme dosyası
    const mappingPath = path.join(OUTPUTS_DIR, 'product_video_map.json');
    let mapping = {};
    if (fs.existsSync(mappingPath)) {
      mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    }

    // Belirli bir ürünün videosunu getir
    if (productId) {
      const videoFolderId = mapping[productId];
      if (videoFolderId) {
        const videoPath = path.join(OUTPUTS_DIR, videoFolderId, 'final_video.mp4');
        if (fs.existsSync(videoPath)) {
          return NextResponse.json({ 
            video: { id: videoFolderId, productId, exists: true },
            videoUrl: `/api/ai-videos/${videoFolderId}`
          });
        }
      }
      return NextResponse.json({ video: null, videoUrl: null });
    }

    // Tüm videoları listele
    const dirs = fs.readdirSync(OUTPUTS_DIR).filter(d => {
      const full = path.join(OUTPUTS_DIR, d);
      return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'final_video.mp4'));
    });

    const videos = dirs.map(dir => {
      const stats = fs.statSync(path.join(OUTPUTS_DIR, dir, 'final_video.mp4'));
      // Bu videonun atandığı ürünü bul
      const assignedProduct = Object.entries(mapping).find(([, v]) => v === dir);
      return {
        id: dir,
        productId: assignedProduct ? assignedProduct[0] : null,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
      };
    });

    videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return NextResponse.json({ videos });
  } catch (error) {
    return NextResponse.json({ videos: [], error: error.message }, { status: 500 });
  }
}

// POST: Bir videoyu bir ürüne ata
export async function POST(request) {
  try {
    const { productId, videoFolderId } = await request.json();
    
    if (!productId || !videoFolderId) {
      return NextResponse.json({ error: 'productId ve videoFolderId gerekli' }, { status: 400 });
    }

    const videoPath = path.join(OUTPUTS_DIR, videoFolderId, 'final_video.mp4');
    if (!fs.existsSync(videoPath)) {
      return NextResponse.json({ error: 'Video bulunamadı' }, { status: 404 });
    }

    // Eşlemeyi güncelle
    const mappingPath = path.join(OUTPUTS_DIR, 'product_video_map.json');
    let mapping = {};
    if (fs.existsSync(mappingPath)) {
      mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    }
    mapping[productId] = videoFolderId;
    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));

    return NextResponse.json({ success: true, productId, videoFolderId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Bir ürünün video atamasını kaldır
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json({ error: 'productId gerekli' }, { status: 400 });
    }

    const mappingPath = path.join(OUTPUTS_DIR, 'product_video_map.json');
    if (fs.existsSync(mappingPath)) {
      let mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
      if (mapping[productId]) {
        delete mapping[productId];
        fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
