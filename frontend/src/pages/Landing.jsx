import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Pricing from '../components/Pricing';
import Footer from '../components/Footer';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Мгновенно',
    desc: 'Удаление фона занимает секунды. Никаких очередей и ожидания.',
  },
  {
    icon: '🎯',
    title: 'Точное удаление',
    desc: 'AI чётко отделяет объект от фона, сохраняя волосы и мелкие детали.',
  },
  {
    icon: '🛍️',
    title: 'Для маркетплейсов',
    desc: 'Идеально для Wildberries, Ozon, Авито. Белый фон за один клик.',
  },
  {
    icon: '📦',
    title: 'Пакетная обработка',
    desc: 'Обрабатывайте несколько фото за раз в тарифе Pro.',
  },
  {
    icon: '🖼️',
    title: 'HD качество',
    desc: 'Результат в PNG с прозрачным фоном. Полное качество оригинала.',
  },
  {
    icon: '🔒',
    title: 'Приватность',
    desc: 'Все вычисления происходят прямо в вашем браузере. Фото не покидают устройство.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const sectionsRef = useRef([]);

  // Анимация появления секций при скролле
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addRef = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  return (
    <div className="landing">
      <Header />

      {/* Hero */}
      <section className="hero section fade-section" ref={addRef}>
        <div className="container hero-inner">
          <div className="hero-badge">Бесплатно · Прямо в браузере · Без регистрации</div>
          <h1 className="hero-title">
            Удали фон<br />
            <span className="gradient-text">за секунды</span>
          </h1>
          <p className="hero-sub">
            AI удаляет фон прямо в браузере — никакие файлы не отправляются на сервер.
            Идеально для Wildberries, Ozon, Авито и социальных сетей.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary btn-lg" onClick={() => navigate('/editor')}>
              Удалить фон бесплатно
            </button>
            <a href="#pricing" className="btn-secondary btn-lg">
              Тарифы
            </a>
          </div>
          <p className="hero-hint">3 бесплатных удаления в день · Без регистрации</p>
        </div>
      </section>

      {/* Фичи */}
      <section id="features" className="section features-section fade-section" ref={addRef}>
        <div className="container">
          <h2 className="section-title">Всё что нужно</h2>
          <p className="section-sub">Быстро, точно, конфиденциально</p>

          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Тарифы */}
      <div className="fade-section" ref={addRef}>
        <Pricing />
      </div>

      <Footer />
    </div>
  );
}
