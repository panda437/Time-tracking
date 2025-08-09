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