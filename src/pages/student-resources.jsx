import { useState, useMemo } from 'react';
import { Icon } from '../components/shared.jsx';
import RESOURCES, { CATEGORIES } from '../data/student-resources.js';

const TYPE_META = {
  video: { emoji: '🎬', label: 'Video' },
  article: { emoji: '📄', label: 'Article' },
  link: { emoji: '🔗', label: 'Link' },
};

export default function StudentResources() {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return RESOURCES;
    return RESOURCES.filter(r => r.category === filter);
  }, [filter]);

  return (
    <div style={{ padding: 'var(--space-xl) var(--space-lg)', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 'var(--text-2xl)', color: 'var(--text)' }}>Resource Library</h2>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-dim)' }}>
          Curated links, articles, and videos to support your MET preparation
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '6px 14px', borderRadius: 999, border: 'none',
            fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
            background: filter === 'all' ? 'var(--primary)' : 'var(--accent-subtle)',
            color: filter === 'all' ? '#fff' : 'var(--text)',
            transition: 'all .15s var(--ease)',
          }}
        >
          All ({RESOURCES.length})
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            style={{
              padding: '6px 14px', borderRadius: 999, border: 'none',
              fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
              background: filter === cat.id ? 'var(--primary)' : 'var(--accent-subtle)',
              color: filter === cat.id ? '#fff' : 'var(--text)',
              transition: 'all .15s var(--ease)',
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.map(r => {
          const tm = TYPE_META[r.type] || TYPE_META.link;
          return (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', textDecoration: 'none', color: 'inherit',
                padding: '16px 18px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', background: 'var(--surface)',
                transition: 'all .15s var(--ease)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontSize: 20, lineHeight: 1, marginTop: 2 }}>{tm.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>{r.title}</strong>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.04em', padding: '2px 6px', borderRadius: 4,
                      background: r.type === 'video' ? '#fef3c7' : r.type === 'article' ? '#dbeafe' : '#e0e7ff',
                      color: r.type === 'video' ? '#92400e' : r.type === 'article' ? '#1e40af' : '#3730a3',
                    }}>
                      {tm.label}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                    {r.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Icon.link size={11} /> {r.source}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Icon.bulb size={11} /> {r.why}
                    </span>
                  </div>
                </div>
                <Icon.arrowR size={14} style={{ flexShrink: 0, marginTop: 4, color: 'var(--text-muted)' }} />
              </div>
            </a>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', fontSize: 'var(--text-sm)' }}>
          No resources found for this category.
        </div>
      )}
    </div>
  );
}
