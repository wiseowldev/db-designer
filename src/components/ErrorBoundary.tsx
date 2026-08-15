import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  label: string
  children: ReactNode
}

type State = {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`${this.props.label} crashed:`, error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{this.props.label} hit an error.</p>
          <p>{this.state.error.message}</p>
          <button
            type="button"
            className="text-primary underline"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
