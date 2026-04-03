import { Press_Start_2P } from 'next/font/google'
import '@/styles/campaign-skin.css'

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
})

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={pixelFont.variable}>
      {children}
    </div>
  )
}
