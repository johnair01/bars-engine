import { permanentRedirect } from 'next/navigation'

/** The public homepage is the Mastering the Game of Allyship sales page. */
export default function Home() {
  permanentRedirect('/mastering-allyship')
}
