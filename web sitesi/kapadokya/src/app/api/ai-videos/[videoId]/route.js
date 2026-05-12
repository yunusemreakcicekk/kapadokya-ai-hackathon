import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const OUTPUTS_DIR = path.join(os.homedir(), 'Desktop', 'AI-VİDEO', 'outputs');

// GET: Stream a video file
export async function GET(request, { params }) {
  try {
    const { videoId } = await params;
    const videoPath = path.join(OUTPUTS_DIR, videoId, 'final_video.mp4');

    if (!fs.existsSync(videoPath)) {
      return NextResponse.json({ error: 'Video bulunamadı' }, { status: 404 });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const stream = fs.createReadStream(videoPath, { start, end });
      const readableStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        },
      });

      return new Response(readableStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': 'video/mp4',
        },
      });
    }

    const stream = fs.createReadStream(videoPath);
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });

    return new Response(readableStream, {
      status: 200,
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
