import { useState, useEffect, useMemo } from 'react';
import { Icon, SectionHeader } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { getLibraryExercises, deleteLibraryExercise } from '../lib/exercise-library.js';
import { getB2Modules, getB2ModulesWithSupabase } from '../lib/met-b2-bank.js';
import { getLifestyleModules } from '../lib/lifestyle-pack.js';
import { getDeepResearchModules } from '../lib/met-b2-exercises.js';
import { EX_TYPES, exercisePreview } from '../lib/exercise-types.js';
import { ExTypeBadge } from '../components/exercise-editor.jsx';

const PACK_TABS = [
  { id: 'library', label: 'My Library' },
  { id: 'b2', label: 'MET B2 Pack' },
  { id: 'lifestyle', label: 'Everyday English' },
  { id: 'research', label: 'Extended Practice' },
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
    <div className="group-header">
      <span className="group-header-label">{label}</span>
      <span className="group-header-count">{count}</span>
    </div>
  );
}

export default function ExercisesPage({ onNavigate }) {
  const [tab, setTab] = useState('library');
  const [library, setLibrary] = useState([]);
  const [libVersion, setLibVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [b2Modules, setB2Modules] = useState(getB2Modules());

  useEffect(() => {
    if (tab === 'b2') {
      getB2ModulesWithSupabase().then(setB2Modules).catch(e => console.warn('[exercises] failed to load B2 modules:', e));
    }
  }, [tab]);

  const filteredLibrary = useMemo(() => {
    if (!searchQuery.trim()) return library;
    const q = searchQuery.toLowerCase().trim();
    return library.filter(ex => {
      const title = (ex.title || '').toLowerCase();
      const preview = exercisePreview(ex).toLowerCase();
      const typeLabel = (EX_TYPES.find(t => t.id === ex.type)?.label || ex.type || '').toLowerCase();
      const tags = Array.isArray(ex.tags) ? ex.tags.join(' ').toLowerCase() : '';
      const level = (ex.level || '').toLowerCase();
      return title.includes(q) || preview.includes(q) || typeLabel.includes(q) || tags.includes(q) || level.includes(q);
    });
  }, [library, searchQuery]);

  useEffect(() => {
    getLibraryExercises().then(list => setLibrary(list || [])).catch(e => console.warn('[exercises] failed to load:', e));
  }, [libVersion]);

  async function handleDelete(id) {
    await deleteLibraryExercise(id).catch(e => console.warn('[exercises] delete failed:', e));
    setLibVersion(v => v + 1);
  }

  return (
    <div className="page-shell">
      <SectionHeader
        title="Exercise Library"
        sub="Browse packs and saved exercises. Assign via Create Homework."
        action={<Button variant="primary" onClick={() => onNavigate('homework:create')}><Icon.plus size={14} /> Create Homework</Button>}
      />

      <nav className="tabs-line">
        {PACK_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`tab-line${tab === t.id ? ' active' : ''}`}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => onNavigate('library:evaluation')}
          className="tab-line"
        >
          Self Evaluation
        </button>
      </nav>

      {tab === 'library' && (
        <Card>
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <div className="search-input-wrap">
              <Icon.search size={15} />
              <input
                type="text"
                className="search-input"
                placeholder="Search by title, type, tags, or level…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search saved exercises"
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
                  <Icon.close size={15} />
                </button>
              )}
            </div>
          </div>
          {library.length === 0 ? (
            <Card className="page-empty-state">
              <p className="card-row-meta">No saved exercises. In the homework builder, tap ☆ on any exercise to save it here.</p>
            </Card>
          ) : filteredLibrary.length === 0 ? (
            <Card className="page-empty-state">
              <p className="card-row-meta">No exercises match "{searchQuery}". Try a different search.</p>
            </Card>
          ) : (() => {
            const grouped = groupBy(filteredLibrary, ex => ex.folder || ex.type);
            const sortedKeys = [...grouped.keys()].sort();
            return (
              <div>
                {sortedKeys.map(folder => {
                  const items = grouped.get(folder);
                  return (
                    <div key={folder} style={{ marginBottom: 'var(--space-4)' }}>
                      <GroupHeader label={folder} count={items.length} />
                      <div className="grid-square" style={{ marginTop: 'var(--space-2)' }}>
                        {items.map(ex => (
                          <Card key={ex.id} className="square-card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                              <ExTypeBadge typeId={ex.type} />
                              {ex.usageCount > 0 && (
                                <span className="card-row-meta" style={{ fontSize: 'var(--text-xs)' }}>Used {ex.usageCount}×</span>
                              )}
                            </div>
                            {ex.title && (
                              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ex.title}
                              </div>
                            )}
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {exercisePreview(ex)}
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: 8, textAlign: 'right' }}>
                              <Button variant="ghost" size="sm" style={{ color: 'var(--danger)', padding: '4px 8px' }} onClick={() => handleDelete(ex.id)}>
                                Remove
                              </Button>
                            </div>
                          </Card>
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

      {tab === 'b2' && <PackTab title="MET B2 Exercise Pack" modules={b2Modules} onNavigate={onNavigate} />}
      {tab === 'lifestyle' && <PackTab title="Everyday English Pack" modules={getLifestyleModules()} onNavigate={onNavigate} />}
      {tab === 'research' && <PackTab title="Extended Practice Pack" modules={getDeepResearchModules()} onNavigate={onNavigate} />}
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
    <Card>
      <SectionHeader title={title} sub={`${modules.length} modules · ${totalExercises} exercises`} />
      <div>
        {sortedKeys.map(skill => {
          const items = grouped.get(skill);
          const skillExerciseCount = items.reduce((sum, m) => sum + (m.exercises?.length || 0), 0);
          return (
            <div key={skill}>
              <GroupHeader label={skill} count={`${items.length} modules · ${skillExerciseCount} exercises`} />
              <div className="grid-auto-fill-md" style={{ marginTop: 'var(--space-2)' }}>
                {items.map(mod => (
                  <Card key={mod.id} className="square-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text)' }}>{mod.label}</div>
                      <div className="card-row-meta" style={{ fontSize: 'var(--text-xs)' }}>{mod.exercises?.length || 0} exercises</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onNavigate('homework:create')}>
                      Add to Homework
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
