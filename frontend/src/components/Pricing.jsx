import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="section pricing-section">
      <div className="container">
        <h2 className="section-title">Простые тарифы</h2>
        <p className="section-sub">Начните бесплатно, перейдите на Pro когда понадобится</p>

        <div className="pricing-grid">
          {/* Бесплатный тариф */}
          <div className="pricing-card">
            <h3 className="plan-name">Бесплатно</h3>
            <div className="plan-price">
              <span className="plan-amount">0₽</span>
              <span className="plan-period">/навсегда</span>
            </div>
            <ul className="plan-features">
              <li>✓ 3 фото в день</li>
              <li>✓ Файлы до 5МБ</li>
              <li>✓ PNG с прозрачностью</li>
              <li>✓ Без регистрации</li>
            </ul>
            <button className="btn-secondary btn-full" onClick={() => navigate('/editor')}>
              Попробовать бесплатно
            </button>
          </div>

          {/* Pro тариф */}
          <div className="pricing-card pricing-card-pro">
            <div className="plan-badge">Популярный</div>
            <h3 className="plan-name">Pro</h3>
            <div className="plan-price">
              <span className="plan-amount">299₽</span>
              <span className="plan-period">/месяц</span>
            </div>
            <ul className="plan-features">
              <li>✓ Безлимитные удаления</li>
              <li>✓ Файлы до 20МБ</li>
              <li>✓ HD качество</li>
              <li>✓ Пакетная обработка</li>
              <li>✓ Приоритетная поддержка</li>
            </ul>
            <button className="btn-primary btn-full" disabled>
              Скоро
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
