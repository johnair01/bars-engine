/**
 * @page /tap-the-vein/embed
 * @entity SYSTEM
 * @description Tap the Vein with no site chrome, framed by the Council Board's Morning tab on /board/council
 * @permissions authenticated
 * @agentDiscoverable false
 *
 * The same page as /tap-the-vein. Chrome renders this path bare and the runner hides its Back link and tells the
 * board when the day is sealed.
 */
export { default } from '../page'
export const dynamic = 'force-dynamic'
