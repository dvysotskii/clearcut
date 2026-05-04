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

  useEffect(() => {
    const onMove = (e) => dragging && updateSlider(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, updateSlider]);

  return (
    <div
      className="before-after"
      ref={containerRef}
      onTouchMove={(e) => updateSlider(e.touches[0].clientX)}
      onTouchStart={(e) => updateSlider(e.touches[0].clientX)}
    >
      {/* После (результат) — нижний слой, задаёт высоту контейнера */}
      <img
        src={afterUrl}
        alt="После"
        className="ba-after"
        draggable={false}
      />

      {/* До (оригинал) — поверх, обрезается clip-path справа по позиции слайдера */}
      <img
        src={beforeUrl}
        alt="До"
        className="ba-before"
        style={{ clipPath: `inset(0 ${100 - sliderX}% 0 0)` }}
        draggable={false}
      />

      {/* Линия слайдера */}
      <div
        className="ba-slider"
        style={{ left: `${sliderX}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={(e) => { e.stopPropagation(); updateSlider(e.touches[0].clientX); }}
      >
        <div className="ba-handle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      <span className="ba-label" style={{ left: 12 }}>До</span>
      <span className="ba-label" style={{ right: 12 }}>После</span>
    </div>
  );
}
