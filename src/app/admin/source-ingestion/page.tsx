import { redirect } from 'next/navigation'

/**
 * Source Ingestion is integrated into the Books admin flow.
 * Redirect to Books where the BAR Candidate Pipeline lives.
 */
export default function AdminSourceIngestionPage() {
  redirect('/admin/books')
}
