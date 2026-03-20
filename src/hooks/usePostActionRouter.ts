'use client'

import { useRouter } from 'next/navigation'
import type { NavigationContract, ActionResult } from '@/lib/navigation-contract'

/**
 * usePostActionRouter — executes a NavigationContract after a game action.
 *
 * @param contract  The declared contract for this action (from NAV).
 * @param contextualReturn  Where to go when onCancel is null (the page the
 *                          player came from). Defaults to '/'.
 */
export function usePostActionRouter(
  contract: NavigationContract,
  contextualReturn: string = '/'
) {
  const router = useRouter()

  function navigate(result: ActionResult = {}) {
    const destination = contract.onSuccess(result)
    router.push(destination)
    router.refresh()
  }

  function cancel() {
    const destination = contract.onCancel ?? contextualReturn
    router.push(destination)
  }

  return { navigate, cancel }
}
