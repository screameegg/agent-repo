import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2 } from 'lucide-react';
import { uploadImageApi } from '../services/file';

interface ImageUploaderProps {
  value?: string;
  fallback?: string;
  alt: string;
  label?: string;
  helpText?: string;
  disabled?: boolean;
  fit?: 'cover' | 'contain';
  className?: string;
  previewClassName?: string;
  imageClassName?: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (message: string) => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function ImageUploader({
  value,
  fallback,
  alt,
  label,
  helpText = '支持 jpg、png、webp、gif，最大 5MB',
  disabled,
  fit = 'cover',
  className = '',
  previewClassName = 'w-20 h-20 rounded-2xl',
  imageClassName = '',
  onChange,
  onUploadingChange,
  onUploadSuccess,
  onUploadError,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const setUploading = (uploading: boolean) => {
    setIsUploading(uploading);
    onUploadingChange?.(uploading);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      const message = '请选择图片文件';
      setErrorMessage(message);
      onUploadError?.(message);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      const message = '图片不能超过5MB';
      setErrorMessage(message);
      onUploadError?.(message);
      return;
    }

    setErrorMessage('');
    setUploading(true);
    try {
      const response = await uploadImageApi(file);
      if (response.code !== 200) {
        const message = response.message || '图片上传失败';
        setErrorMessage(message);
        onUploadError?.(message);
        return;
      }
      onChange(response.data.url);
      onUploadSuccess?.(response.data.url);
    } catch {
      const message = '图片上传失败，请稍后重试';
      setErrorMessage(message);
      onUploadError?.(message);
    } finally {
      setUploading(false);
    }
  };

  const imageUrl = value || fallback;

  return (
    <div className={className}>
      {label && <label className="block text-sm font-black text-[#1A1A1A] mb-2">{label}</label>}
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => fileInputRef.current?.click()}
        className={`${previewClassName} relative group bg-[#FAF9F6] border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] flex items-center justify-center overflow-hidden transition-all hover:shadow-[2px_2px_0px_0px_#1A1A1A] hover:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={alt}
            className={`w-full h-full ${fit === 'contain' ? 'object-contain p-2' : 'object-cover'} ${imageClassName}`}
          />
        ) : (
          <ImagePlus className="w-8 h-8 text-[#888]" />
        )}
        <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/png, image/webp, image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
      {helpText && <p className="text-xs font-bold text-[#888] mt-2">{isUploading ? '图片上传中...' : helpText}</p>}
      {errorMessage && <p className="text-xs font-black text-[#B42318] mt-2">{errorMessage}</p>}
    </div>
  );
}
