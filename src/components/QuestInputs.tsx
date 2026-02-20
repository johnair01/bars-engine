'use client'

import React from 'react'

export interface BarInput {
    key: string
    label: string
    type: 'text' | 'textarea' | 'select' | 'trigger'
    required?: boolean
    options?: string[]
    placeholder?: string
    trigger?: string
}

interface QuestInputsProps {
    inputs: string | BarInput[]
    values: Record<string, any>
    onChange: (key: string, value: any) => void
}

export function QuestInputs({ inputs, values, onChange }: QuestInputsProps) {
    let inputList: BarInput[] = []
    
    try {
        if (typeof inputs === 'string' && inputs !== '') {
            const parsed = JSON.parse(inputs)
            // Handle double stringification if it somehow happened
            inputList = typeof parsed === 'string' ? JSON.parse(parsed) : parsed
        } else if (Array.isArray(inputs)) {
            inputList = inputs
        }
    } catch (e) {
        console.error('[QuestInputs] Error parsing inputs:', e)
    }

    if (!inputList || inputList.length === 0) return null

    return (
        <div className="space-y-4">
            {inputList.map((input) => {
                const value = values[input.key] || ''

                return (
                    <div key={input.key} className="space-y-1.5">
                        <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest flex justify-between">
                            <span>{input.label}</span>
                            {!input.required && <span className="text-zinc-600 opacity-50 font-normal normal-case italic">Optional</span>}
                        </label>

                        {input.type === 'select' && (
                            <select
                                value={value}
                                onChange={(e) => onChange(input.key, e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500/50 outline-none transition-all appearance-none cursor-pointer text-sm"
                            >
                                <option value="" disabled className="text-zinc-700">Select an option...</option>
                                {input.options?.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        )}

                        {input.type === 'textarea' && (
                            <textarea
                                value={value}
                                onChange={(e) => onChange(input.key, e.target.value)}
                                placeholder={input.placeholder || `Reflect on ${input.label.toLowerCase()}...`}
                                rows={3}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white placeholder:text-zinc-700 focus:border-purple-500/50 outline-none transition-all text-sm"
                            />
                        )}

                        {input.type === 'text' && (
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => onChange(input.key, e.target.value)}
                                placeholder={input.placeholder || `Enter ${input.label.toLowerCase()}...`}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white placeholder:text-zinc-700 focus:border-purple-500/50 outline-none transition-all text-sm"
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
