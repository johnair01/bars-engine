import { CreateBarForm } from "@/components/CreateBarForm"
import { NavBar } from "@/components/NavBar"

export default async function CreateBarPage({ searchParams }: { searchParams: Promise<{ setup?: string }> }) {
    const { setup } = await searchParams
    const isSetup = setup === 'true'

    return (
        <div className="min-h-screen bg-black">
            <NavBar />
            <main className="max-w-2xl mx-auto px-4 py-8 pt-24">
                <CreateBarForm setup={isSetup} />
            </main>
        </div>
    )
}
