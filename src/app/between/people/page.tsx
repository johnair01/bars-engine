import { redirect } from 'next/navigation'
import { getMyPeople } from '@/actions/between-people'
import { PeopleClient } from './PeopleClient'

export const dynamic = 'force-dynamic'

/** /between/people: her raised 3-2-1 parts, their quests tied to her goals, and news from her outer life. */
export default async function BetweenPeoplePage() {
  const data = await getMyPeople()
  if ('error' in data) redirect('/login')
  return <PeopleClient people={data.people} goals={data.goals} news={data.news} />
}
