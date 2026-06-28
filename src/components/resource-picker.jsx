import { useState, useEffect, useRef } from 'react';
import { Icon } from './shared.jsx';
import { Button } from './ui/Button.jsx';
import { getDbContext, listTeacherResources, uploadTeacherResource, deleteTeacherResource } from '../lib/supabase-db.js';

const RESOURCE_BUCKET = 'teacher-resources';

/**
 * ResourcePicker — modal for browsing and uploading teacher resources
 * (images for speaking prompts, audio for listening exercises) stored in Supabase.
 *
 * Props:
 *   open       — boolean
 *   onClose    — () => void
 *   onSelect   — (publicUrl: string) => void  — called when user picks a resource
 *   tab        — 'images' | 'audio'   — initial tab
 */
export default function ResourcePicker({ open, onClose, onSelect, tab: initialTab }) {
  const [tab, setTab] = useState(initialTab || 'images');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab || 'images');
    loadItems(initialTab || 'images');
    setUploadError('');
  }, [open, initialTab]);

  async function loadItems(folder) {
    setLoading(true);
    try {
      const list = await listTeacherResources(folder);
      setItems(list || []);
    } catch { setItems([]); }
    setLoading(false);
  }

  function switchTab(folder) {
    setTab(folder);
    loadItems(folder);
    setUploadError('');
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const url = await uploadTeacherResource(file, tab);
      await loadItems(tab);
      window.toast?.(`Uploaded ${file.name}`, 'ok');
    } catch (err) {
      console.error('[resource-picker] upload failed:', err);
      setUploadError(err.message || 'Upload failed. Check your connection and try again.');
      window.toast?.(`Upload failed: ${err.message}`, 'warn');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleDelete(path) {
    if (!confirm('Delete this resource?')) return;
    try {
      await deleteTeacherResource(path);
      setItems(prev => prev.filter(i => i.name !== path));
      window.toast?.('Deleted.', 'info');
    } catch (err) {
      console.error('[resource-picker] delete failed:', err);
      setUploadError(`Delete failed: ${err.message}`);
      window.toast?.(`Delete failed: ${err.message}`, 'warn');
    }
  }

  if (!open) return null;

  const ctx = getDbContext();
  const baseUrl = ctx ? `${ctx.url}/storage/v1/object/public/${RESOURCE_BUCKET}` : '';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        width: 640, maxWidth: '94vw', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 12px 48px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>Resource Library</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Browse or upload images and audio for your exercises</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20, fontFamily: 'var(--font-ui)' }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
          {[
            { id: 'images', label: 'Images', icon: <Icon.image size={14} /> },
            { id: 'audio', label: 'Audio', icon: <Icon.headphones size={14} /> },
          ].map(t => (
            <button key={t.id} onClick={() => switchTab(t.id)}
              style={{
                padding: '10px 16px', border: 'none', cursor: 'pointer',
                background: tab === t.id ? 'var(--accent-subtle)' : 'transparent',
                color: tab === t.id ? 'var(--accent)' : 'var(--text-2)',
                fontWeight: 600, fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-ui)',
                borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'border-color .12s, background .12s',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Upload row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: '1px solid var(--divider)' }}>
          <input ref={fileRef} type="file" accept={tab === 'images' ? '.png,.jpg,.jpeg,.webp' : '.mp3,.wav,.ogg,.m4a'}
            onChange={handleUpload} style={{ display: 'none' }} id="resource-upload" />
          <label htmlFor="resource-upload" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 'var(--radius-sm)',
            background: uploading ? 'var(--border)' : 'var(--accent)',
            color: '#fff', cursor: uploading ? 'wait' : 'pointer',
            fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-ui)',
            border: 'none', opacity: uploading ? 0.7 : 1,
          }}>
            {uploading ? 'Uploading…' : <><Icon.plus size={12} /> Upload {tab === 'images' ? 'Image' : 'Audio'}</>}
          </label>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            {tab === 'images' ? 'PNG, JPG, WebP' : 'MP3, WAV, OGG, M4A'}
          </span>
          {uploading && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)' }}>Uploading — please wait…</span>}
        </div>
        {uploadError && (
          <div style={{ margin: '0 20px', padding: '8px 12px', background: 'var(--ex-wrong-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--ex-wrong-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>!</span>
            <span>{uploadError}</span>
            <button onClick={() => setUploadError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontFamily: 'var(--font-ui)', fontSize: 14 }}>×</button>
          </div>
        )}

        {/* Grid / List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {loading && <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>Loading…</p>}
          {!loading && items.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>
              No {tab} yet. Upload one above.
            </p>
          )}

          {tab === 'images' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {items.map(item => {
                const url = `${baseUrl}/${item.name}`;
                const displayName = item.name.replace(/^images\//, '');
                return (
                  <div key={item.name} style={{
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden', cursor: 'pointer',
                    transition: 'border-color .12s',
                  }} onClick={() => onSelect(url)}>
                    <img src={url} alt={item.name}
                      style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                      onError={e => { e.target.style.display = 'none'; }} />
                    <div style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'audio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(item => {
                const url = `${baseUrl}/${item.name}`;
                const displayName = item.name.replace(/^audio\//, '');
                return (
                  <div key={item.name} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  }} onClick={() => onSelect(url)}>
                    <audio controls src={url} style={{ width: 200, height: 32 }} onClick={e => e.stopPropagation()} />
                    <span style={{ flex: 1, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
                    <button onClick={e => { e.stopPropagation(); handleDelete(item.name); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 16, fontFamily: 'var(--font-ui)' }} title="Delete">×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
