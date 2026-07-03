import { getLevelInfo } from '../lib/fading-manager.js';

export default function FadingBanner({ level, verdict, reason }) {
  const info = getLevelInfo(level);
  const isTransition = verdict === 'reduce' || verdict === 'restore';

  return (
    <div className={`fading-banner ${isTransition ? 'fading-banner--transition' : ''} fading-banner--lvl${level}`}>
      <div className="fading-banner-header">
        <span className="fading-badge">Level {level}</span>
        <span className="fading-label">{info.label}</span>
        {isTransition && <span className="fading-pill">{verdict === 'reduce' ? 'Leveled up!' : 'Support restored'}</span>}
      </div>
      {isTransition && reason ? (
        <p className="fading-msg">{reason}.</p>
      ) : (
        <p className="fading-msg">{info.desc}</p>
      )}
    </div>
  );
}
