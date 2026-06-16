import { redirect } from 'next/navigation'

/**
 * @page /bars/create
 * @deprecated Use /bars/capture instead.
 */
export default function CreateBarPage() {
  redirect('/bars/capture')
}
