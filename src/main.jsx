import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Erro inesperado ao renderizar a aplicação.',
    }
  }

  componentDidCatch(error, info) {
    console.error('Erro fatal de renderização:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8fafc' }}>
        <div style={{ maxWidth: 620, width: '100%', background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h1 style={{ margin: 0, color: '#1331a1', fontSize: 24 }}>Ocorreu um erro inesperado</h1>
          <p style={{ color: '#334155', lineHeight: 1.5 }}>Para evitar tela branca total, a aplicação entrou em modo de recuperação.</p>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>
            Detalhe: {this.state.message}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, border: 'none', background: '#1331a1', color: '#fff', cursor: 'pointer' }}
          >
            Recarregar aplicação
          </button>
        </div>
      </div>
    )
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
