'use client'

interface ChoiceButtonProps {
    text: string
    onClick: () => void
    disabled?: boolean
    variant?: 'primary' | 'secondary'
}

export function ChoiceButton({
    text,
    onClick,
    disabled = false,
    variant = 'primary'
}: ChoiceButtonProps) {
    const baseStyles = "w-full px-6 py-4 rounded-xl font-medium text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"

    const variantStyles = variant === 'primary'
        ? "bg-purple-900/30 border-2 border-purple-500/50 text-white hover:bg-purple-900/50 hover:border-purple-400 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20"
        : "bg-zinc-900/40 border-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 hover:-translate-y-1"

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles} group`}
        >
            <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base">{text}</span>
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
            </div>
        </button>
    )
}
