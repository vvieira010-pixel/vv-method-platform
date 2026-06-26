import { Button } from './Button.jsx';

export function EmptyState({ icon, title, text, action, onAction }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
      <div className="empty-state-title">{title}</div>
      {text && <div className="empty-state-text">{text}</div>}
      {action && onAction && (
        <Button variant="ghost" size="sm" onClick={onAction}>{action}</Button>
      )}
    </div>
  );
}
