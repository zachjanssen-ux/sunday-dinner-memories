import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <AlertTriangle className="w-16 h-16 text-tomato mx-auto mb-6" />
            <h1 className="text-3xl font-display text-cast-iron mb-3">
              Something went wrong in the kitchen
            </h1>
            <p className="text-sunday-brown font-body mb-8">
              An unexpected error occurred. Don't worry, your recipes are safe.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-sienna text-flour rounded-lg px-6 py-3
                font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
            >
              Go back to Dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
