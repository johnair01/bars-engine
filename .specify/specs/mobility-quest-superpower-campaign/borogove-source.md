# Borogove source — "Wendell Support Quest" (Twine/Harlowe)

> Canonical source for re-authoring into ECI intake passages. Extracted from the
> uploaded Borogove export (https://cpq9dpsx.play.borogove.io/). Do not edit as
> prose source-of-truth lives here; the engine implementation re-authors it.

**Story attrs:**`name="Wendell Support Quest" startnode="9" creator="Twine" creator-version="2.10.0" format="Harlowe" format-version="3.3.9" ifid="D81936BE-842F-42D6-BFCB-E9680FFB293E" options="" tags="" zoom="0.3" hidden`

---

## [1] The Tone Podcast

Pop Culture in Full Color


I'm starting the Tone Podcast Up again this time with a bent on using pop culture engagemetn to eal with the horrors of the times. 

The Tone Podcast 2 Electric Boogaloo

Needs: 
[[Guests]]
[[Promotion]]
[[Equipment]]

[[Tone Podcast Waitlist]]

Return to[[Start]]

---

## [6] discover your contribution

Welcome to the **Timebank Donation System**. Here, you can **donate your time**, choose how you want to contribute, and activate your hours for use in the community.  

How would you like to contribute?  

[[Donate Skilled Time|SkilledDonation]]  
[[Donate Unskilled Time|UnskilledDonation]]  
[[View My Contributions|MyContributions]]  

[[Return to Timebank |Timebank]]

---

## [7] TimebankQuest

:: TimebankQuest
(set: $questCompleted to (prompt: "Describe the quest you completed to activate your timebank credits:", ""))  

(if: $questCompleted != "")[
(set: $timebankCredits to it + $pendingUnskilledHours)  
(set: $pendingUnskilledHours to 0)  

✅ **Your unskilled hours have been activated and are now available for use!**  
🎭 **Timebank Credits Updated:** $timebankCredits  
]  

[[Return to Start|Start]]

---

## [9] Start

### **🎭 WELCOME TO THE BIRTHDAY SHENANIGANS HEIST 🎂✨**  

**Ah. There you are.**  

I was beginning to wonder if you’d answer the call. **You, dear traveler, are exactly the kind of legend this mission needs.**  

Before you stands a **great and terrible opportunity**—a chance to help me, **Wendell**, **finally break through the paradox of being an objectively brilliant, dangerously charming, ecosystem-building game designer… who somehow still has to ask for rent money.**  

But this isn’t just about survival. No, no. This is about something much greater.  

This is about **rewriting the game itself.**  

See, I have spent **years** developing frameworks, building ecosystems, and **reimagining how people collaborate, support one another, and build power outside of extractive systems.**  

I have engineered **interactive experiences that make allyship fun instead of performative, sustainable instead of exhausting.** I have cracked the code on how to **gamify life according to emergent ecological principles**—how to build systems that **actually work** instead of relying on **good vibes and over-caffeinated discourse.**  

And yet. **Here we are.**  

**The Final Boss Battle:** Launching the next chapter of my life **without succumbing to the crushing weight of capitalism.**  

So I have done the only reasonable thing a man in my position could do.  

I have **turned my entire birthday into a massive, theatrical, narrative-driven fundraising experience**—because if I have to ask for help, **I refuse to do it in a boring way.**  

This is **not just a fundraiser.**  
This is **a heist, a quest, a cosmic test of our collective power to defy the odds and pull off something ridiculous and beautiful.**  

So. **How will you show up for the cause?**  

ACTIVE PATHS

[[I shall offer my gold to fortify the mission!|GoFundMe]]  
[[I will offer my time and skills to the guild.|Timebank]]  
[[I seek wisdom and knowledge.|Books]]  
[[I seek to uplevel my skills through mentoship and coaching! |Coaching]]
[[I would like to add to the armory|Amazon Wishlist]]
[[I wish to train in the Allyship Dojo!|AllyshipDojo]] 

UNDER CONSTRUCTION

[[Give me a quest, and I will see it done! :: under construction|Allyship Quests]] 
[[I will share my voice and help amplify the cause!:: under construction|Podcast]] 
[[I shall move with the rhythm of the realm!|Dance Event]] 

Each path is **real.** Every choice **moves this mission forward.**  

And in return, I promise you this:  
✅ **A glimpse into the future of an economy that actually rewards care, insight, and mutual support.**  
✅ **A front-row seat to what happens when a life’s work collides with the absurdity of fundraising in the weirdest, most joyful way possible.**  
✅ **A damn good story.**  

Your role in this? **Choose your path.** Step into the game. **Let’s make something legendary.** 🎭✨

---

## [10] Timebank

:: Timebank
You approach a guild that values time over coin. Here, hours are the most valuable currency. 

The **Timebank** is a system where people exchange time instead of money. You can:
- **Contribute** by offering your skills, labor, or time.
- **Withdraw** timebank credits when you need help.
- **Support ongoing projects** to create lasting impact.

How will you participate?

🔹 [[Learn more about the Timebank|Timebank Explanation]]  
🔹 [[See active projects that need timebank contributions|Timebank Projects]]  
🔹 [[Offer your time to the Timebank|Timebank Contribution]]  
🔹 [[See current offers available|Timebank Offers]]  
🔹 [[Request help (withdraw time)|Timebank Withdrawal]]  

[[Return to the main path|Start]]

---

## [11] Keeping Warm

:: Keeping Warm Event
If you're in the **Portland area** and looking to get into the **Fusion Dance Scene**, I'm putting on a **(currently) monthly event** called **Keeping Warm**.  

🔥 **What I Need:**  
I'm **looking for DJs** for the event. DJ services can be exchanged for **TimeBank Credits**.  

🎶 **Support Future Events:**  
You can **donate DJ services** for upcoming **Keeping Warm** events at the  
[[Donation Page|Timebank Contribution]]  

🎟 **Sign Up for the Next Event:**  

(link: "RSVP on Partiful!")[(goto-url: 'https://partiful.com/e/geMK438iJGReSX3CzBrt')]


📢 **Would you like to sign up as a DJ?**  
(if: $isDJ is not true)[  
  [[Yes, I’ll DJ!|DJ Sign-Up]]  
]  

[[Return to Main Menu|Start]]

---

## [12] Greasing the Wheels

Greasing the Wheels: Shadow Work for Creatives
Unlock Your Creativity by Facing What’s Blocking You
Every creative person—whether you’re a writer, artist, organizer, or entrepreneur—knows the feeling of getting stuck. Sometimes, it’s a lack of time. Sometimes, it’s perfectionism. And sometimes… it’s something deeper.

🔹 The fear of being seen.
🔹 The belief that you're not "good enough."
🔹 The anxiety that if you actually succeed, everything will change.

This isn’t just about productivity hacks or morning routines. This is about shadow work—getting underneath the surface-level resistance and clearing out the patterns that keep you from showing up fully.

Greasing the Wheels is a shadow work practicum designed to help you:
🛠️ Identify & clear internal creative blocks.
🌀 Recognize how your past experiences shape how you show up.
🔥 Move from avoidance to action—with clarity, not self-sabotage.

This isn’t therapy. This isn’t a “just think positive” mindset reset. This is a real, interactive process to help you get unstuck.

⚙️ How It Works
💡 Live Zoom sessions (donation-based).
🎭 Guided shadow work exercises to help you confront & shift limiting beliefs.
📝 Interactive practices you can take with you beyond the session.
📖 Future workbook in development—be the first to test what will become a full-fledged creative shadow work guide.

📩 Get on the Waitlist
Greasing the Wheels is relaunching soon! If you want to be notified when new sessions start, join the waitlist here:

🔹 [[Join the Waitlist!|Greasing the Wheels Waitlist]]

This is for creatives, changemakers, and anyone who feels like they’re stuck in their own head.

If you’re ready to clear what’s blocking you from showing up, let’s grease the wheels. 🚀

---

## [13] Timebank 1.0

This is a piece of technology that is connected to the more practical applications of the Mastering the Game of Life System

What is a Time Bank?
How do I participate in Wendell's Support TimeBank?

---

## [14] Tone Podcast Waitlist

[[Return to the main path|The Tone Podcast]]

---

## [15] Equipment

Here's a List of the Equipment I need to get the Podcast Up and running again 


Website Hosting

Microphone

Mixing Board

Recorder

Headphones

If you want to make a donation of any of the above feel free to note it in the [[Timebank 1.0]] doc

if you want to gift any of these for my birthday (Amazon Wish-List) 

If you want to make a donation direcly @Wendell-Britt on Venmo

---

## [16] Promotion

All podcasts need listeners. Which means I'll need help promoting the podcast. Here is where you can signup for promoting the podcast. 

Directly promoting the podcast to 10 people will get you 1 timebank credit

Feel free to donate your time here [[Timebank Contribution]]

---

## [17] Guests

[[return to The Tone Podcast |The Tone Podcast]]

---

## [18] Early Readers

:: Read & Review the Book
You step into the **Vault of Unfinished Legends**, where stories wait—not just to be read, but to be sharpened by the eyes of those bold enough to engage with them.  

On a pedestal before you lies *Mastering the Game of Allyship*, a **250-page artifact** containing hard-won insights, battle-tested strategies, and **at least one passage that will make you reconsider your entire life.**  

🔹 **Your mission?** Read, reflect, and **help refine this book before it reaches the world.**  

---

### **How This Works:**  
📖 **1 Timebank credit per hour of reading**—because your time *is* valuable.  
⏳ **Minimum commitment: 2 hours**—just enough to provide useful feedback *without* needing to clear your entire schedule.  

If you're in, **you can submit your time donation here:**  
[[Timebank Contribution]] 
---

### **Just Want a Sneak Peek?**  
Maybe you're curious but **not ready to commit** to full feedback mode. No problem.  

🔍 **You can access the book here:**  
(link: "Read *Mastering the Game of Allyship*")[(open-url: "https://docs.google.com/document/d/1_fr9yI3M2QT1DppApluQv077Ky0V7cpix5bbWYtF2fM/edit?usp=sharing")]  

---

### **Why This Matters**  
This isn’t just about reading a book. **This is about shaping something that will help people show up better—for each other, for their communities, and for the work that actually changes things.**  

Your feedback? **It makes this sharper, stronger, and more impactful.**  

So if you’ve ever wanted to be a **secret editor for something that actually matters**, here’s your shot.  

🔹 **Step into the Vault.**  
🔹 **Read. Reflect. Help shape the future of allyship.**  

[[Return to the Timebank Hub|Timebank]]

---

## [19] Greasing the Wheels Waitlist

[[Return to the main path|Greasing the Wheels]]

---

## [20] GoFundMe

:: GoFundMe
You stand at the threshold of the **Vault of Collective Momentum**, where ideas transmute into reality—not through wishful thinking or endless discourse, but through the oldest magic of all: **gathering what’s needed and putting it to work.**  

Allyship is not just a belief or a performance; it’s a practice of **resourcing the world you want to live in.** And right now, the next stage of that world is **Mastering the Game of Allyship**, a living system designed to break people free from the cycles of burnout, performance, and ineffective action.  

🔹 **If you're ready to fuel this mission, contribute now:**  
(link: "Contribute to the Final Push")[(open-url: "https://gofund.me/a999b728")]  

But this isn’t just about finishing a book. It’s about **building the next iteration of the game—fully realized, fully powered, fully ready to be put into play.** And for that, we gather.  

---

### **The Moment Has Arrived**  
If you’re reading this, you are now officially aware: **I’m running a GoFundMe.**  

It’s the **final push** to get *Mastering the Game of Allyship* across the finish line.  

This work has been forged in the fires of lived experience, refined through testing, and battle-proven against the forces of performative nonsense. What remains is the last piece: making sure it **doesn’t just exist, but thrives.**  

This is where you come in.  

🔹 **If this work has mattered to you, this is your moment to feed the fire.**  
🔹 **If you want to see allyship made playable, real, and effective, this is the time to ensure it happens.**  
🔹 **If you want to be part of something that works, something that lasts, something that doesn’t just critique the old ways but builds the new ones—this is the easiest way to do that.**  

---

### **What If You’re Struggling?**  
Let’s be real: **a lot of people are in survival mode right now.** The world has been designed to keep us all scrambling, convincing us that our resources are scarce and that we must cling to what little we have.  

But here’s what I know: **mutual flourishing is possible.** It happens when we trust that resourcing the right things will always return more than it takes.  

If donating isn’t in the cards for you, consider this:  
🔹 **Sharing this fundraiser amplifies its reach.**  
🔹 **Offering time through the [[Timebank]] is another way to contribute.**  
🔹 **Simply witnessing and affirming this work’s importance builds its momentum.**  

This isn’t about guilt. It’s about **clarity**—knowing that sustaining the work that matters is an act of allyship in itself.  

---

### **The Work Has Never Been Stronger**  
This is not just another resource on allyship. This is the most **fully-evolved, tested, and refined** version of the work to date.  

🔹 **It moves beyond theory and into lived practice.**  
🔹 **It’s designed to be played, engaged with, and applied—not just read.**  
🔹 **It is, quite literally, the game that frees people from the trap of performative allyship.**  

This is not a beginning. It is a **culmination**, a **refinement**, and a **launchpad for everything that comes next.**  

If you’ve been waiting for a way to be part of this work, to support something that **actually works**, this is it.  

---

### **Make It Happen**  
🔹 **If you're ready to fuel this mission, contribute now:**  
(link: "Contribute to the Final Push")[(open-url: "https://gofund.me/a999b728")]  

Your donation, no matter the size, **moves the mission forward**. It’s not charity. It’s **investment in the systems we actually want to build.**  

You have earned the title of **Architect of Momentum**—one who ensures the mission moves forward, not by wishing, but by **gathering, resourcing, and acting.**  

[[Return to the main path|Start]]

---

## [21] Allyship Quests

:: Allyship Quests
A wise elder presents you with a scroll containing noble quests. The realm needs champions. Which quest will you take?

[[The Storyteller’s Call (Create social media content)|Quest Storyteller]]
[[The Builder’s Task (Volunteer for an event)|Quest Builder]]
[[The Sage’s Aid (Write a testimonial)|Quest Sage]]
[[The Messenger’s Mission (Invite others to support)|Quest Messenger]]
[[The Scribe’s Duty (Provide feedback on the book draft)|Quest Scribe]]

[[Return to the main path|Start]]

---

## [22] Books

The Grand Library: Choose Your Tome
You step into the Grand Library of the Realm, where towering bookshelves stretch toward infinity. The air crackles with potential—the scent of aged parchment, the quiet hum of untapped knowledge, the faint echoes of ideas waiting to be unleashed.

At the center of the library, two tomes rest upon ornate pedestals, glowing softly in anticipation. Each one holds the power to shift perspective, ignite action, and reshape the way you move through the world.

Which will you claim?

📖 [[Claim Igniting Joy!|Book Igniting Joy]]
"What if the energy behind your anger wasn’t something to suppress—but something to transform? What if humor could alchemize frustration into fuel?"

Igniting Joy: Transforming Anger’s Fire into Joy Through Humor isn’t about pretending everything’s fine. It’s about harnessing the raw, untamed energy of anger and channeling it into something that fuels action, connection, and creative power.

Through narrative, humor, and deep emotional alchemy, this book will teach you how to:
🔹 Recognize anger as a signal, not a problem.
🔹 Use humor as a transformative tool instead of a coping mechanism.
🔹 Shift from frustration to sustainable, strategic joy—so you can keep showing up without burning out.

If you’re ready to turn rage into radiant, laughter-fueled momentum, this is your guide.

📖 [[Pre-order Mastering the Game of Allyship!|Book Mastering]]
"Allyship isn’t a checklist—it’s a game. A game with levels, strategy, and the potential for real, lasting impact. But most people are stuck playing on ‘easy mode,’ and they don’t even realize it."

This is not another book about performative allyship. This is a playable system for those who actually want to make a difference without burning out, getting trapped in guilt spirals, or constantly feeling like they’re “doing it wrong.”

Through narrative, strategy, and psychotechnology, Mastering the Game of Allyship teaches you how to:
🔹 Spot and escape the pendulums of performative activism.
🔹 Build skills that actually serve the people you want to support.
🔹 Develop the resilience, awareness, and emotional alchemy necessary to be effective—for the long haul.

If you’re ready to level up, claim your copy.

[[Return to the main path|Start]]

---

## [23] Podcast

:: Podcast
A grand stage stands before you. The people need voices, stories, and wisdom. How will you contribute?

[[Be a guest on the *Tone Podcast*!|Podcast Guest]]
[[Connect a guest to the podcast!|Podcast Referral]]

[[Return to the main path|Start]]

---

## [24] Dance Event

:: Dance Event
The music swells, the fire glows, and the dancers move like constellations in motion. Will you step into the rhythm of the realm?

(Click below to RSVP)
* [Attend *Keeping Warm: Pop-Up Fusion Dance*](https://youreventlink.com)

You have earned the title of **Dancer of the Realm**!

[[Return to the main path|Start]]

---

## [25] Timebank Explanation

:: Timebank: The Engine of Collective Action  
You step into the **Vault of Shared Effort**, a grand hall where time itself is the currency of change. No coins, no gatekeepers—just people gathering what they have and offering it where it’s needed.  

Here’s the deal: **every hour contributed fuels the mission.** Every skill shared, every action taken, every offer made—this is how we sustain momentum, **not through charity, but through commitment to the game.**  

---

### **How the Timebank Works**  

🔹 **Make an Offering** – Contribute time by submitting your skills, labor, or expertise.  
🔹 **Call in Support** – Use earned time credits when you need help. No guilt, no hesitation. This system thrives when people actually use it.  
🔹 **Strengthen the Engine** – Some projects need ongoing care. Investing in them ensures the work moves forward.  

This isn’t a wishlist. **This is the foundation of sustainable action.**  

---

### **Ready to Play?**  

🔹 **Contribute to the Timebank & Fuel the Mission:**  
(link: "Make a Timebank Offering")[(open-url: "https://forms.gle/wZjByBjTwbbysP1g8")]  

[[Return to the Timebank Hub|Timebank]]

---

## [26] Quest Storyteller

:: Quest Storyteller
You take up the sacred task of spreading the word through stories and images.

(Click below to get instructions)
* [Sign up for Social Media Creation](https://yourgoogleformlink.com)

You have earned the title of **Herald of Change**!

[[Return to Allyship Quests|Allyship Quests]]
[[Return to the main path|Start]]

---

## [27] Quest Builder

:: Quest Builder
You commit to building, setting up, and making an event happen.

(Click below to sign up)
* [Volunteer for an Event](https://yourgoogleformlink.com)

You have earned the title of **Architect of Action**!

[[Return to Allyship Quests|Allyship Quests]]
[[Return to the main path|Start]]

---

## [28] Book Igniting Joy

:: Book Igniting Joy
You reach for *Igniting Joy*, a tome that brings light into the darkness.

(link: "Buy *Igniting Joy*")[(open-url: "https://wendellbritt.gumroad.com/l/IgnnitingJoy")]

[[Return to the Books |Books]]
[[Return to the main path|Start]]

---

## [29] Book Mastering

:: Book Mastering
You reach for *Mastering the Game of Allyship*, a guide for those who wish to shape a better world.

(link: "Pre-order *Mastering the Game of Allyship*")[(open-url: "https://wendellbritt.gumroad.com/l/MTGOAbook")]

[[Return to the main path|Start]]

---

## [30] Podcast Guest

:: Podcast Guest
You step onto the stage, ready to share your voice.

(Click below to sign up)
* [Sign up to be a guest](https://yourgoogleformlink.com)

You have earned the title of **Echo of Change**!

[[Return to the main path|Start]]

---

## [31] Podcast Referral

:: Podcast Referral
You seek out a worthy voice to bring into the conversation.

(Click below to refer a guest)
* [Refer a guest](https://yourgoogleformlink.com)

You have earned the title of **Gatekeeper of Stories**!

[[Return to the main path|Start]]

---

## [32] Shadow Work

:: Allyship Dojo - Shadow Work (321 Process)

🌑 **Welcome to the Shadow Work Dojo: The 3-2-1 Process** 🌑

"The shadows we refuse to face only grow stronger. Here, we transform our unconscious reactions into conscious wisdom. The **3-2-1 Process** will guide you through reclaiming your projections and integrating your disowned parts."

📜 **What is the 3-2-1 Process?**
1️⃣ **Identify a charge** - An emotional reaction that holds intensity for you. 
2️⃣ **Identify a problematic person or situation** - Something external that triggers discomfort. 
3️⃣ **Engage in perspective-taking** - Move through **3rd-person**, **2nd-person**, and **1st-person reflections** to integrate what was projected outward.

📌 **Choose Your Entry Point:**
🔹 [[Identify a Charge|IdentifyCharge]]
🔹 [[Identify a Problematic Person|ProblematicPerson]]
🔹 [[Identify a Problematic Situation|ProblematicSituation]]

---



---



---



---



---



---


---



---



---



---


---



---

---

## [33] SkilledDonation

:: SkilledDonation
(set: $skilledHours to (prompt: "How many hours of skilled work would you like to donate?", "0"))  
(set: $skilledHours to (num: $skilledHours))  
(set: $timebankCredits to it + $skilledHours)  

✅ **You have donated $skilledHours skilled hours!**  
🎉 These hours **are immediately available** for use in the Timebank.  

[[Return to Start|Start]]

---

## [34] UnskilledDonation

:: UnskilledDonation
(set: $unskilledHours to (prompt: "How many hours of unskilled time would you like to donate?", "0"))  
(set: $unskilledHours to (num: $unskilledHours))  
(set: $pendingUnskilledHours to it + $unskilledHours)  

⚠️ **Your $unskilledHours hours are pending activation.**  
To make them available, you must complete a **Timebank Quest**.  

[[Take a Quest|TimebankQuest]]  
[[Return to Start|Start]]

---

## [35] MyContributions

:: MyContributions
📜 **Timebank Contribution Summary** 📜  

💼 **Skilled Hours Donated:** $skilledHours  
⚡ **Unskilled Hours (Pending Activation):** $pendingUnskilledHours  
⏳ **Total Available Timebank Credits:** $timebankCredits  

[[Return to Start|Start]]

---

## [36] Timebank Projects

:: Timebank Projects
These are the active projects that need time contributions. Choose one to learn how you can help!

🔹 [[Timebank 1.0]]  
🔹 [[Keeping Warm]]  
🔹 [[Greasing the Wheels]]  
🔹 [[The Tone Podcast]]  
🔹 [[Mastering the Game of Allyship]]
🔹 [[Bridgespace]]  
🔹 [[School for the Socially Inept]]  

[[Return to the Timebank Hub|Timebank]]

---

## [37] Timebank Contribution

##Timebank Contribution: Step Into the Flow
You approach the Guild of Timekeepers, where the walls hum with the energy of past contributions. This place runs on a single principle: what is gathered, given, and used sustains the movement.

Here, you are not a spectator—you are part of the engine. The only question is: What will you offer?

Your Contribution
🔹 Not sure what to give? [[Discover your contribution]] (A guided reflection to help decide.)

🔹 Ready to commit? Make your offering now:
(link: "Join the Timebank & Add Your Hours")[(open-url: "https://forms.gle/bXHRMjJWbhZ9Jgf26")]

Your name is etched into the Chronicles of the Timekeepers, marking you as one who understands that progress is not made alone.

You have earned the title of Timekeeper—one who ensures the work moves forward, not by waiting, but by offering what they have to the greater game.

[[Return to the Timebank Hub|Timebank]]

---

## [38] Timebank Offers

:: Timebank Offers
Here are the contributions that members have made to the Timebank. You can view the available offers at the link below:


(link: "View Available Contributions")[(open-url: "https://docs.google.com/spreadsheets/d/1jFkCzJijwD3kPefVmJSOt6ATGWhsGveFGzn4ZYX4s9Q/edit?usp=sharing")]


If you find an offer without contact information, you can reach out to me at **wendell@masteringallyship.com** or text me at **316-250-6608 (text preferred).**

[[Return to the Timebank Hub|Timebank]]

---

## [39] Timebank Withdrawal

:: Timebank Withdrawal
You step into the **Vault of Reciprocity**, the quiet heart of the Timebank. The walls hum with the echoes of past exchanges—acts of service given freely, help requested without guilt, needs met because someone had the courage to **ask clearly and directly**.  

The air carries a familiar tension, one you might recognize: **the discomfort of asking for help.**  

For many, this is harder than offering support. Maybe you’ve been conditioned to **figure it out on your own**, or to **only ask when you’re absolutely drowning**. Maybe you’re worried about being a burden. But here’s the truth:  

### **This system works because people actually use it.**  

🔹 **You are not taking—you are participating.**  
🔹 **You are not imposing—you are making it possible for others to show up in ways that matter.**  
🔹 **The best way to ensure the work moves forward is to name exactly what you need, so the right person can step in.**  

And that last part? **That’s the real key.**  

The clearer your ask, the more likely someone will take it on.  

Instead of:  
🚫 *“I need help with a project.”* → *(Vague. What project? What kind of help? How long will it take?)*  

Try:  
✅ *“I need 3 hours of strategic planning support to break down the next steps for my event, so I don’t waste time spinning my wheels.”*  

Instead of:  
🚫 *“I could use some advice.”* → *(About what? From who? In what format?)*  

Try:  
✅ *“I’d love 2 hours of mentorship from someone experienced in running community events, so I can avoid common mistakes.”*  

Good allyship is about **knowing how to show up for others.**  
Sustainable allyship is about **knowing how to let others show up for you.**  

The system is here. The people are here. **All that’s left is for you to ask.**  

---

### **Make Your Request**  
(link: "Request Support from the Timebank")[(open-url: "https://forms.gle/dGKtddrEZC675LYVA")]  

You have earned the title of **Strategist of Reciprocity**—one who knows that giving and receiving are two sides of the same game.  

[[Return to the Timebank Hub|Timebank]]

---

## [40] Discover your contribution

###Calibrating Your Contribution: The Ancient Art of Not Wasting Time

You step into the Hall of Offerings, where past contributions shimmer like constellations in the great expanse of collective effort. Somewhere, an echo of a well-intentioned volunteer meeting lingers in the air—"Just let us know how you’d like to help!"—a phrase that has launched a thousand enthusiastic sign-ups and led to... precisely zero follow-ups.

Here, we do things differently. This is not about vague intentions. It’s about identifying what you actually bring to the table, how much of it is useful, and ensuring the offering is enough to actually matter.

A guide steps forward, looking at you with the patience of someone who has watched many a well-meaning soul wildly underestimate (or overestimate) their available time. They hand you a simple inscription:

“I offer __ hours of __ to create __ impact.”

It’s deceptively simple. But this, dear Timekeeper, is how we avoid the Great Void of Unused Good Intentions.

###Step 1: Identify Your Offering Without Hand-Waving It
🔹 What do you have to offer? (A skill, a service, an act of support?)
🔹 What impact do you actually want to create? (Are you moving something forward, making something possible, reducing a burden?)

Example Offerings That Actually Mean Something:

📌 “I offer 3 hours of strategic planning to create clear next steps for ongoing projects (so things actually get done instead of existing in a Google Doc graveyard).”
📌 “I offer 5 hours of tech support to make sure digital tools actually function, instead of just existing in a ‘We Should Use This More’ spreadsheet.”
📌 “I offer 2 hours of emotional support to help someone process their next steps, so they don’t burn out and ghost their own efforts.”

If your contribution sounds like something you’d say in a committee meeting just to feel involved, keep refining.

###Step 2: Face the Eternal Question—How Much Time Do You Actually Need?
Most people either:
🔹 Massively underestimate how long things take (“Yeah, I’ll build you a whole website in an hour”), or
🔹 Offer something so vague it’s functionally useless (“I can help with… stuff?”).

The trick is calibration—figuring out how much time actually ensures the impact happens.

🔹 Can you achieve meaningful results in 1-2 hours? (Quick wins, powerful interventions.)
🔹 Does your impact require sustained effort? (Bigger projects need bigger commitments.)
🔹 Is this a long-haul contribution? (If so, donating recurring time might be the move.)

####Example Calibrations:
📌 “I offer 2 hours of grant writing to secure funding for ongoing projects. (A little goes a long way, and the money keeps flowing.)”
📌 “I offer 5 hours of event organizing to ensure things don’t devolve into ‘Wow, we really should have planned this better.’”
📌 “I offer 3 hours of mentorship to keep newer allies from repeating all the same mistakes we did.”

🔹 Ask yourself: How much time do I need to donate to ensure the desired impact actually happens?

###Step 3: What If This Is… A Lot?
If this process is bringing up more stress than clarity, that’s a sign that you might need more than just a volunteer opportunity.

🔹 Feeling overwhelmed by decision fatigue?
🔹 Struggling to identify what actually energizes you?
🔹 Not sure how to balance what you want to do with what’s realistically sustainable?

That’s where coaching comes in. Sometimes, the real work isn’t just deciding what to contribute—it’s clearing the blocks that keep you from stepping fully into what you’re capable of.

If that sounds like you, this might be the perfect time to reach out:

[[Explore Coaching with Wendell|Coaching]]

###Step 4: Commit Without the Illusion of Infinite Time
You have something valuable to give. Now, make it real.

(link: "Make a Timebank Offering")[(open-url: "https://forms.gle/bXHRMjJWbhZ9Jgf26")]

Your name is etched into the Chronicles of the Timekeepers, marking you as one who understands that good intentions don’t move mountains—applied effort does.

You have earned the title of Time Architect—one who shapes the future by offering what is needed, in the amount that actually matters.

[[Return to the Timebank Hub|Timebank]]

---

## [41] Bridgespace

[[return to Timebank Projects |Timebank Projects]]

---

## [42] School for the Socially Inept

[[return to Timebank Projects |Timebank Projects]]

---

## [43] Coaching

:: Coaching
You, noble traveler, have braved the **Labyrinth of Self-Sufficiency**, scaling the **Cliffs of Figure-It-Out-Myself** and fording the **River of I-Shouldn’t-Need-Help**.  

You have spent years **holding space for others**, dispensing wisdom like some kind of emotionally overextended oracle, all while refusing to step into the very kind of support you tell others they need.  

I see you. I respect you. And I am here to tell you: **That nonsense ends today.**  

Here’s the truth: **You cannot give what you do not have.**  

If you are constantly holding space for others but never allowing yourself to receive it…  
If you are coaching, advising, or leading but have never experienced real coaching yourself…  
If you are exhausted, frustrated, and one inconvenient email away from dissolving into a pile of dust…  

Then it’s time. **Not to help. Not to give. But to receive.**  

---

### **What Happens in a Session?**  
This isn’t a **"tell me about your dreams"** life coaching session where I nod solemnly and validate your existence. No. **We move. We get clear. We get unstuck.**  

💡 **You come in with a problem.**  
🔹 You leave with **momentum**—a shift in perspective, a breakthrough, or a tangible plan.  
🔹 You learn how to **stop running on fumes** and start working with **emotional fuel that actually sustains you.**  
🔹 You get to experience **what receiving skilled support actually feels like**—so you can stop trying to pour from an empty cup.  

The question isn’t *“Do I need coaching?”*  
The question is *“How have I gone this long without it?”*  

---

### **Two Ways to Book a Session**  

🌀 **Pay What Feels Right Session**  
💡 *Book a time and pay as a function of the impact you receive.*  
(link: "Book a Pay What Feels Right Session")[(open-url: "https://calendly.com/wendell-britt/pay-what-feels-right")]  

⚡ **Discount Coaching Session – $75**  
💡 *A straightforward, high-impact coaching session at a set rate.*  
(link: "Book a $75 Coaching Session")[(open-url: "https://calendly.com/wendell-britt/1-1-coaching-session")]  

Listen. You don’t win points for going it alone. You don’t get extra credit for struggling longer than necessary. **What you get is stuck.**  

And you? **You’ve got bigger things to do than be stuck.**  

[[Return to the main path|Start]]

---

## [44] Amazon Wishlist

https://www.amazon.com/hz/wishlist/dl/invite/6vxS8qc?ref_=wl_share

[[Return to the main path|Start]]

---

## [45] IdentifyCharge

:: IdentifyCharge
"Describe the emotional charge you are experiencing in as much detail as possible. How does it feel? Where does it show up in your body? What thoughts arise around it?"

📌 **Now, personify this charge.** Imagine it as a character, creature, or entity. Describe it as if it were separate from you.

🔹 [[Describe in Third Person|DescribeChargeThirdPerson]]

---

## [46] ProblematicPerson

:: ProblematicPerson
"Think of a person who triggers discomfort in you. Describe them in the **third person**. Who are they? What behaviors stand out? What emotions do they bring up?"

🔹 [[Move to Second Person (Dialogue with them)|PersonSecondPerson]]

---

## [47] ProblematicSituation

:: ProblematicSituation
"Describe the situation that is causing distress. What about this situation feels problematic?"

📌 **Identify the charge within yourself.** What personal reaction does this situation activate in you?

🔹 [[What kind of person exemplifies this type of situation?|ProblematicPerson]]

---

## [48] Reflection

:: Reflection
🎭 **Integration Complete** 🎭

"You have walked through the **3-2-1 process**, reclaiming a lost part of yourself. What has changed? What insights do you have? How will this affect your allyship journey?"

🔹 [[Return to Allyship Dojo|AllyshipDojo]]

---

## [49] DescribeChargeThirdPerson

:: DescribeChargeThirdPerson
"Now that you have externalized your charge, write about it in the **third person**: ‘It is…’ or ‘They are…’. What does this charge look like? What does it want? How does it influence you?"

🔹 [[Move to Second Person (Dialogue with it)|ChargeSecondPerson]]

---

## [50] ChargeSecondPerson

:: ChargeSecondPerson
"Engage in a dialogue with the charge. Ask it questions: ‘What do you want?’ ‘Why are you here?’ Respond as if you were it. Speak directly to yourself."

🔹 [[Move to First Person (Own the charge)|ChargeFirstPerson]]

---

## [51] PersonSecondPerson

:: PersonSecondPerson
"Engage in a dialogue with the problematic person. Speak to them as if they were present. What do you need to say? What do you want from them? What do they want from you?"

🔹 [[Move to First Person (Own the Projection)|PersonFirstPerson]]

---

## [52] PersonifySituationCharge

:: PersonifySituationCharge
"Now, imagine this charge as an entity. Describe it in **third person** as if it were separate from you."

🔹 [[Move to Second Person (Dialogue with it)|SituationSecondPerson]]

---

## [53] SituationSecondPerson

:: SituationSecondPerson
"Engage in a dialogue with the charge you personified from the problematic situation. Speak to it directly. Ask it why it is present. What is its purpose?"

🔹 [[Move to First Person (Own the charge)|SituationFirstPerson]]

---

## [54] ChargeFirstPerson

:: ChargeFirstPerson
"Finally, shift to **first person**. Recognize this charge as a part of yourself. How does owning it change your perspective? What have you reclaimed?"

🔹 [[Reflect & Complete the Process|Reflection]]

---

## [55] PersonFirstPerson

:: PersonFirstPerson
"Shift to **first person**. Recognize what part of yourself you have projected onto this person. What qualities do they represent in you?"

🔹 [[Reflect & Complete the Process|Reflection]]

---

## [56] SituationFirstPerson

:: SituationFirstPerson
"Shift to **first person**. Recognize how this problematic situation is revealing something about yourself. What lesson is hidden here?"

🔹 [[Reflect & Complete the Process|Reflection]]

---

## [57] AllyshipDojo

[[Shadow Work]]
[[Emotional Alchemy]]
[[Return to the main path|Start]]

---

## [60] Mastering the Game of Allyship

[[return to Timebank Projects |Timebank Projects]]

---

## [61] Emotional Alchemy

:: Emotional Alchemy Dojo
You step into the dojo, where the air hums with unspoken emotions. **Your body already knows what you feel—where does the energy live?**

[[I feel powerful, expansive, or charged.|Map Emotion]] (set: $charge to "Strength")
[[I feel tight, restricted, or stuck.|Map Emotion]] (set: $charge to "Constriction")
[[I feel pulled in multiple directions.|Map Emotion]] (set: $charge to "Tension")
[[I feel numb or disconnected.|Map Emotion]] (set: $charge to "Numbness")

---

## [62] Map Emotion

Your body carries **$charge.** Now, what emotion is present?

[[Fear (Worry, Anxiety, Panic)|Fear Path]]
[[Anger (Frustration, Resentment, Hatred)|Anger Path]]
[[Joy (Mischief, Mania, Overexcitement)|Joy Path]]
[[Sadness (Grief, Emptiness, Loneliness)|Sadness Path]]
[[Neutrality (Boredom, Apathy, Disconnection)|Neutrality Path]]

---

## [63] Choose Path

:: Choose Path
You now understand that **$charge is fueling $emotion.** How do you want to work with it?

[[Neigong: Sit with it and practice inner transformation.|Inner Practice]]
[[Martial Alchemy: Move with it and take action.|Outer Action]]

---

## [64] Inner Practice

:: Inner Practice
You take a deep breath. **You sit with $emotion and let it exist fully.**

[[Observe it without trying to change it.|Deepening Awareness]]
[[Visualize shifting it into a more satisfying state.|Guided Shift]]

---

## [65] Outer Action

:: Outer Action
**Your emotion is momentum waiting to be guided.** What is the smallest action that moves you forward?

💡 What do you want to move toward? (input-box: bind $goal)
💡 What is the **smallest, most obvious step** that moves you in that direction? (input-box: bind $microAction)

(if: $emotion is "Fear")[Would shifting to **Excitement** help? Try **engaging with the unknown playfully.** Alternatively, if it's easier, transform it into **Anger** and take a **bold, assertive action.**]
(if: $emotion is "Anger")[Would shifting to **Triumph** help? Take a **decisive step that asserts control.** Alternatively, if needed, redirect it into **Fear** and create **an organized strategy.**]
(if: $emotion is "Joy")[Would shifting to **Bliss** help? Slow down and **fully immerse yourself in a joyful moment.** Alternatively, if it’s too much, move toward **Neutrality** and ground yourself.]
(if: $emotion is "Sadness")[Would shifting to **Poignance** help? Reflect meaningfully and **create something expressive.** Alternatively, if needed, transform it into **Joy** by seeking a **small uplifting experience.**]
(if: $emotion is "Neutrality")[Would shifting to **Peace** help? Allow stillness to settle. If action is needed, shift into **Anger** and use its **energy to re-engage with life.**]

💡 Choose the shift that works best for you.

[[Commit to the action.|Completion]]
[[I’m still stuck.|Shadow Work
]]

---

## [66] Deepening Awareness

:: Deepening Awareness
You sit in stillness, noticing **$emotion.**

💡 How does it feel in your body? (input-box: bind $emotionTexture)
💡 What does it need from you? (input-box: bind $emotionNeed)

[[I feel at peace.|Completion]]
[[I'm still stuck.|Shadow Work]]

---

## [67] Guided Shift

:: Guided Shift
You close your eyes and visualize **$emotion transforming.** It shifts into a more satisfying state.

(if: $emotion is "Fear")[You transform it into **Excitement**—a feeling of curiosity and readiness.]
(if: $emotion is "Anger")[You channel it into **Triumph**—the fuel for decisive, effective action.]
(if: $emotion is "Joy")[You settle into **Bliss**—joy that does not need to be chased.]
(if: $emotion is "Sadness")[You allow it to become **Poignance**—deep, meaningful reflection.]
(if: $emotion is "Neutrality")[You shift into **Peace**—the stillness that allows clarity.]

[[I feel at peace.|Completion]]
[[I'm still stuck.|Shadow Work]]

---

## [68] Completion

:: Completion
You take a breath. **Something shifts.** You are now in motion.

[[Return to the Dojo|Emotional Alchemy]]

---

## [69] Fear Path

:: Fear Path
(set: $emotion to "Fear")
You now understand that **$charge is fueling $emotion.** How do you want to work with it?

[[Neigong: Sit with it and practice inner transformation.|Inner Practice]]
[[Martial Alchemy: Move with it and take action.|Outer Action]]

---

## [70] Anger Path

:: Anger Path
(set: $emotion to "Anger")
You now understand that **$charge is fueling $emotion.** How do you want to work with it?

[[Neigong: Sit with it and practice inner transformation.|Inner Practice]]
[[Martial Alchemy: Move with it and take action.|Outer Action]]

---

## [71] Joy Path

:: Joy Path
(set: $emotion to "Joy")
You now understand that **$charge is fueling $emotion.** How do you want to work with it?

[[Neigong: Sit with it and practice inner transformation.|Inner Practice]]
[[Martial Alchemy: Move with it and take action.|Outer Action]]

---

## [72] Sadness Path

:: Sadness Path
(set: $emotion to "Sadness")
You now understand that **$charge is fueling $emotion.** How do you want to work with it?

[[Neigong: Sit with it and practice inner transformation.|Inner Practice]]
[[Martial Alchemy: Move with it and take action.|Outer Action]]

---

## [73] Neutrality Path

:: Neutrality Path
(set: $emotion to "Neutrality")
You now understand that **$charge is fueling $emotion.** How do you want to work with it?

[[Neigong: Sit with it and practice inner transformation.|Inner Practice]]
[[Martial Alchemy: Move with it and take action.|Outer Action]]

---

