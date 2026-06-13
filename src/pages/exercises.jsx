import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Button } from '../components/shared.jsx';
import { getLibraryExercises, deleteLibraryExercise } from '../lib/exercise-library.js';
import { getB2Modules } from '../lib/met-b2-bank.js';
import { getLifestyleModules } from '../lib/lifestyle-pack.js';
import { getDeepResearchModules } from '../lib/met-b2-exercises.js';
import { exercisePreview } from '../lib/exercise-types.js';
import { ExTypeBadge } from '../components/exercise-editor.jsx';

const PACK_TABS = [
  { id: 'library', label: 'My Library' },
  { id: 'b2', label: 'MET B2 Pack' },
  { id: 'lifestyle', label: 'Lifestyle Pack' },
  { id: 'research', label: 'Deep Research' },
];

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
              No saved exercises yet. Save exercises from the homework builder using the star button.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {library.map(ex => (
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
          )}
        </Card>
      )}

      {tab === 'b2' && (
        <Card style={{ padding: 16 }}>
          <SectionHeader title="MET B2 Exercise Pack" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 12 }}>
            {getB2Modules().map(mod => (
              <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--divider)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{mod.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'capitalize' }}>{mod.skill} · {mod.exercises.length} exercises</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('homework-create')}>
                  Add to Homework
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'lifestyle' && (
        <Card style={{ padding: 16 }}>
          <SectionHeader title="Lifestyle B1–B2 Pack" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 12 }}>
            {getLifestyleModules().map(mod => (
              <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--divider)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{mod.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'capitalize' }}>{mod.skill} · {mod.exercises.length} exercises</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('homework-create')}>
                  Add to Homework
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'research' && (
        <Card style={{ padding: 16 }}>
          <SectionHeader title="Deep Research Pack" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 12 }}>
            {getDeepResearchModules().map(mod => (
              <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--divider)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{mod.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'capitalize' }}>{mod.skill} · {mod.exercises.length} exercises</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('homework-create')}>
                  Add to Homework
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
