'use client'

import { useEffect, useRef, useState } from 'react'

interface QuestTwineIframeProps {
    htmlArtifact: string
    onComplete?: (data: any) => void
}

export function QuestTwineIframe({ htmlArtifact, onComplete }: QuestTwineIframeProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [isReady, setIsReady] = useState(false)

    // Construct the full runner HTML
    // We wrap the story data in a minimal SugarCube-esque player
    const runnerHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            background: #111;
            color: #eee;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 2rem;
            line-height: 1.6;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            box-sizing: border-box;
        }
        #passage-container {
            max-width: 600px;
            width: 100%;
            background: #18181b;
            border: 1px border #27272a;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }
        h1 { font-size: 1.25rem; color: #a855f7; margin-top: 0; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; }
        .text { font-size: 1.125rem; margin-bottom: 2rem; white-space: pre-wrap; }
        .links { display: flex; flex-direction: column; gap: 0.75rem; }
        button {
            background: #27272a;
            border: 1px solid #3f3f46;
            color: #fff;
            padding: 1rem;
            text-align: left;
            border-radius: 0.75rem;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 1rem;
        }
        button:hover { background: #3f3f46; border-color: #a855f7; transform: translateY(-1px); }
        .epilogue { border-top: 2px solid #a855f7; padding-top: 1rem; margin-top: 1rem; color: #a855f7; font-weight: bold; }
    </style>
</head>
<body>
    <div id="passage-container">
        <h1 id="title">Loading...</h1>
        <div id="text" class="text"></div>
        <div id="links" class="links"></div>
    </div>

    <div style="display:none" id="story-data-host">${htmlArtifact}</div>

    <script>
        const host = document.getElementById('story-data-host');
        const storyData = host.querySelector('tw-storydata');
        const passages = Array.from(storyData.querySelectorAll('tw-passagedata')).map(p => ({
            name: p.getAttribute('name'),
            text: p.textContent,
            id: p.getAttribute('pid')
        }));

        let currentPassage = passages.find(p => p.id === storyData.getAttribute('startnode')) || passages[0];

        function render() {
            document.getElementById('title').innerText = currentPassage.name;
            
            // Simple link parsing: [[Label|Target]] or [[Target]]
            let text = currentPassage.text;
            const links = [];
            
            // Match [[label|target]]
            text = text.replace(/\\[\\[(.*?)\\|(.*?)\\]\\]/g, (match, label, target) => {
                links.push({ label, target });
                return '';
            });
            // Match [[target]]
            text = text.replace(/\\[\\[(.*?)\\]\\]/g, (match, target) => {
                if (target.includes('|')) return ''; // Already handled
                links.push({ label: target, target });
                return '';
            });

            document.getElementById('text').innerText = text.trim();
            const linksContainer = document.getElementById('links');
            linksContainer.innerHTML = '';

            links.forEach(l => {
                const btn = document.createElement('button');
                btn.innerText = l.label;
                btn.onclick = () => navigate(l.target);
                linksContainer.appendChild(btn);
            });

            // Rite 5 Preview: Check for BIND markers in text
            if (currentPassage.text.includes('[BIND')) {
               const bindMatch = currentPassage.text.match(/\\[BIND (.*?)\\]/);
               if (bindMatch) {
                   window.parent.postMessage({ type: 'TWINE_BIND', payload: bindMatch[1] }, '*');
               }
            }
        }

        function navigate(targetName) {
            const next = passages.find(p => p.name === targetName);
            if (next) {
                currentPassage = next;
                render();
            } else if (targetName === 'Epilogue') {
                // Fallback for epilogue logic
                currentPassage = passages.find(p => p.name === 'Epilogue');
                render();
            }
        }

        render();
    </script>
</body>
</html>
    `

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'TWINE_BIND') {
                onComplete?.(event.data.payload)
            }
        }
        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [onComplete])

    return (
        <div className="w-full aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
            <iframe
                ref={iframeRef}
                srcDoc={runnerHtml}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-forms"
                onLoad={() => setIsReady(true)}
            />
        </div>
    )
}
