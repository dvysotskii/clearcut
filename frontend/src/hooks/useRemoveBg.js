import { useState, useCallback } from 'react';
import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

export function useRemoveBg() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);

  const removeBackground = useCallback(async (imageFile) => {
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    setProgressLabel('Загрузка AI-модели... Первый раз может занять до минуты');

    try {
      const blob = await imglyRemoveBackground(imageFile, {
        progress: (key, current, total) => {
          if (total > 0) {
            const pct = Math.round((current / total) * 100);
            setProgress(pct);
            if (key.includes('fetch') || key.includes('download')) {
              setProgressLabel(`Загрузка AI-модели... ${pct}%`);
            } else {
              setProgressLabel(`Обработка изображения... ${pct}%`);
            }
          }
        },
      });

      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      return url;
    } catch (err) {
      setError(err.message || 'Не удалось обработать изображение');
      throw err;
    } finally {
      setProcessing(false);
      setProgress(0);
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

  return { removeBackground, processing, progress, progressLabel, error, resultUrl, reset };
}
