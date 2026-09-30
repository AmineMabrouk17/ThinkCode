# 🧠 ThinkCode

> **Think first. Understand deeply. Remember forever.**

ThinkCode is a personal algorithm-learning workspace designed to help developers learn problem solving without losing the reasoning behind their solutions.

When solving problems on platforms like NeetCode, the learning process is usually scattered across timers, notes, ChatGPT conversations, AI Studio, YouTube videos, code editors, screenshots, and random documents.

ThinkCode brings that entire process into one organized place.

The goal is simple:

```text
THINK → EXPLORE → DISCUSS → VISUALIZE → SOLVE → REFLECT → REMEMBER
```

ThinkCode doesn't replace the thinking process.

It helps you **capture, understand, organize, and revisit it.**

---

# 🎯 The Problem

When learning algorithms, the final solution is only a small part of the learning process.

A typical session might look like:

```text
NeetCode
   ↓
Read the problem
   ↓
15-minute timer
   ↓
Think independently
   ↓
Write rough comments
   ↓
Ask ChatGPT for help
   ↓
Understand the missing concept
   ↓
Watch a YouTube explanation
   ↓
Create a diagram
   ↓
Write the solution
   ↓
Move to the next problem
```

But afterward, the important information is often scattered.

You may have:

* A ChatGPT conversation somewhere
* An AI Studio conversation somewhere else
* A YouTube video
* Notes in VS Code
* A screenshot
* A diagram
* A code implementation
* A timer session
* Your initial wrong idea
* The final insight

Eventually you remember:

> "I solved this before..."

But you don't remember **how you understood it**.

ThinkCode solves this problem.

---

# 💡 Vision

ThinkCode is a **personal memory system for algorithmic problem solving**.

Instead of storing only:

```text
Problem → Solution
```

ThinkCode stores:

```text
Problem
   │
   ├── 🧠 Initial Thinking
   │
   ├── ⏱️ Thinking Session
   │
   ├── 💬 AI Conversations
   │
   ├── 📊 Visualizations
   │
   ├── 📝 Notes
   │
   ├── 🎥 Resources
   │
   ├── 💻 Final Solution
   │
   └── 🔄 Reflection
```

The application should preserve the **evolution of understanding**.

---

# 🧠 Core Philosophy

ThinkCode is built around one principle:

> **Your mistakes and reasoning are part of your knowledge.**

For example, a traditional notes app might contain:

```text
Two Sum

Use a hashmap.

Time: O(n)
Space: O(n)
```

ThinkCode should allow you to preserve:

```text
My first thought:
"Maybe I should sort the array."

Problem:
Sorting changes the original indices.

Then I thought:
"Can I somehow remember the values I've already seen?"

AI explanation:
A hashmap allows constant-time lookup.

My final mental model:
"Fix one number → calculate what I need → check if I've seen it."
```

The second version is much more useful when revisiting the problem later.

---

# ✨ Core Features

## 1. 📚 Problem Library

Create and organize algorithm problems.

Each problem can contain:

* Title
* Platform
* Problem URL
* Difficulty
* Category
* Patterns
* Tags
* Status
* Personal notes
* Learning sessions
* AI conversation links
* YouTube resources
* Visualizations
* Final solution

Example:

```text
Two Sum

Platform:
NeetCode / LeetCode

Difficulty:
Easy

Category:
Arrays & Hashing

Patterns:
HashMap
Complement Lookup

Status:
Completed
```

---

# ⏱️ 2. Thinking Timer

Before asking AI for help, ThinkCode encourages independent thinking.

Start a configurable timer:

```text
┌──────────────────────────────┐
│                              │
│           14:32              │
│                              │
│     🧠 Think independently   │
│                              │
│       [ Pause ] [ Finish ]   │
│                              │
└──────────────────────────────┘
```

Default:

```text
15 minutes
```

But users can configure:

* 5 minutes
* 10 minutes
* 15 minutes
* 20 minutes
* 30 minutes
* Custom duration

The timer should not be treated as a productivity metric.

Its purpose is to create a **thinking-first habit**.

---

# 🧠 3. Initial Thinking

During the timer, the user can record their thoughts.

For example:

```text
What I think so far:

# Maybe brute force?

# We need to find two numbers.

# O(n²) seems too slow.

# Could sorting help?

# But then we may lose the original indices.
```

The user should be able to freely write:

* Ideas
* Hypotheses
* Questions
* Failed approaches
* Complexity guesses
* Data structure ideas
* Pseudocode

This section should remain clearly separated from the final solution.

---

# 💬 4. AI Conversation Links

ThinkCode should **not try to replace ChatGPT or AI Studio**.

Instead, it should allow users to attach conversations to a problem.

For example:

```text
AI Assistance

ChatGPT
https://chatgpt.com/...

AI Studio
https://aistudio.google.com/...

Claude
https://...

Other
https://...
```

The important requirement is:

> **Store the conversation URL, not the entire conversation.**

This keeps the ThinkCode interface clean while allowing the user to return to the original AI discussion.

Example:

```text
┌──────────────────────────────────────┐
│ 💬 AI Conversations                  │
│                                      │
│ ChatGPT                              │
│ Why does the hashmap approach work?  │
│                                      │
│ [ Open conversation ↗ ]              │
└──────────────────────────────────────┘
```

Users can also add a short description:

```text
Why I saved this:

"AI explained the complement idea
in a way I finally understood."
```

---

# 📊 5. Visualizations

Understanding algorithms is often easier visually.

ThinkCode should allow users to attach or create:

* Diagrams
* Flowcharts
* Graphs
* Algorithm animations
* Screenshots
* Mermaid diagrams
* Images
* Tables
* Custom visual explanations

Example:

```text
nums = [2, 7, 11, 15]
target = 9

          2
          │
          ▼
    complement = 7
          │
          ▼
   ┌──────────────┐
   │ Seen values  │
   │              │
   │      2       │
   └──────────────┘
          │
          ▼
        found
```

A visualization belongs directly to the problem.

---

# 📝 6. Knowledge Notes

After solving a problem, the user can create a condensed explanation.

Example:

```markdown
# Two Sum

## Pattern

HashMap / Complement Lookup

## Mental Model

Fix one number.

Calculate the value needed to reach the target.

Check whether that value was already seen.

## Why it works

The hashmap gives us fast lookup of previously
seen values.

## Complexity

Time: O(n)
Space: O(n)

## My Previous Mistake

I initially wanted to sort the array,
but sorting makes the original indices harder
to preserve.

## Key Lesson

Think:

current number → required complement → lookup
```

This becomes the user's personal knowledge base.

---

# 🎥 7. YouTube Resources

Users can attach YouTube videos to problems.

Example:

```text
🎥 Resources

NeetCode
Two Sum Explained

[ Watch ↗ ]

Why I saved it:

"Good visualization of the hashmap."

────────────────────

Another explanation

[ Watch ↗ ]
```

Each resource can have:

* URL
* Title
* Creator
* Description
* Personal note
* Tags

The user should be able to save multiple explanations for the same problem.

---

# 💻 8. Final Solution

The final implementation should be stored separately from the initial thinking.

Example:

```python
def twoSum(nums, target):
    seen = {}

    for i, num in enumerate(nums):
        complement = target - num

        if complement in seen:
            return [seen[complement], i]

        seen[num] = i
```

Store:

* Language
* Code
* Time complexity
* Space complexity
* Explanation
* Optional alternative solutions

The final solution should **not overwrite the original thinking**.

---

# 🔄 9. Learning Evolution

One of ThinkCode's most important features.

Show how the user's understanding changed.

Example:

```text
MY LEARNING JOURNEY

🧠 Initial thought

"Maybe sorting can solve this."

        ↓

❌ Problem discovered

"Sorting changes the original indices."

        ↓

💡 New idea

"Can I remember previous values?"

        ↓

🤖 AI explanation

"Use a hashmap for constant-time lookup."

        ↓

🧠 Final mental model

"Calculate the complement and check
whether I've already seen it."

        ↓

💻 Final implementation

O(n) time
O(n) space
```

This helps the user understand **their own learning patterns**.

---

# 🏷️ 10. Patterns & Concepts

Problems can be connected to algorithmic patterns.

Examples:

```text
Arrays & Hashing
├── HashMap
├── HashSet
└── Frequency Counting

Two Pointers
├── Opposite Direction
└── Fast & Slow

Sliding Window
├── Fixed Window
└── Dynamic Window

Binary Search
├── Search Space
└── Boundary Search

Trees
├── DFS
├── BFS
└── Recursion

Graphs
├── DFS
├── BFS
├── Topological Sort
└── Union Find
```

Each pattern can have its own knowledge page.

For example:

```text
HashMap

Problems:
8

My mental model:
"Store information so future elements
can be checked quickly."

Common signals:
- Need fast lookup
- Pair/complement problems
- Frequency counting

Related problems:
Two Sum
Group Anagrams
Top K Frequent Elements
...
```

---

# 📈 11. Personal Progress Dashboard

The dashboard should focus on learning rather than gamification.

Example:

```text
Good afternoon 👋

Your Learning Space

────────────────────────────

Problems

42 total
27 completed
8 reviewing
7 learning

────────────────────────────

Patterns

HashMap       8
Two Pointers  6
Sliding Window 5
DFS           7
BFS           5

────────────────────────────

Recent Learning

3Sum
Binary Search
Valid Anagram
Group Anagrams

────────────────────────────

Continue

→ 3Sum
```

Optional statistics:

* Problems completed
* Problems revisited
* Patterns learned
* Thinking sessions
* Average thinking time
* Problems currently being reviewed

Statistics should support learning rather than encourage meaningless grinding.

---

# 🔁 12. Review System

ThinkCode should help users revisit old problems.

A problem can have statuses:

```text
🟡 Learning
🟢 Understood
🔵 Review
🔴 Confusing
⭐ Mastered
```

A review session might ask:

```text
Before looking at your notes...

How would you solve this problem today?

[ Start Review ]
```

The user's new reasoning can then be compared with their previous reasoning.

---

# 🔍 13. Search

Search across the entire personal knowledge base.

Examples:

```text
"hashmap"

"two pointers"

"the problem where I forgot the complement"

"O(n) lookup"

"problems where I initially used sorting"
```

Search should find:

* Problems
* Notes
* Patterns
* AI links
* YouTube resources
* Thinking sessions
* Code
* Mistakes
* Insights

---

# 🗂️ 14. Tags

Allow flexible tagging.

Examples:

```text
#hashmap
#twopointers
#arrays
#confusing
#needs-review
#mistake
#important
#pattern
#recursion
```

---

# 🧩 Problem Page

The main problem page should be the heart of ThinkCode.

Suggested layout:

```text
┌────────────────────────────────────────────────────┐
│ ← Problems                         3Sum             │
├────────────────────────────────────────────────────┤
│                                                    │
│ NeetCode · Medium                                  │
│ Arrays & Hashing · Two Pointers                   │
│                                                    │
│ [ Open Problem ↗ ]   [ Start Thinking ]            │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ 🧠 THINK                                           │
│                                                    │
│ Initial thoughts                                   │
│ Thinking sessions                                  │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ 💬 AI                                              │
│                                                    │
│ ChatGPT conversation ↗                             │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ 📊 UNDERSTAND                                      │
│                                                    │
│ Diagrams                                           │
│ Visualizations                                     │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ 📝 KNOWLEDGE                                       │
│                                                    │
│ Mental model                                       │
│ Key lessons                                        │
│ Mistakes                                            │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ 🎥 RESOURCES                                       │
│                                                    │
│ YouTube videos                                     │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ 💻 SOLUTION                                        │
│                                                    │
│ Code                                               │
│ Complexity                                         │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

# 🎨 UX / UI Principles

ThinkCode should feel:

* Calm
* Focused
* Modern
* Lightweight
* Personal
* Developer-oriented
* Easy to scan

Avoid turning the interface into a complicated productivity dashboard.

The primary goal is:

> **Reduce cognitive friction.**

The user should be able to quickly capture an idea without thinking about where it should be stored.

---

# 🧭 Main Navigation

Suggested navigation:

```text
ThinkCode

├── 🏠 Dashboard
├── 📚 Problems
├── 🧠 Patterns
├── 📝 Knowledge
├── 🔄 Review
└── ⚙️ Settings
```

Optional:

```text
🔍 Global Search
```

---

# 🏠 Dashboard

The dashboard should show:

```text
Continue Learning
Recently Viewed
Needs Review
Recent Insights
Patterns
Learning Statistics
```

The user should be able to immediately continue the last unfinished problem.

---

# 📚 Problems

Problem library with filters:

```text
Search...

Platform
Difficulty
Category
Pattern
Status
Tags
```

Example:

```text
┌─────────────────────────────────────────────┐
│ Two Sum                           🟢         │
│ Easy · Arrays & Hashing                     │
│ HashMap                                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 3Sum                              🟡         │
│ Medium · Arrays & Hashing                   │
│ Two Pointers                                 │
└─────────────────────────────────────────────┘
```

---

# 🧠 Patterns

A dedicated library of algorithmic patterns.

Example:

```text
HashMap
Two Pointers
Sliding Window
Binary Search
Stack
Linked List
Trees
Graphs
Heap
Backtracking
Dynamic Programming
Greedy
Intervals
Bit Manipulation
```

---

# 🔄 Review

A dedicated place for revisiting previously learned problems.

Example:

```text
Due for Review

3Sum
Last reviewed: 12 days ago

Binary Search
Last reviewed: 18 days ago

Group Anagrams
Last reviewed: 30 days ago
```

---

# 🗃️ Data Model

A simplified conceptual model:

```text
User
 │
 └── Problems
       │
       ├── Thinking Sessions
       │
       ├── AI Links
       │
       ├── Visualizations
       │
       ├── Notes
       │
       ├── Resources
       │
       ├── Solutions
       │
       ├── Patterns
       │
       └── Reviews
```

### Problem

```text
id
title
platform
external_url
difficulty
category
status
description
created_at
updated_at
```

### Thinking Session

```text
id
problem_id
duration
started_at
ended_at
thoughts
```

### AI Conversation

```text
id
problem_id
provider
title
url
description
created_at
```

### Resource

```text
id
problem_id
type
title
url
description
notes
```

### Visualization

```text
id
problem_id
title
type
content
```

### Note

```text
id
problem_id
title
content
type
```

### Solution

```text
id
problem_id
language
code
time_complexity
space_complexity
explanation
```

### Review

```text
id
problem_id
thoughts
confidence
reviewed_at
```

---

# 🔐 Privacy

ThinkCode is primarily a **personal knowledge system**.

User data should be treated as private by default.

Important principles:

* User's notes belong to the user
* AI conversation URLs are private
* Thinking history is private
* Solutions are private
* No public profile should be required
* No unnecessary data collection

If cloud synchronization is implemented, authentication and authorization must be designed carefully.

---

# 🚀 MVP

The first version should remain focused.

## MVP Features

### Problems

* Create problem
* Edit problem
* Delete problem
* Problem URL
* Difficulty
* Category
* Tags
* Status

### Thinking

* 15-minute timer
* Start / pause / finish
* Initial thoughts
* Thinking session history

### AI

* Add AI conversation URL
* Provider
* Title
* Personal description
* Open external conversation

### Resources

* Add YouTube URL
* Title
* Notes

### Knowledge

* Markdown notes
* Mental model
* Key lessons
* Mistakes

### Solution

* Code editor
* Language
* Complexity
* Explanation

### Organization

* Search
* Filters
* Tags
* Patterns

### Dashboard

* Recent problems
* Continue learning
* Problems needing review

---

# 🔮 Future Features

## AI-assisted reflection

Instead of solving the problem automatically, AI could analyze the user's thinking:

```text
Your initial approach:
Sorting

Potential issue:
Sorting destroys the original positional relationship.

Hint:
Consider whether you need to preserve information
about previously encountered values.
```

The AI should progressively reveal hints rather than immediately providing the solution.

---

## Automatic learning summaries

After a session:

```text
Today's Learning

You solved:
3 problems

New patterns:
2

Important insights:
4

Common mistake:
Using sorting before considering lookup structures.
```

---

## Spaced repetition

Automatically schedule problems for review.

Example:

```text
Day 1
Day 3
Day 7
Day 14
Day 30
```

The intervals can later become adaptive based on review performance.

---

## Algorithm animations

Potentially allow users to generate interactive animations for:

* Two pointers
* Sliding window
* Binary search
* BFS
* DFS
* Heap operations
* Sorting
* Dynamic programming

---

## AI-generated visualizations

The user could ask:

> "Visualize how the sliding window changes."

ThinkCode could generate a visualization associated with the problem.

---

## Knowledge Graph

Eventually, ThinkCode could connect concepts:

```text
                 Arrays
                   │
          ┌────────┴────────┐
          ↓                 ↓
       HashMap         Two Pointers
          │                 │
          ↓                 ↓
      Two Sum              3Sum
          │                 │
          └────────┬────────┘
                   ↓
              3Sum Variants
```

This would turn the application into a personal **algorithm knowledge graph**.

---

# 🛠️ Suggested Technology

For the first version, keep the architecture simple.

### Frontend

```text
React
TypeScript
Tailwind CSS
```

or:

```text
Next.js
TypeScript
Tailwind CSS
```

### Editor

```text
Monaco Editor
```

### Markdown

```text
Markdown editor + preview
```

### Visualization

Potential options:

```text
Mermaid
D3.js
React Flow
Custom SVG / Canvas
```

### Database

For a local-first MVP:

```text
SQLite
```

For a cloud version:

```text
PostgreSQL
```

### Authentication

Can be added when synchronization is required.

---

# 🏗️ Architecture Principle

ThinkCode should be designed around the idea of **local-first learning**.

The application should remain useful even without an internet connection for:

* Problems
* Notes
* Thinking sessions
* Code
* Visualizations
* Tags
* Personal knowledge

Internet access is primarily required for external resources such as:

* ChatGPT
* YouTube
* NeetCode
* Other external platforms

---

# 📁 Suggested Project Structure

For a modern web application:

```text
thinkcode/
│
├── app/
│   ├── dashboard/
│   ├── problems/
│   ├── patterns/
│   ├── knowledge/
│   ├── review/
│   └── settings/
│
├── components/
│   ├── problems/
│   ├── thinking/
│   ├── ai-links/
│   ├── resources/
│   ├── solutions/
│   ├── visualizations/
│   └── ui/
│
├── lib/
│   ├── database/
│   ├── search/
│   └── utilities/
│
├── types/
│
└── README.md
```

---

# 🧪 Example User Journey

A user opens a new NeetCode problem.

### Step 1

They create:

```text
3Sum
```

### Step 2

They click:

```text
🧠 Start Thinking
```

The 15-minute timer begins.

### Step 3

They write:

```text
# Maybe use a hashmap.

# Could solve it like Two Sum.

# But we need three numbers.

# Maybe nested loops?
```

### Step 4

Timer finishes.

The user still doesn't understand the optimal solution.

They add:

```text
💬 ChatGPT conversation
```

Only the conversation URL is stored.

### Step 5

They discover the two-pointer approach.

They create:

```text
💡 Key Insight

Sort the array.

Fix one number.

Then use two pointers for the remaining two numbers.
```

### Step 6

They attach a YouTube explanation.

### Step 7

They create a visualization.

### Step 8

They write their final solution.

### Step 9

They mark:

```text
🟢 Understood
```

### Step 10

Two weeks later, ThinkCode asks them to review 3Sum.

Instead of immediately opening the solution:

```text
How would you solve this today?

[ Start Review ]
```

The user writes their approach.

Only afterward do they reveal their previous notes.

This reinforces actual understanding.

---

# 🎯 Product Principles

ThinkCode should follow these principles throughout development.

### 1. Thinking before assistance

Don't encourage immediate AI answers.

### 2. Preserve mistakes

Wrong approaches are valuable learning data.

### 3. Separate thinking from solutions

Never replace the user's original reasoning with the final answer.

### 4. External AI, centralized memory

ChatGPT and other AI tools can remain external.

ThinkCode remembers where the useful conversation is.

### 5. Visual understanding

Algorithms should not be limited to text and code.

### 6. Personal knowledge over gamification

The goal isn't:

```text
Solve 500 problems.
```

The goal is:

```text
Understand why the solution works.
```

### 7. Reduce cognitive friction

Adding information should be fast and effortless.

### 8. Review the reasoning, not just the answer

The most valuable question isn't:

> "Did I solve it?"

It's:

> **"Do I understand it now?"**

---

# 🧠 The ThinkCode Learning Loop

The entire product can be summarized as:

```text
              ┌──────────────┐
              │    PROBLEM   │
              └──────┬───────┘
                     ↓
              ┌──────────────┐
              │     THINK    │
              │   15 minutes │
              └──────┬───────┘
                     ↓
              ┌──────────────┐
              │    EXPLORE   │
              │ ideas/errors │
              └──────┬───────┘
                     ↓
              ┌──────────────┐
              │    DISCUSS   │
              │   AI / Video │
              └──────┬───────┘
                     ↓
              ┌──────────────┐
              │  VISUALIZE   │
              │ diagrams     │
              └──────┬───────┘
                     ↓
              ┌──────────────┐
              │    SOLVE     │
              │    Code      │
              └──────┬───────┘
                     ↓
              ┌──────────────┐
              │   REFLECT    │
              │ key lessons  │
              └──────┬───────┘
                     ↓
              ┌──────────────┐
              │   REMEMBER   │
              │    Review    │
              └──────┬───────┘
                     │
                     └──────────→ Next Problem
```

---

# 🚧 Development Roadmap

## Phase 1 — Foundation

* [x] Project setup
* [x] Database
* [x] Application layout
* [x] Dashboard
* [x] Problem CRUD
* [x] Tags
* [x] Patterns

## Phase 2 — Thinking

* [x] Thinking timer
* [x] Thinking sessions
* [x] Initial thoughts
* [x] Session history

## Phase 3 — Knowledge

* [x] Markdown notes
* [x] Mental models
* [x] Key lessons
* [x] Mistakes
* [x] Solution editor

## Phase 4 — External Resources

* [x] AI conversation links
* [x] YouTube resources
* [x] External problem links
* [x] Resource notes

## Phase 5 — Visualization

* [x] Mermaid
* [x] Images
* [x] Diagrams
* [x] Visualization attachments

## Phase 6 — Review

* [x] Review sessions
* [x] Review history
* [x] Spaced repetition
* [x] Compare old vs new thinking

## Phase 7 — Intelligence

Deliberately not built. ThinkCode stores the *links* to your AI conversations
rather than calling an API, and keeping that line is what makes the rest of the
app honest: what is in here is what you actually thought, not what a model
summarised it into.

* [ ] AI-assisted reflection
* [ ] Automatic summaries
* [ ] Pattern recommendations
* [ ] Knowledge graph
* [ ] Personalized review recommendations

---

# 🚫 What ThinkCode Is Not

ThinkCode is **not** primarily:

* Another coding challenge platform
* Another AI coding assistant
* A replacement for NeetCode
* A replacement for ChatGPT
* A social network
* A competitive leaderboard
* A tool designed to maximize the number of solved problems

ThinkCode is the layer **around the learning process**.

It connects the tools you already use and preserves the knowledge you would otherwise lose.

---

# 🌟 The Long-Term Vision

Imagine opening ThinkCode six months from now.

Instead of seeing a list of 100 solved problems, you see your accumulated understanding:

```text
Your Algorithmic Knowledge

Arrays
 ├── HashMap
 ├── Two Pointers
 └── Sliding Window

Trees
 ├── DFS
 ├── BFS
 └── Recursion

Graphs
 ├── BFS
 ├── DFS
 └── Union Find

Dynamic Programming
 ├── 1D DP
 ├── 2D DP
 └── Knapsack
```

And when you click **Two Pointers**, ThinkCode shows:

```text
What you know

Mental models
Problems solved
Your mistakes
Your visualizations
Your best explanations
AI discussions
Videos
Solutions
Review history
```

That is the ultimate goal:

> **Build a personal second brain for algorithmic problem solving.**

---

# ThinkCode

### Think first. Understand deeply. Remember forever.

```text
🧠 Think
    ↓
💬 Explore
    ↓
📊 Understand
    ↓
💻 Solve
    ↓
📝 Reflect
    ↓
🔄 Review
    ↓
🧠 Remember
```

**ThinkCode is where your algorithm-solving journey becomes your personal knowledge base.**

---

# 🛠️ Development

## Stack

| Layer      | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Framework  | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Turbopack  |
| Deployment | Cloudflare Workers via `@opennextjs/cloudflare`                     |
| Database   | Cloudflare D1 (`DB` binding, database `thinkcode-db`)               |

## Getting started

```bash
npm install

# Local database — applies migrations + seed to local (miniflare) D1
npm run db:migrate:local

# Develop — next dev proxies D1/bindings through wrangler
npm run dev
```

**Live:** <https://thinkcode.cast-cue.workers.dev>

The D1 `database_id` is already committed in `wrangler.jsonc`, so a fresh clone
needs nothing copied by hand. Deploying needs two environment variables —
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. See
[`docs/DEPLOYING.md`](docs/DEPLOYING.md) for the full procedure, the token
permissions, and the CI setup that deploys on every merge to `main`.

## Scripts

| Script                   | What it does                                            |
| ------------------------ | ------------------------------------------------------- |
| `npm run dev`            | Local dev server (D1 proxied via wrangler)              |
| `npm run lint`           | ESLint                                                  |
| `npm run typecheck`      | `tsc --noEmit`                                          |
| `npm run build`          | `next build` (Turbopack)                                |
| `npm run preview`        | Build the OpenNext worker and preview it with wrangler  |
| `npm run deploy`         | Build + deploy the worker to Cloudflare                 |
| `npm run cf-typegen`     | Regenerate `worker-configuration.d.ts` from wrangler    |
| `npm run db:migrate:local`  | Apply migrations + seed to local D1                  |
| `npm run db:migrate:remote` | Apply migrations + seed to remote D1                 |

## Migrations

Numbered SQL files live in `migrations/` and are applied in order:

```bash
npm run db:migrate:local   # local miniflare D1
npm run db:migrate:remote  # remote Cloudflare D1
```

Every statement is idempotent (`CREATE TABLE IF NOT EXISTS`, `INSERT OR
IGNORE`), so re-running a migration is a no-op rather than a duplicate-key
error. Migrations are applied by hand, not by CI — see
[`docs/DEPLOYING.md`](docs/DEPLOYING.md) for why.

## Continuous integration

| Workflow | Trigger             | What it does                                          |
| -------- | ------------------- | ----------------------------------------------------- |
| `ci.yml` | every push and PR   | lint, typecheck, build — no credentials needed         |
| `deploy.yml` | push to `main`   | re-runs the gates, deploys, then curls the live worker |

The CI build needs no D1 binding: every data page is `force-dynamic`, so a
green check on a PR really does mean the build is reproducible anywhere.
