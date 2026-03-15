'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  label?: string
}

interface State {
  hasError: boolean
  errorMessage: string
}

/**
 * Generic error boundary for UI widgets.
 * Catches any error thrown during render or in async transitions,
 * renders a contained fallback instead of crashing the whole page.
 */
export class WidgetErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[WidgetErrorBoundary] ${this.props.label ?? 'widget'} crashed:`, error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="border border-zinc-800 rounded-xl p-4 text-xs text-zinc-600 italic">
          {this.props.label ?? 'This section'} could not be loaded.
        </div>
      )
    }
    return this.props.children
  }
}
