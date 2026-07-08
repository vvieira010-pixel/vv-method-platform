import { Component } from 'react';
import { logError } from '../lib/error-logger.js';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: '', retryCount: 0 };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    const label = this.props.label || '';
    const stack = info?.componentStack || '';
    this.setState({ componentStack: stack });
    console.error('[ErrorBoundary]', label, error, info);
    logError(error, { component: label, source: 'ErrorBoundary' });
  }
  render() {
    if (this.state.hasError) {
      const label = this.props.label || 'This section';
      return (
        <div style={{
          padding: '32px 24px', background: 'var(--danger-bg)', border: '1px solid var(--danger-soft)',
          borderRadius: 12, margin: 16, color: 'var(--danger)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{label} encountered an error.</div>
          <div style={{ fontSize: 12.5, opacity: 0.75, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message}
          </div>
          {this.state.componentStack && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, opacity: 0.6 }}>Component stack</summary>
              <pre style={{ fontSize: 11, marginTop: 6, whiteSpace: 'pre-wrap', opacity: 0.5 }}>
                {this.state.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => this.setState(prev => ({ hasError: false, error: null, retryCount: prev.retryCount + 1 }))}
            style={{
              marginTop: 14, padding: '6px 14px',              background: 'var(--danger)', color: 'var(--on-dark)',
              border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return <div key={this.state.retryCount}>{this.props.children}</div>;
  }
}
