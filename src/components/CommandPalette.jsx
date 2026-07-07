import { useState, useEffect, useMemo } from 'react';
import { Icon } from './shared.jsx';

export default function CommandPalette({ isOpen, onClose, onExecute, actions }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      // Focus the input after a tiny delay to ensure it's mounted
      setTimeout(() => {
        const input = document.getElementById('cp-input');
        if (input) input.focus();
      }, 10);
    }
  }, [isOpen]);

  const filteredActions = useMemo(() => {
    if (!query) return actions;
    const q = query.toLowerCase();
    return actions.filter(a => a.label.toLowerCase().includes(q) || (a.keywords && a.keywords.some(k => k.toLowerCase().includes(q))));
  }, [query, actions]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-modal" onClick={e => e.stopPropagation()}>
        <div className="cp-search-container">
          <Icon.search size={18} className="cp-search-icon" />
          <input
            id="cp-input"
            className="cp-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredActions.length);
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
              }
              if (e.key === 'Enter' && filteredActions[selectedIndex]) {
                onExecute(filteredActions[selectedIndex]);
              }
            }}
          />
          <div className="cp-shortcut">⌘K</div>
        </div>
        
        <div className="cp-results">
          {filteredActions.length > 0 ? (
            filteredActions.map((action, i) => (
              <div 
                key={action.id} 
                className={`cp-item ${i === selectedIndex ? 'active' : ''}`}
                onClick={() => onExecute(action)}
              >
                <div className="cp-item-left">
                  <span className="cp-item-icon">{action.icon}</span>
                  <span className="cp-item-label">{action.label}</span>
                </div>
                {action.shortcut && <span className="cp-item-shortcut">{action.shortcut}</span>}
              </div>
            ))
          ) : (
            <div className="cp-empty">No matching commands found</div>
          )}
        </div>
        
        <div className="cp-footer">
          <span>↑↓ to navigate</span>
          <span>•</span>
          <span>↵ to select</span>
          <span>•</span>
          <span>Esc to close</span>
        </div>
      </div>

      <style>{`
        .cp-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 27, 45, 0.6);
          backdrop-filter: blur(4px);
          z-index: 2000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 10vh;
          animation: cp-fade-in 0.15s ease-out;
        }
        .cp-modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: cp-slide-up 0.2s ease-out;
        }
        .cp-search-container {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          gap: 12px;
        }
        .cp-search-icon {
          color: var(--muted);
        }
        .cp-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 16px;
          color: var(--text);
          font-family: inherit;
        }
        .cp-shortcut {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          background: var(--surface-alt);
          border: 1px solid var(--border);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .cp-results {
          max-height: 400px;
          overflow-y: auto;
          padding: 8px;
        }
        .cp-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.1s;
          margin-bottom: 2px;
        }
        .cp-item:hover, .cp-item.active {
          background: var(--accent-soft);
          color: var(--accent);
        }
        .cp-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cp-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: var(--muted);
        }
        .cp-item.active .cp-item-icon {
          color: var(--accent);
        }
        .cp-item-label {
          font-size: 14px;
          font-weight: 500;
        }
        .cp-item-shortcut {
          font-size: 12px;
          color: var(--muted);
          opacity: 0.7;
        }
        .cp-empty {
          padding: 24px;
          text-align: center;
          color: var(--muted);
          font-size: 14px;
        }
        .cp-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-top: 1px solid var(--border);
          background: var(--surface-alt);
          color: var(--muted);
          font-size: 11px;
        }
        @keyframes cp-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cp-slide-up {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
