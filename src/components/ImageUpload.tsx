import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, label, folder = 'general', className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    setUploading(true);
    setProgress(0);

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      },
      (error) => {
        console.error('Upload error:', error);
        alert('Erro ao fazer upload da imagem.');
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onChange(downloadURL);
        setUploading(false);
        setProgress(0);
      }
    );
  };

  const removeImage = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-sm font-medium text-zinc-700">{label}</label>}
      
      <div className="relative group">
        {value ? (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full aspect-video rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center gap-2 hover:bg-zinc-100 hover:border-orange-200 transition-all text-zinc-400 hover:text-orange-500 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <Loader2 className="animate-spin text-orange-500" size={32} />
                  <span className="absolute text-[10px] font-bold text-orange-600">{Math.round(progress)}%</span>
                </div>
                <span className="text-xs font-medium">Enviando imagem...</span>
              </>
            ) : (
              <>
                <div className="p-3 bg-white rounded-full shadow-sm border border-zinc-100 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold block">Clique para enviar</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">PNG, JPG até 2MB</span>
                </div>
              </>
            )}
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
