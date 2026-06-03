import React, { useRef } from 'react';
import { Input, Button } from 'antd';
import { UserOutlined, CameraOutlined, DeleteOutlined } from '@ant-design/icons';
import { HeaderData } from '@src/types/resume';

interface Props {
  data: HeaderData;
  onChange: (data: HeaderData) => void;
}

/**
 * Resize an image file to a maximum dimension (width or height)
 * and return a base64 data URL (JPEG, quality 0.85).
 */
function resizeImageToDataUrl(file: File, maxDim = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

const HeaderBlock: React.FC<Props> = ({ data, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoUrl = data.photo || '';

  const sanitizedData = {
    name: String(data.name || '').replace(/<[^>]*>/g, ''),
    title: String(data.title || '').replace(/<[^>]*>/g, ''),
    photo: data.photo,
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Only accept image files
    if (!file.type.startsWith('image/')) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file, 200);
      onChange({ ...sanitizedData, photo: dataUrl });
    } catch {
      // Silently fail — the user can try again
    }
    // Reset so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    onChange({ ...sanitizedData, photo: undefined });
  };

  return (
    <div>
      <div className="block-field">
        <label className="block-label">姓名</label>
        <Input
          value={sanitizedData.name}
          placeholder="你的姓名"
          prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
          style={{ width: '100%' }}
          onChange={e => onChange({ ...sanitizedData, name: e.target.value.replace(/<[^>]*>/g, '') })}
        />
      </div>
      <div className="block-field">
        <label className="block-label">求职岗位</label>
        <Input
          value={sanitizedData.title}
          placeholder="如：前端工程师"
          style={{ width: '100%' }}
          onChange={e => onChange({ ...sanitizedData, title: e.target.value.replace(/<[^>]*>/g, '') })}
        />
      </div>
      <div className="block-field">
        <label className="block-label">照片</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {photoUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              onClick={handleUploadClick}
              style={{
                width: 80,
                height: 108,
                borderRadius: 6,
                border: '1px solid #d1d5db',
                overflow: 'hidden',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <img
                src={photoUrl}
                alt="简历照片"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Button
                size="small"
                icon={<CameraOutlined />}
                onClick={handleUploadClick}
              >
                更换照片
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleRemovePhoto}
              >
                移除照片
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={handleUploadClick}
            style={{
              width: 80,
              height: 108,
              borderRadius: 6,
              border: '2px dashed #d1d5db',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#9ca3af',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#2563eb';
              (e.currentTarget as HTMLElement).style.color = '#2563eb';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db';
              (e.currentTarget as HTMLElement).style.color = '#9ca3af';
            }}
          >
            <CameraOutlined style={{ fontSize: 24, marginBottom: 4 }} />
            <span style={{ fontSize: 10, textAlign: 'center' }}>点击上传</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderBlock;
