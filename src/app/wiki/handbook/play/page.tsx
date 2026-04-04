import { HandbookCyoa } from './HandbookCyoa'

/**
 * @page /wiki/handbook/play
 * @entity WIKI
 * @description Interactive CYOA orientation — learn the four moves by playing them
 * @permissions public
 * @relationships branches through Wake Up / Clean Up / Grow Up / Show Up
 * @energyCost 0 (read-only wiki)
 * @agentDiscoverable true
 */
export default function HandbookPlayPage() {
  return <HandbookCyoa />
}
