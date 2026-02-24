'use client'

import React from 'react'
import Link from 'next/link'

interface Props {
    children: React.ReactNode
}

interface State {
    hasError: boolean
    errorMessage: string
}

export class TwineErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, errorMessage: '' }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, errorMessage: error.message }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Twine Rendering Error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-zinc-200 p-8 flex items-center justify-center">
                    <div className="text-center space-y-4 max-w-md border border-red-900/50 bg-red-950/20 p-8 rounded-2xl">
                        <h2 className="text-xl font-bold text-red-500 font-mono uppercase tracking-widest">Quest Corrupted</h2>
                        <p className="text-red-400 text-sm">{this.state.errorMessage}</p>
                        <p className="text-zinc-400 text-sm">
                            The passage data could not be rendered. This usually means the quest author uploaded malformed JSON or the passage traversal state became out of sync.
                        </p>
                        <div className="pt-4">
                            <Link href="/adventures" className="inline-block px-4 py-2 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition text-sm">
                                Return to Adventures
                            </Link>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
