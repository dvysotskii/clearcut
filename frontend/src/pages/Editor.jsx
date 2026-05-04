import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import DropZone from '../components/DropZone';
import BeforeAfter from '../components/BeforeAfter';
import { useRemoveBg } from '../hooks/useRemoveBg';
import { useAuth } from '../hooks/useAuth';
import { usageApi } from '../api';

export default function Editor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { removeBackground, processing, progress, progressLabel, error, resultUrl, reset } = useRemoveBg();

  const [originalFile, setOriginalFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [usage, setUsage] = useState({ today: 0, limit: 3, remaining: 3 });
  const [usageError, setUsageError] = useState('');

  const fetchUsage = useCallback(async () => {
    try {
      const data = await usageApi.today();
      setUsage(data);
    } catch {
      // не блокируем UX при ошибке счётчика
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage, user]);

  const handleFile = (file) => {
    reset();
    setUsageError('');
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalFile(file);
    setOriginalUrl(URL.createObjectURL(file));
  };

  const handleRemove = async () => {
    if (!originalFile) return;
    setUsageError('');

    // Проверяем лимит и трекаем использование
    try {
      const data = await usageApi.track();
      setUsage((prev) => ({ ...prev, remaining: data.remaining, today: (prev.today || 0) + 1 }));
    } catch (err) {
      if (err.message?.includes('лимит')) {
        setUsageError(err.message);
        return;
      }
    }

    try {
      await removeBackground(originalFile);
    } catch {
      // ошибка уже в хуке
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'clearcut-result.png';
    a.click();
  };

  const handleReset = () => {
    reset();
    setOriginalFile(null);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(null);
    setUsageError('');
  };

  const remainingLabel =
    usage.limit === null
      ? 'Безлимит (Pro)'
      : `Осталось: ${usage.remaining ?? usage.limit - usage.today} из ${usage.limit} сегодня`;

  return (
    <div className="editor-page">
      <Header />

      <main className="editor-main">
        <div className="container">
          <div className="editor-header">
            <button className="btn-ghost back-btn" onClick={() => navigate('/')}>
              ← На главную
            </button>
            <h1 className="editor-title">Удалить фон</h1>
            <div className={`usage-badge ${usage.remaining === 0 ? 'usage-empty' : ''}`}>
              {remainingLabel}
            </div>
          </div>

          {usageError && (
            <div className="alert alert-error">
              <p>{usageError}</p>
            </div>
          )}

          {!originalFile && <DropZone onFile={handleFile} />}

          {originalFile && !resultUrl && (
            <div className="preview-section">
              <div className="preview-wrap">
                <img src={originalUrl} alt="Оригинал" className="preview-img" />
              </div>

              {processing ? (
                <div className="progress-wrap">
                  <p className="progress-label">{progressLabel}</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="progress-pct">{progress}%</p>
                </div>
              ) : (
                <div className="preview-actions">
                  <button className="btn-primary btn-lg" onClick={handleRemove}>
                    Удалить фон
                  </button>
                  <button className="btn-ghost" onClick={handleReset}>
                    Выбрать другое фото
                  </button>
                </div>
              )}

              {error && <p className="error-msg">{error}</p>}
            </div>
          )}

          {resultUrl && originalUrl && (
            <div className="result-section">
              <BeforeAfter beforeUrl={originalUrl} afterUrl={resultUrl} />
              <div className="result-actions">
                <button className="btn-primary btn-lg" onClick={handleDownload}>
                  Скачать PNG
                </button>
                <button className="btn-secondary" onClick={handleReset}>
                  Новое фото
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
