import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', this.props.label || '', error, info);
  }
  render() {
    if (this.state.hasError) {
      const label = this.props.label || 'This section';
      return (
        <div style={{
          padding: '32px 24px', background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 12, margin: 16, color: '#991B1B',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{label} encountered an error.</div>
          <div style={{ fontSize: 12.5, opacity: 0.75, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 14, padding: '6px 14px', background: '#DC2626', color: '#fff',
              border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
