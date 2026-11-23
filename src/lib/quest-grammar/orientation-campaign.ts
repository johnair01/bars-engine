/**
 * The sect's orientation campaign: the campaign every new player's first quests belong to.
 *
 * Wendell, 2026-11-20: the orientation campaign is a Skillful Organizing campaign for the Sect,
 * whose subdomain is raising awareness (what a player can and cannot do in the sect). Its
 * packets (character creation, story intro, orientation meta and face sub-packets) carry this
 * campaign's domain; nothing else should read it as a fallback.
 */
import type { AllyshipDomainKey } from '@/lib/allyship-domains'

export const ORIENTATION_CAMPAIGN_DOMAIN: AllyshipDomainKey = 'SKILLFUL_ORGANIZING'
