import ffmpeg
import os
from typing import List, Dict

# FFmpeg'in tam yolunu PATH'e ekle (WinGet kurulumu)
_ffmpeg_dir = os.path.join(
    os.environ.get("LOCALAPPDATA", ""),
    "Microsoft", "WinGet", "Packages",
    "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe",
    "ffmpeg-8.1-full_build", "bin"
)
if os.path.isdir(_ffmpeg_dir) and _ffmpeg_dir not in os.environ.get("PATH", ""):
    os.environ["PATH"] = _ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")

def escape_drawtext(text: str) -> str:
    """
    FFmpeg drawtext filter treats characters like :, ', %, and \\ as syntax.
    Escape them so user-entered Turkish text or names do not break rendering.
    """
    return (
        str(text)
        .replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace("'", "\\'")
        .replace("%", "\\%")
        .replace(",", "\\,")
        .replace("[", "\\[")
        .replace("]", "\\]")
    )

def process_video_dynamic(media_metadata: List[Dict], audio_path: str, output_path: str = "final_video.mp4") -> str:
    """
    Dinamik ayarlarla (Arayuzden gelen JSON) videoyu isler.
    """
    if not media_metadata:
        raise ValueError("En az bir medya dosyasi gerekli!")
        
    streams = []
    
    for i, meta in enumerate(media_metadata):
        filepath = meta.get('filepath')
        m_type = meta.get('type')
        trim_start = meta.get('trimStart', 0)
        trim_end = meta.get('trimEnd')
        filter_type = meta.get('filter', 'none')
        transition = meta.get('transition', 'none')
        text = meta.get('text', '')
        t_start = meta.get('textStart', 0)
        t_end = meta.get('textEnd', 4)
        text_color = meta.get('textColor', '#ffffff')
        text_position = meta.get('textPosition', 'center')
        font_size = meta.get('fontSize', 80)

        # 1. Dosya Girisi
        if m_type == 'image':
            # Resim ise 4 saniye oynat
            node = ffmpeg.input(filepath, loop=1, t=4, framerate=30).video
        else:
            # Video
            node = ffmpeg.input(filepath).video
            # Kesme Islemi
            if trim_end and trim_end > trim_start:
                node = node.filter('trim', start=trim_start, end=trim_end).filter('setpts', 'PTS-STARTPTS')
            elif trim_start > 0:
                node = node.filter('trim', start=trim_start).filter('setpts', 'PTS-STARTPTS')

        # 2. Boyutlandirma ve Format
        if m_type == 'image' and transition == 'zoompan':
            node = node.filter('scale', 2160, 3840, force_original_aspect_ratio='increase').filter('crop', 2160, 3840)
            node = node.filter('zoompan', z='min(max(zoom,pzoom)+0.002,1.5)', d=120, x='iw/2-(iw/zoom/2)', y='ih/2-(ih/zoom/2)', s='1080x1920', fps=30)
        else:
            node = node.filter('scale', 1080, 1920, force_original_aspect_ratio='increase').filter('crop', 1080, 1920).filter('fps', fps=30, round='up')

        # 3. Renk Filtreleri
        if filter_type == 'cinematic':
            node = node.filter('eq', contrast=1.1, saturation=1.3, brightness=0.02).filter('unsharp', luma_msize_x=5, luma_msize_y=5, luma_amount=1.0).filter('vignette')
        elif filter_type == 'vibrant':
            node = node.filter('eq', saturation=1.5, brightness=0.05).filter('unsharp', luma_msize_x=3, luma_msize_y=3, luma_amount=0.5)
        elif filter_type == 'bw':
            node = node.filter('colorchannelmixer', rr=0.3, rg=0.4, rb=0.3, gr=0.3, gg=0.4, gb=0.3, br=0.3, bg=0.4, bb=0.3).filter('eq', contrast=1.2)
        elif filter_type == 'soft_glow':
            node = node.filter('eq', brightness=0.05, contrast=1.1).filter('boxblur', 2, 1)
        elif filter_type == 'viral_reels':
            node = node.filter('eq', contrast=1.2, saturation=1.4).filter('unsharp', luma_msize_x=3, luma_msize_y=3, luma_amount=0.8)
        elif filter_type == 'hollywood':
            node = node.filter('colorlevels', rimin=0.05, gimin=0.05, bimin=0.1, rimax=0.9, gimax=0.9, bimax=1.0).filter('eq', contrast=1.1)
        elif filter_type == 'warm_sunset':
            node = node.filter('eq', brightness=0.02, contrast=1.05).filter('colorlevels', rimin=0.1, gimin=0.05, bimin=0.0, rimax=1.0, gimax=0.9, bimax=0.8)
        elif filter_type == 'natural_soft':
            node = node.filter('eq', contrast=0.9, saturation=1.1).filter('unsharp', luma_msize_x=7, luma_msize_y=7, luma_amount=0.5)
        elif filter_type == 'vintage':
            node = node.filter('curves', preset='vintage').filter('vignette')

        # 4. Yazi Ekleme
        if text:
            # Eger yazi bitis saniyesi verilmemisse sonsuz varsay (orn: 999)
            text_end_str = t_end if t_end else 999
            
            if text_position == 'top':
                y_pos = "(h-text_h)/8"
            elif text_position == 'bottom':
                y_pos = "h-(h-text_h)/8-text_h"
            else:
                y_pos = "(h-text_h)/2"

            node = node.filter('drawtext', 
                    text=escape_drawtext(text), 
                    fontfile="C:/Windows/Fonts/arial.ttf", 
                    fontsize=font_size, 
                    fontcolor=text_color, 
                    shadowcolor="black", shadowx=4, shadowy=4,
                    x="(w-text_w)/2", y=y_pos,
                    enable=f"between(t,{t_start},{text_end_str})")

        # 5. Gecis Efekti (Fade)
        # Su anki klibin suresini bilmedigimiz durumlarda (ozellikle video trim edilmisse veya bilinmiyorsa) 
        # fade out yapmak karmasiktir. O yuzden sadece Fade In ekleyelim, coklu videolarda baslangicta kararma verir.
        if transition == 'fade':
            node = node.filter('fade', type='in', start_time=0, duration=0.5)

        # Standart SAR ve PIX_FMT ayarlari (Concat hatasi vermemesi icin)
        node = node.filter('setsar', 1).filter('format', 'yuv420p')
        
        streams.append(node)

    # 6. Concat (Birlestirme)
    joined_video = ffmpeg.concat(*streams, v=1, a=0).node
    v_out = joined_video[0]
    
    # 7. Ses Ekleme
    audio = ffmpeg.input(audio_path).audio.filter('apad')
    
    out = ffmpeg.output(
        v_out, 
        audio, 
        output_path, 
        vcodec='libx264', 
        acodec='aac', 
        shortest=None
    )
    out = ffmpeg.overwrite_output(out)
    
    try:
        ffmpeg.run(out, capture_stdout=True, capture_stderr=True)
        return output_path
    except ffmpeg.Error as e:
        stderr = e.stderr.decode('utf-8', errors='ignore') if e.stderr else ''
        print("FFmpeg Hatasi:")
        print(stderr)
        last_lines = "\n".join(stderr.strip().splitlines()[-6:])
        raise Exception(f"Video isleme sirasinda hata olustu! FFmpeg detayi: {last_lines}")
