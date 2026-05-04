import { useState, useRef, useCallback } from 'react';

const MAX_SIZE_MB = 20;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export default function DropZone({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validate = (file) => {
    if (!ACCEPTED.includes(file.type)) {
      return 'Поддерживаются только JPG, PNG и WebP';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Файл слишком большой. Максимум ${MAX_SIZE_MB}МБ`;
    }
    return null;
  };

  const handleFile = useCallback((file) => {
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    onFile(file);
  }, [onFile]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`dropzone ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={onInputChange}
        style={{ display: 'none' }}
      />

      <div className="dropzone-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      <p className="dropzone-title">Перетащите фото сюда</p>
      <p className="dropzone-sub">или нажмите для выбора файла</p>
      <p className="dropzone-formats">JPG, PNG, WebP до 20МБ</p>

      {error && <p className="dropzone-error">{error}</p>}
    </div>
  );
}
