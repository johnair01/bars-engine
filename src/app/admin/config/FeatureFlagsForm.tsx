'use client'

import { updateFeatures } from '@/actions/config'

interface Props {
  features: Record<string, boolean>
}

export function FeatureFlagsForm({ features }: Props) {
  return (
    <form action={async (formData) => { await updateFeatures(formData) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {['wallet', 'iching', 'quests', 'story', 'customBars'].map(feature => (
          <label key={feature} className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded cursor-pointer">
            <input
              type="checkbox"
              name={`feature_${feature}`}
              defaultChecked={features[feature] !== false}
              className="w-4 h-4"
            />
            <span className="text-zinc-300 capitalize text-sm">{feature}</span>
          </label>
        ))}
      </div>
      <input type="hidden" name="features" id="featuresJson" />
      <button
        type="submit"
        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded"
        onClick={(e) => {
          const form = (e.target as HTMLButtonElement).closest('form')!
          const checkboxes = form.querySelectorAll('input[type=checkbox]')
          const collected: Record<string, boolean> = {}
          checkboxes.forEach(cb => {
            const input = cb as HTMLInputElement
            const name = input.name.replace('feature_', '')
            collected[name] = input.checked
          })
          form.querySelector<HTMLInputElement>('#featuresJson')!.value = JSON.stringify(collected)
        }}
      >
        Save Features
      </button>
    </form>
  )
}
