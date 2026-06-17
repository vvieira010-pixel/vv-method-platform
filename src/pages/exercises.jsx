import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Button } from '../components/shared.jsx';
import { getLibraryExercises, deleteLibraryExercise } from '../lib/exercise-library.js';
import { getB2Modules } from '../lib/met-b2-bank.js';
import { getLifestyleModules } from '../lib/lifestyle-pack.js';
import { getDeepResearchModules } from '../lib/met-b2-exercises.js';
import { EX_TYPES, exercisePreview } from '../lib/exercise-types.js';
import { ExTypeBadge } from '../components/exercise-editor.jsx';

const PACK_TABS = [
  { id: 'library', label: 'My Library' },
  { id: 'b2', label: 'MET B2 Pack' },
  { id: 'lifestyle', label: 'Lifestyle Pack' },
  { id: 'research', label: 'Deep Research' },
];

const SKILL_ORDER = ['speaking', 'listening', 'reading', 'writing', 'grammar', 'vocabulary', 'pronunciation', 'test strategy'];

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function GroupHeader({ label, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 6px', marginTop: 8, borderBottom: '1px solid var(--divider)' }}>
      <span style={{ fontWeight: 700, fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)', background: 'var(--bg)', borderRadius: 99, padding: '1px 7px', border: '1px solid var(--divider)' }}>{count}</span>
    </div>
  );
}

export default function ExercisesPage({ onNavigate }) {
  const [tab, setTab] = useState('library');
  const [library, setLibrary] = useState([]);
  const [libVersion, setLibVersion] = useState(0);

  useEffect(() => {
    getLibraryExercises().then(list => setLibrary(list || [])).catch(() => {});
  }, [libVersion]);

  async function handleDelete(id) {
    await deleteLibraryExercise(id).catch(() => {});
    setLibVersion(v => v + 1);
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: 0 }}>
            Exercise Library
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '4px 0 0' }}>
            Browse packs and saved exercises. Assign via Create Homework.
          </p>
        </div>
        <Button variant="primary" onClick={() => onNavigate('homework-create')}>
          <Icon.plus size={14} /> Create Homework
        </Button>
      </div>

      <nav style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {PACK_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'library' && (
        <Card style={{ padding: 16 }}>
          {library.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', textAlign: 'center', padding: '32px 0' }}>
              No saved exercises. In the homework builder, tap ☆ on any exercise to save it here.
            </p>
          ) : (() => {
            const typeOrder = EX_TYPES.map(t => t.id);
            const grouped = groupBy(library, ex => ex.type);
            const sortedKeys = [...grouped.keys()].sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b));
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {sortedKeys.map(typeId => {
                  const exType = EX_TYPES.find(t => t.id === typeId);
                  const items = grouped.get(typeId);
                  return (
                    <div key={typeId}>
                      <GroupHeader label={exType?.label || typeId} count={items.length} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        {items.map(ex => (
                          <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)' }}>
                            <ExTypeBadge typeId={ex.type} />
                            <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {exercisePreview(ex)}
                            </span>
                            {ex.usageCount > 0 && (
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)' }}>Used {ex.usageCount}×</span>
                            )}
                            <button
                              onClick={() => handleDelete(ex.id)}
                              style={{ padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--danger)' }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Card>
      )}

      {tab === 'b2' && <PackTab title="MET B2 Exercise Pack" modules={getB2Modules()} onNavigate={onNavigate} />}
      {tab === 'lifestyle' && <PackTab title="Lifestyle B1–B2 Pack" modules={getLifestyleModules()} onNavigate={onNavigate} />}
      {tab === 'research' && <PackTab title="Deep Research Pack" modules={getDeepResearchModules()} onNavigate={onNavigate} />}
    </div>
  );
}

function PackTab({ title, modules, onNavigate }) {
  const grouped = groupBy(modules, mod => (mod.skill || 'other').toLowerCase());
  const sortedKeys = [...grouped.keys()].sort((a, b) => {
    const ai = SKILL_ORDER.indexOf(a);
    const bi = SKILL_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const totalExercises = modules.reduce((sum, m) => sum + (m.exercises?.length || 0), 0);

  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <SectionHeader title={title} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)' }}>{modules.length} modules · {totalExercises} exercises</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {sortedKeys.map(skill => {
          const items = grouped.get(skill);
          const skillExerciseCount = items.reduce((sum, m) => sum + (m.exercises?.length || 0), 0);
          return (
            <div key={skill}>
              <GroupHeader label={skill} count={`${items.length} modules · ${skillExerciseCount} exercises`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 4 }}>
                {items.map(mod => (
                  <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px', borderBottom: '1px solid var(--divider)' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{mod.label}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{mod.exercises?.length || 0} exercises</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onNavigate('homework-create')}>
                      Add to Homework
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
