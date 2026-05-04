import { useState, useCallback } from 'react';
import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

env.allowRemoteModels = true;

// Модель кешируется после первой загрузки
let cachedModel = null;
let cachedProcessor = null;

async function loadModel(onProgress) {
  if (cachedModel && cachedProcessor) return;

  const progressCallback = (info) => {
    if (info.status === 'progress') {
      onProgress(Math.round(info.progress), `Загрузка AI-модели... ${Math.round(info.progress)}%`);
    } else if (info.status === 'loading') {
      onProgress(95, 'Инициализация модели...');
    }
  };

  cachedModel = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
    config: { model_type: 'custom' },
    progress_callback: progressCallback,
  });

  cachedProcessor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
    config: {
      do_normalize: true,
      do_pad: false,
      do_rescale: true,
      do_resize: true,
      image_mean: [0.5, 0.5, 0.5],
      feature_extractor_type: 'ImageFeatureExtractor',
      image_std: [1, 1, 1],
      resample: 2,
      rescale_factor: 0.00392156862745098,
      size: { width: 1024, height: 1024 },
    },
  });
}

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

    const modelAlreadyCached = !!(cachedModel && cachedProcessor);
    if (modelAlreadyCached) {
      setProgressLabel('Обработка изображения...');
      setProgress(50);
    } else {
      setProgressLabel('Загрузка AI-модели... Первый раз может занять до минуты');
    }

    try {
      // Загружаем модель с прогрессом
      await loadModel((pct, label) => {
        setProgress(pct);
        setProgressLabel(label);
      });

      setProgressLabel('Обработка изображения...');
      setProgress(97);

      // Загружаем изображение из File
      const objectUrl = URL.createObjectURL(imageFile);
      const image = await RawImage.fromURL(objectUrl);
      URL.revokeObjectURL(objectUrl);

      // Препроцессинг
      const { pixel_values } = await cachedProcessor(image);

      // Инференс модели
      const { output } = await cachedModel({ input: pixel_values });

      // Создаём маску прозрачности
      const mask = await RawImage
        .fromTensor(output[0].mul(255).to('uint8'))
        .resize(image.width, image.height);

      // Накладываем маску на оригинал
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image.toCanvas(), 0, 0);

      const pixelData = ctx.getImageData(0, 0, image.width, image.height);
      for (let i = 0; i < mask.data.length; ++i) {
        pixelData.data[4 * i + 3] = mask.data[i];
      }
      ctx.putImageData(pixelData, 0, 0);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const url = URL.createObjectURL(blob);

      setProgress(100);
      setResultUrl(url);
      return url;
    } catch (err) {
      setError(err.message || 'Не удалось обработать изображение');
      throw err;
    } finally {
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

  return { removeBackground, processing, progress, progressLabel, error, resultUrl, reset };
}
