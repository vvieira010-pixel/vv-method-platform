export default function MockTestSidebar({ total: length, currentIdx, answered, onJump }) {
  return (
    <div className="mts">
      <div className="mts__header">Q</div>
      <div className="mts__grid">
        {Array.from({ length }, (_, i) => (
          <button
            key={i}
            className={`mts__btn ${i === currentIdx ? 'mts__btn--cur' : ''} ${answered[i] ? 'mts__btn--done' : ''}`}
            onClick={() => onJump?.(i)}
          >{i + 1}</button>
        ))}
      </div>
      <style>{`
        .mts { width: 56px; background: var(--bg); border-right: 1px solid var(--border); padding: 12px 6px; overflow-y: auto; flex-shrink: 0; }
        .mts__header { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); text-align: center; margin-bottom: 8px; }
        .mts__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px; }
        .mts__btn { height: 30px; border: 1px solid var(--border); border-radius: 5px; background: var(--surface); cursor: pointer; font-size: 11px; font-weight: 600; color: var(--text); padding: 0; }
        .mts__btn--cur { border-color: var(--primary); background: var(--primary); color: #fff; }
        .mts__btn--done { background: var(--primary-light); border-color: var(--primary); }
      `}</style>
    </div>
  );
}
