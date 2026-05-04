import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useRemoveBg() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [remaining, setRemaining] = useState(null);

  const removeBackground = useCallback(async (imageFile) => {
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    setProgressLabel('Обработка изображения...');

    // Анимируем прогресс пока ждём ответа от API
    let fakeProgress = 0;
    const timer = setInterval(() => {
      fakeProgress = Math.min(fakeProgress + 8, 85);
      setProgress(fakeProgress);
    }, 300);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${API_URL}/api/remove-bg`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw Object.assign(new Error(data.error || 'Ошибка обработки'), {
          status: response.status,
        });
      }

      // Читаем остаток использований из заголовка
      const rem = response.headers.get('X-Remaining');
      if (rem !== null) setRemaining(parseInt(rem, 10));

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setProgress(100);
      setResultUrl(url);
      return url;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      clearInterval(timer);
      setProcessing(false);
      setProgressLabel('');
    }
  }, []);

  const reset = useCallback(() => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setError(null);
    setProgress(0);
    setProgressLabel('');
    setProcessing(false);
  }, [resultUrl]);

  return { removeBackground, processing, progress, progressLabel, error, resultUrl, remaining, reset };
}
