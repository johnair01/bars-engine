import { CampaignReader } from './components/CampaignReader'
import fs from 'fs'
import path from 'path'

export default async function CampaignPage() {
    // In a real app we'd load the JSON server-side and pass it down
    // For now we'll mock it in the component but eventually do this:
    /*
    const contentPath = path.join(process.cwd(), 'content', 'campaigns', 'wake_up', 'intro.json')
    const content = fs.readFileSync(contentPath, 'utf-8')
    const initialNode = JSON.parse(content)
    */

    const initialNode = {
        id: 'intro',
        text: "## The Wake-Up Call\n\nThe world is shifting. Do you feel it?\n\nThis is the beginning of the Wake-Up Campaign.",
        choices: [
            { text: "I feel it.", targetId: "act1" },
            { text: "What are you talking about?", targetId: "act1" }
        ]
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex items-center justify-center font-sans tracking-tight">
            <CampaignReader initialNode={initialNode} />
        </div>
    )
}
