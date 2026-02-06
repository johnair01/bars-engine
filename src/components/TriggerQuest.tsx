'use client'

import { useEffect } from 'react'
import { fireTrigger } from '@/actions/quest-engine'

export default function TriggerQuest({ trigger }: { trigger: string }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            fireTrigger(trigger).catch(console.error)
        }, 1000) // Delay slightly to ensure user actually "sees" the content
        return () => clearTimeout(timer)
    }, [trigger])

    return null
}
