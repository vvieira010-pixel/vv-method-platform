import { Button } from './Button.jsx';

export function EmptyState({ icon, title, text, action, onAction }) {
  return (
    <div className="empty-state" role="status">
      {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {text && <div className="empty-state-text">{text}</div>}
      {action && onAction && (
        <Button variant="ghost" size="sm" onClick={onAction}>{action}</Button>
      )}
    </div>
  );
}
