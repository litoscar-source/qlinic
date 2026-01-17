
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Fix: Explicitly declare state and props properties. Although inherited from Component, some TypeScript configurations require these to be explicitly defined within the class to resolve property access errors.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  // Fix: Utilize robust Error and ErrorInfo types from React for type-safe error handling within the catch lifecycle method.
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    // Fix: Access state via this.state to determine if an error UI should be rendered.
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || (typeof this.state.error === 'object' ? JSON.stringify(this.state.error) : String(this.state.error));
      const errorStack = this.state.error?.stack || "";

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-red-100">
            <h1 className="text-2xl text-red-600 mb-4 font-normal">Erro Crítico</h1>
            <p className="text-gray-600 mb-6 font-normal">A aplicação encontrou um erro e não conseguiu continuar. Isso é geralmente causado por um conflito de versões do React ou uma interrupção na renderização.</p>
            
            <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-80">
              <pre className="text-red-400 text-xs font-mono whitespace-pre-wrap font-normal">
                {`Erro: ${errorMsg}\n\n${errorStack}`}
              </pre>
            </div>
            
            <div className="mt-6 flex gap-4">
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="flex-1 bg-red-50 text-red-700 py-3 rounded-xl hover:bg-red-100 transition-colors font-normal"
              >
                Limpar Dados e Reiniciar
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 font-normal"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Fix: Return children from this.props now that props is correctly recognized as a member of the component class.
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
