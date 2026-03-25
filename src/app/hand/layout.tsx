import type { ReactNode } from 'react'

import { HandZoneLayout } from '@/components/ui/HandZoneLayout'

export default function HandLayout({ children }: { children: ReactNode }) {
  return <HandZoneLayout>{children}</HandZoneLayout>
}
