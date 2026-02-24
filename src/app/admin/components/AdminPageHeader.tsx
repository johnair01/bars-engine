import React from 'react'

interface AdminPageHeaderProps {
    title: string
    description?: string
    action?: React.ReactNode
}

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
                {description && (
                    <p className="text-zinc-400 mt-1">{description}</p>
                )}
            </div>
            {action && (
                <div className="shrink-0">
                    {action}
                </div>
            )}
        </div>
    )
}
