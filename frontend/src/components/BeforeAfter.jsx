import { useState, useRef, useCallback, useEffect } from 'react';

export default function BeforeAfter({ beforeUrl, afterUrl }) {
  const [sliderX, setSliderX] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);

  const updateSlider = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setSliderX(pct);
  }, []);

  const onMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    updateSlider(e.clientX);
  }, [dragging, updateSlider]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  const onTouchMove = useCallback((e) => {
    updateSlider(e.touches[0].clientX);
  }, [updateSlider]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, onMouseMove, onMouseUp]);

  return (
    <div className="before-after" ref={containerRef} onTouchMove={onTouchMove}>
      {/* Оригинал */}
      <img src={beforeUrl} alt="До" className="ba-image ba-before" draggable={false} />

      {/* Результат с прозрачным фоном (шахматная доска через CSS) */}
      <div className="ba-after-wrap" style={{ width: `${sliderX}%` }}>
        <img src={afterUrl} alt="После" className="ba-image ba-after" draggable={false} />
      </div>

      {/* Слайдер */}
      <div
        className="ba-slider"
        style={{ left: `${sliderX}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={(e) => updateSlider(e.touches[0].clientX)}
      >
        <div className="ba-slider-line" />
        <div className="ba-slider-handle">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5l-7 7 7 7M16 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </div>
      </div>

      <span className="ba-label ba-label-left">До</span>
      <span className="ba-label ba-label-right">После</span>
    </div>
  );
}
