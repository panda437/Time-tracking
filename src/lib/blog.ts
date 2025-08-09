export interface BlogPost {
  title: string
  date: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  author: string
  tags: string[]
}

const posts: BlogPost[] = [
  {
    title: "How Doomscrolling Affects Your Brain",
    date: "2024-01-15",
    slug: "how-doomscrolling-affects-your-brain",
    excerpt: "Discover the science behind doomscrolling and how it impacts your mental health, productivity, and time management.",
    content: `
# How Doomscrolling Affects Your Brain

You know that feeling when you're supposed to be working, but instead you're three hours deep into a Twitter thread about the latest global crisis? Yeah, that's doomscrolling. And your brain hates it.

I'm not here to tell you to delete all your social media accounts (though honestly, sometimes I wonder). But I am here to explain why your brain feels like mush after a doomscrolling session, and more importantly, how to stop the cycle.

## What the Hell is Doomscrolling?

Doomscrolling is when you can't stop consuming bad news, even though it makes you feel terrible. It's like watching a horror movie on repeat - you know what's coming, but you can't look away.

The term became popular during the pandemic, but we've all been doing it for years. You start with one innocent scroll, and suddenly it's 2 AM and you're reading about climate change, political scandals, and the latest tech layoffs. Your brain is fried, your anxiety is through the roof, and you've accomplished exactly nothing.

## Why Your Brain is Basically Broken

### Your Brain is Addicted to Bad News

Here's the messed up part: your brain actually gets a hit of dopamine when you consume negative content. It's like your brain is saying, "Oh, this is terrible! Give me more!"

This made sense when we were cavemen. If there was a saber-toothed tiger nearby, you needed to know about it. But now? Your brain treats every negative headline like it's a life-or-death situation. Spoiler alert: most of it isn't.

### The Negativity Bias is Real

Humans are hardwired to pay attention to negative information. It's why you remember that one critical comment from your boss but forget the ten compliments. Your brain is basically a negativity sponge.

In the age of social media, this means you're constantly bombarded with the worst of humanity. And your brain can't tell the difference between "someone was mean on Twitter" and "there's a bear in your cave."

## How Doomscrolling Screws Up Your Brain

### 1. Your Stress Hormones Go Nuts

When you doomscroll, your body releases cortisol like it's going out of style. This is the same hormone that kicks in when you're running from a bear. Except you're not running from anything - you're just sitting on your couch, scrolling.

The result? You feel anxious, irritable, and exhausted. Your brain thinks you're in constant danger, even though you're perfectly safe.

### 2. Your Decision-Making Goes to Hell

When you're stressed, your prefrontal cortex (the rational part of your brain) basically shuts down. This is why you make terrible decisions after a doomscrolling session.

You know that feeling when you're supposed to work on an important project, but instead you decide to reorganize your sock drawer? That's your brain being fried from too much negative input.

### 3. Time Becomes Meaningless

Doomscrolling creates this weird time distortion where hours feel like minutes. You start scrolling at 8 PM, and suddenly it's midnight. Where did the time go? Your brain has no idea.

This is why you end up rushing through important tasks or staying up too late. Your brain literally loses track of time.

## How to Stop the Madness

### 1. Set a Timer (And Actually Use It)

I know, I know. "Set a timer" sounds like the most obvious advice ever. But here's the thing - most people don't actually do it.

Set a 15-minute timer when you open social media. When it goes off, close the app. No exceptions. Your brain will fight you on this, but you're the boss of your brain, not the other way around.

### 2. Unfollow the Doom Merchants

You know those accounts that only post bad news? Unfollow them. All of them. Your feed should be a mix of useful information, entertainment, and maybe a few cat videos.

If you're following someone who makes you feel worse about the world, unfollow them. You don't owe them anything.

### 3. Ask Yourself: "What Am I Actually Looking For?"

Before you open social media, ask yourself what you're trying to accomplish. Are you looking for information? Entertainment? Connection?

If you can't answer that question, don't open the app. Your brain is probably just looking for a dopamine hit, and there are better ways to get that.

### 4. Replace Doomscrolling with Something Better

Instead of scrolling through bad news, try:
- Reading a book (even for 10 minutes)
- Going for a walk
- Calling a friend
- Working on a project you actually care about
- Literally anything else

## The Time Management Connection

Here's the brutal truth: doomscrolling is one of the biggest time thieves in human history. The average person spends 2-3 hours per day on social media. That's 2-3 hours you could spend on literally anything else.

Think about it. If you spent those 2-3 hours learning a new skill, you could be fluent in Spanish in a year. If you spent them exercising, you'd be in amazing shape. If you spent them working on a side project, you could have a whole new career.

Instead, you're reading about things you can't control and feeling terrible about them. That's not a good use of your time.

## The Bottom Line

Doomscrolling is a modern problem with ancient roots. Your brain evolved to pay attention to threats, but now it's getting confused by the constant stream of negative information.

The good news? You can fix this. Start small. Set a timer. Unfollow the doom merchants. Replace bad habits with better ones.

Your brain will thank you. Your time will thank you. And honestly, the world will probably be a better place if fewer people are constantly stressed out about things they can't control.

Remember: you're not a news aggregator. You're a human being with limited time and energy. Use both wisely.
    `,
    coverImage: "🧠",
    author: "Asif Akbar",
    tags: ["productivity", "mental health", "time management", "digital wellness"]
  },
  {
    title: "What Daniel Kahneman Can Teach You About Using Your Time Better",
    date: "2025-01-05",
    slug: "what-daniel-kahneman-can-teach-you-about-using-your-time-better",
    excerpt: "System 1 vs System 2, the cognitive traps that waste your time, and how Roozi helps you make better decisions with real data.",
    content: `
# What Daniel Kahneman Can Teach You About Using Your Time Better

If you've ever ended a week thinking, "What did I even do?"—congrats, you're human. Your brain wasn't designed to track time accurately. It was designed to keep you alive, which is great for spotting tigers, but not so great for choosing between "start proposal" and "open Slack for the 47th time."

Psychologist Daniel Kahneman (the "Thinking, Fast and Slow" guy) explains why: we have two operating modes—\"System 1\" (fast, intuitive, impulsive) and \"System 2\" (slow, deliberate, rational). You need both. But if you don't set things up right, System 1 runs your day—and your calendar—on autopilot.

This isn't a book summary. It's a field guide for better time use.

## System 1 vs System 2 (Why your calendar lies to you)

- **System 1**: quick reactions, habits, snap judgments. It's why you open email without thinking.
- **System 2**: careful thinking. It's why you can plan a project—if you actually sit down and do it.

The tension: System 1 runs your reflexes. System 2 sets your direction. And most days, reflexes win.

## Why you misjudge how you spend time (no, it's not just you)

Your brain doesn't save a perfect audit log. It saves highlights. That means your memory is a story, not a spreadsheet. Three biases sabotage your time:

### 1) Present bias: "Now" always feels more important than "later"
You know you should work on the strategy doc. But the dopamine hit from responding to a ping? Immediate. Present You keeps stealing from Future You. (Future You is tired of your bullshit.)

### 2) Peak-end rule: You remember the spike, not the curve
If your day had one exciting meeting at 4 PM, you'll think the day was "busy"—even if you spent five hours wandering through tabs and Slack threads.

### 3) Hindsight bias: You think you "knew" how you spent time
Ask someone how they spent the week and they'll guess. Confidently. Then compare it to actual tracked data and—surprise—reality doesn't match the story.

## The Roozi connection: Train your System 2

Kahneman's work isn't motivational fluff. It's a systems upgrade. Roozi helps in three specific ways:

- **Roozi as a System 2 coach**: It adds just enough friction to move you from impulse (System 1) to intention (System 2). Tiny check-ins. Gentle prompts. Clean structure.
- **Replace guesswork with facts**: You track real time. Not vibes. Not memory. Not "I felt busy." Actual entries.
- **Counter present bias with AI**: Roozi highlights where your hours actually go and suggests small shifts with big payoff (e.g., "Mornings = deep work. Slack after 11 AM.")

This isn't about judging yourself. It's about seeing clearly and adjusting.

## What this looks like in real life

- You planned to write for an hour. Instead, you checked email six times. Roozi shows you the pattern in black and white.
- You think you're "bad at focus." Actually, you focus great from 9:30–11:00. You just keep booking meetings on top of that.
- You swear social media is "just five minutes." It's not. Roozi catches the truth—kindly—and helps you cap it.

## Try this for one week

1. **Track without changing anything.** No heroics. Just record honestly.
2. **Review the week.** Compare your expectations vs reality. What surprised you? What stole your time? What energized you?
3. **Set one micro-goal.** Not a life overhaul. One lever. Examples:
   - "No Slack before 11 AM."
   - "90 minutes of deep work before lunch."
   - "Scroll after 8 PM only."
4. **Use Roozi to reinforce it.** Capture the session. Label it. Let the data nudge you forward.

## System 2 isn't about effort. It's about design.

If you rely on willpower, System 1 wins. If you design your day—guardrails, prompts, quick reviews—System 2 wins quietly. That's the game.

## The takeaway

Kahneman showed us that our brains are wired for shortcuts. Roozi gives you the dashboard to spot them—and fix them. Track your time. Review the truth. Adjust one thing. Repeat.

You'll waste less energy guessing. You'll make better calls. And you'll actually feel momentum.

### Ready to train your System 2?
Start free with Roozi today and put your time to work—on purpose.
    `,
    coverImage: "📘",
    author: "Asif Akbar",
    tags: ["productivity", "decision-making", "behavioral science", "time management"]
  }
]

export function getAllPosts(): BlogPost[] {
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find(post => post.slug === slug)
}

export function getPostsByTag(tag: string): BlogPost[] {
  return posts.filter(post => post.tags.includes(tag))
} 