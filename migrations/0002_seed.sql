-- ThinkCode seed data (D1 / SQLite)
-- 0002_seed.sql
--
-- Uses readable fixed ids (p1, pat-hashmap, tag-hashmap, note-1, sol-1, ...).

-- ============================================================
-- Problems
-- ============================================================
INSERT OR IGNORE INTO problems (id, title, platform, external_url, difficulty, category, status, description) VALUES
  ('p1',  'Two Sum',                                    'NeetCode', 'https://neetcode.io/problems/two-integer-sum',    'easy',   'Arrays & Hashing', 'understood',
    'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.'),
  ('p2',  '3Sum',                                       'NeetCode', 'https://neetcode.io/problems/three-integer-sum',  'medium', 'Arrays & Hashing', 'learning',
    'Find all unique triplets in the array that sum to zero.'),
  ('p3',  'Valid Anagram',                              'NeetCode', 'https://neetcode.io/problems/is-anagram',         'easy',   'Arrays & Hashing', 'understood',
    'Return true if two strings are anagrams of each other.'),
  ('p4',  'Group Anagrams',                             'NeetCode', 'https://neetcode.io/problems/anagram-groups',    'medium', 'Arrays & Hashing', 'understood',
    'Group anagrams together into lists using their sorted form or a frequency signature.'),
  ('p5',  'Binary Search',                              'NeetCode', 'https://neetcode.io/problems/binary-search',     'easy',   'Binary Search',    'review',
    'Return the index of a target in a sorted array, or -1.'),
  ('p6',  'Contains Duplicate',                         'NeetCode', 'https://neetcode.io/problems/duplicate-integer', 'easy',   'Arrays & Hashing', 'mastered',
    'Return true if any value appears more than once in the array.'),
  ('p7',  'Container With Most Water',                  'LeetCode', 'https://leetcode.com/problems/container-with-most-water/description/', 'medium', 'Two Pointers', 'learning',
    'Find the two lines that together with the x-axis form a container holding the most water.'),
  ('p8',  'Longest Substring Without Repeating Characters', 'LeetCode', 'https://leetcode.com/problems/longest-substring-without-repeating-characters/description/', 'medium', 'Sliding Window', 'review',
    'Find the length of the longest substring without repeating characters.'),
  ('p9',  'Invert Binary Tree',                         'LeetCode', 'https://leetcode.com/problems/invert-binary-tree/description/', 'easy', 'Trees', 'understood',
    'Swap the left and right children of every node in a binary tree.'),
  ('p10', 'Reverse Linked List',                        'LeetCode', 'https://leetcode.com/problems/reverse-linked-list/description/', 'easy', 'Linked List', 'understood',
    'Reverse a singly linked list iteratively and recursively.');

-- ============================================================
-- Patterns
-- ============================================================
INSERT OR IGNORE INTO patterns (id, name, slug, category, description, mental_model, common_signals) VALUES
  ('pat-hashmap', 'HashMap', 'hashmap', 'Arrays & Hashing',
   'Store values so future lookups are O(1).',
   'Store information so future elements can be checked quickly.',
   'Need fast lookup\nPair or complement problems\nFrequency counting'),
  ('pat-hashset', 'HashSet', 'hashset', 'Arrays & Hashing',
   'Track membership of seen values in O(1).',
   'Remember what you have already seen.',
   'Duplicate detection\nMembership checks\nTrack visited values'),
  ('pat-twopointers', 'Two Pointers', 'two-pointers', 'Two Pointers',
   'Use two indices to scan a sorted or linear structure from opposite ends.',
   'Shrink the search space one pointer at a time.',
   'Array is sorted\nPair or triplet summing\nBoundary conditions'),
  ('pat-slidingwindow', 'Sliding Window', 'sliding-window', 'Sliding Window',
   'Maintain a window that expands and contracts over a sequence.',
   'Extend the right edge; shrink from the left when the constraint breaks.',
   'Longest or shortest subarray/substring\nContiguous sequence\nWindow with a constraint'),
  ('pat-stack', 'Stack', 'stack', 'Stack',
   'Use LIFO ordering to match, track, or undo elements.',
   'The most recent item is the one that matters.',
   'Matching brackets\nMonotonic stack problems\nHistory or undo'),
  ('pat-binarysearch', 'Binary Search', 'binary-search', 'Binary Search',
   'Halve the search space each step on monotonic data.',
   'If the data is sorted, compare the middle to decide which half to keep.',
   'Sorted array\nSearch in O(log n)\nBoundaries of a monotonic predicate'),
  ('pat-fastslow', 'Fast & Slow', 'fast-and-slow', 'Linked List',
   'Two pointers moving at different speeds over a linked list.',
   'The fast pointer laps the slow one exactly when a cycle exists.',
   'Cycle detection\nMiddle of a linked list\nLinked list traversal tricks'),
  ('pat-linkedlist', 'Linked List', 'linked-list', 'Linked List',
   'Manipulate nodes and pointers to reorder or transform a list.',
   'Draw the pointer changes before writing code.',
   'Node reordering\nPointer rewiring\nIterative vs recursive access'),
  ('pat-dfs', 'DFS', 'dfs', 'Trees & Graphs',
   'Explore a branch fully before backtracking.',
   'Go deep before you go wide; the call stack is your friend.',
   'Tree traversals\nPath existence\nCombinatorial exploration'),
  ('pat-bfs', 'BFS', 'bfs', 'Trees & Graphs',
   'Explore level by level using a queue.',
   'The first time you reach a node is along the shortest path.',
   'Shortest path (unweighted)\nLevel-order traversal\nLayer-by-layer expansion'),
  ('pat-heap', 'Heap', 'heap', 'Heap',
   'Always access the smallest or largest element in O(log n).',
   'A heap is a priority line; the extreme is always on top.',
   'Top-k elements\nRunning median\nScheduling by priority'),
  ('pat-backtracking', 'Backtracking', 'backtracking', 'Backtracking',
   'Build candidates incrementally and abandon dead ends.',
   'Extend, check, recurse, and undo.',
   'Permutations and combinations\nConstraint satisfaction\nDecision trees'),
  ('pat-1ddp', '1-D DP', '1-d-dp', 'Dynamic Programming',
   'Build an array of subproblem answers left to right.',
   'Each position depends only on previously computed positions.',
   'Fibonacci-like recurrences\nClimbing stairs / house robber\nMax subarray'),
  ('pat-2ddp', '2-D DP', '2-d-dp', 'Dynamic Programming',
   'Fill a table where each cell combines two subproblems.',
   'The grid of states tells you how subproblems connect.',
   'Edit distance\nLongest common subsequence\nGrid path problems'),
  ('pat-greedy', 'Greedy', 'greedy', 'Greedy',
   'Make the locally optimal choice hoping it is globally optimal.',
   'Pick the best thing now; prove it never hurts later.',
   'Interval scheduling\nActivity selection\nSpecial-case coin change'),
  ('pat-intervals', 'Intervals', 'intervals', 'Intervals',
   'Sort and merge overlapping ranges.',
   'Sort by start; an overlap is when next start < current end.',
   'Merge intervals\nMeeting rooms\nOverlap detection'),
  ('pat-bitmanip', 'Bit Manipulation', 'bit-manipulation', 'Bit Manipulation',
   'Use bitwise operators to model sets and parity.',
   'Bits are just booleans packed together.',
   'Counting bits\nXOR tricks\nSet membership with masks');

-- ============================================================
-- Problem -> Pattern links
-- ============================================================
INSERT OR IGNORE INTO problem_patterns (problem_id, pattern_id) VALUES
  ('p1',  'pat-hashmap'),
  ('p2',  'pat-hashmap'),
  ('p2',  'pat-twopointers'),
  ('p3',  'pat-hashmap'),
  ('p4',  'pat-hashmap'),
  ('p5',  'pat-binarysearch'),
  ('p6',  'pat-hashset'),
  ('p7',  'pat-twopointers'),
  ('p8',  'pat-slidingwindow'),
  ('p9',  'pat-dfs'),
  ('p10', 'pat-linkedlist');

-- ============================================================
-- Tags
-- ============================================================
INSERT OR IGNORE INTO tags (id, name, slug) VALUES
  ('tag-hashmap',       'hashmap',       'hashmap'),
  ('tag-twopointers',   'twopointers',   'twopointers'),
  ('tag-arrays',        'arrays',        'arrays'),
  ('tag-confusing',     'confusing',     'confusing'),
  ('tag-needs-review',  'needs-review',  'needs-review'),
  ('tag-mistake',       'mistake',       'mistake'),
  ('tag-important',     'important',     'important'),
  ('tag-recursion',     'recursion',     'recursion'),
  ('tag-slidingwindow', 'slidingwindow', 'slidingwindow'),
  ('tag-binarysearch',  'binarysearch',  'binarysearch');

INSERT OR IGNORE INTO problem_tags (problem_id, tag_id) VALUES
  ('p1',  'tag-hashmap'),
  ('p1',  'tag-arrays'),
  ('p1',  'tag-important'),
  ('p2',  'tag-twopointers'),
  ('p2',  'tag-important'),
  ('p3',  'tag-hashmap'),
  ('p3',  'tag-arrays'),
  ('p4',  'tag-hashmap'),
  ('p4',  'tag-arrays'),
  ('p5',  'tag-binarysearch'),
  ('p5',  'tag-needs-review'),
  ('p6',  'tag-hashmap'),
  ('p6',  'tag-arrays'),
  ('p7',  'tag-twopointers'),
  ('p8',  'tag-slidingwindow'),
  ('p8',  'tag-confusing'),
  ('p9',  'tag-recursion'),
  ('p10', 'tag-recursion');

-- ============================================================
-- Two Sum (p1) — full learning journey
-- ============================================================
INSERT OR IGNORE INTO thinking_sessions (id, problem_id, duration_seconds, started_at, ended_at, thoughts) VALUES
  ('sess-1', 'p1', 900, '2026-08-15 09:00:00', '2026-08-15 09:15:00',
   '# Maybe sort the array.
# But sorting loses original indices.
# Can I remember values I''ve seen?');

INSERT OR IGNORE INTO ai_conversations (id, problem_id, provider, title, url, description, created_at) VALUES
  ('ai-1', 'p1', 'ChatGPT', 'Why does the hashmap approach work?', 'https://chatgpt.com/c/example',
   'AI explained the complement idea in a way I finally understood.', '2026-08-15 09:20:00'),
  ('ai-2', 'p1', 'AI Studio', 'Turn my brute force into a second pair', 'https://aistudio.google.com/prompts/chat/2',
    'Asked for the pair-tracking version of brute force; the trace table finally made the index bookkeeping obvious.',
    '2026-08-15 09:35:00');

INSERT OR IGNORE INTO resources (id, problem_id, type, title, url, creator, description, notes, created_at) VALUES
  ('res-1', 'p1', 'youtube', 'Two Sum Explained', 'https://www.youtube.com/watch?v=KLlXCFG5TnA', 'NeetCode',
   'NeetCode walkthrough of the two-pass and one-pass hashmap solutions.',
   'Great visualization of the seen-values map.', '2026-08-15 10:00:00');

INSERT OR IGNORE INTO visualizations (id, problem_id, title, type, content, created_at) VALUES
  ('viz-1', 'p1', 'Two Sum complement lookup', 'mermaid',
'flowchart TD
    Start["nums = [2, 7, 11, 15], target = 9"] --> Cur["current = 2"]
    Cur --> Comp{"complement = 9 - 2<br/>= 7"}
    Comp --> Seen{"has 7 been seen?"}
    Seen -- "no" --> Add["remember 2 -> index 0"]
    Add --> Cur2["current = 7"]
    Cur2 --> Comp2{"complement = 9 - 7<br/>= 2"}
    Comp2 --> Seen2{"has 2 been seen?"}
    Seen2 -- "yes" --> Found["return [0, 1]"]',
   '2026-08-15 10:05:00');

INSERT OR IGNORE INTO notes (id, problem_id, title, content, type, created_at, updated_at) VALUES
  ('note-1', 'p1', 'Mental model', 'Fix one number, calculate the complement, check if it was already seen.', 'mental_model', '2026-08-15 10:10:00', '2026-08-15 10:10:00'),
  ('note-2', 'p1', 'Key lesson', 'Sorting destroys the original positional relationship between elements.', 'key_lesson', '2026-08-15 10:12:00', '2026-08-15 10:12:00'),
  ('note-3', 'p1', 'My mistake', 'I initially tried sorting, which broke index tracking. A hashmap preserves the original positions.', 'mistake', '2026-08-15 10:15:00', '2026-08-15 10:15:00');

INSERT OR IGNORE INTO solutions (id, problem_id, language, code, time_complexity, space_complexity, explanation, alternatives, created_at, updated_at) VALUES
  ('sol-1', 'p1', 'python',
'def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []',
   'O(n)', 'O(n)',
   'One pass: for each number, compute the complement and check if it was already seen.
If not, remember the current number with its index for future elements.',
   '[{"label":"Brute force","code":"def two_sum(nums, target):\\n    for i in range(len(nums)):\\n        for j in range(i + 1, len(nums)):\\n            if nums[i] + nums[j] == target:\\n                return [i, j]\\n    return []\\n\\n# O(n^2) time, O(1) space"}]',
   '2026-08-15 10:20:00', '2026-08-15 10:20:00');

INSERT OR IGNORE INTO reviews (id, problem_id, thoughts, confidence, elapsed_days, reviewed_at, next_review_at) VALUES
  ('rev-1', 'p1',
   'Remembered the complement trick but hesitated on why sorting fails. Review lesson 2 again.', 3, 3,
   '2026-09-01 09:30:00', '2026-09-14 09:30:00'),
  ('rev-2', 'p1',
   'Solved from scratch. Fixed one number, computed the complement, pulled the index from the map.', 5, 10,
   '2026-09-20 09:30:00', '2026-10-11 09:30:00');

-- ============================================================
-- A few more sessions + notes so the lists are not empty
-- ============================================================
INSERT OR IGNORE INTO thinking_sessions (id, problem_id, duration_seconds, started_at, ended_at, thoughts) VALUES
  ('sess-2', 'p8', 900, '2026-08-20 14:00:00', '2026-08-20 14:15:00',
   '# Start with brute force: check every substring O(n^2).
# Can I grow the window only when it stays valid?
# Keep the left boundary past the last occurrence of each character.'),
  ('sess-3', 'p2', 900, '2026-08-25 16:00:00', '2026-08-25 16:15:00',
   '# Sort first, then fix one number and use two pointers on the tail.
# Careful: skip duplicates at every level.');

INSERT OR IGNORE INTO notes (id, problem_id, title, content, type, created_at, updated_at) VALUES
  ('note-4', 'p8', 'Mental model',
   'Expand the window with the right pointer; whenever a character repeats, move the left pointer just past its previous occurrence. The answer is the max window ever seen.',
   'mental_model', '2026-08-20 14:20:00', '2026-08-20 14:20:00'),
  ('note-5', 'p2', 'Mental model',
   'Fix one number, then reduce the remaining range to a Two Sum problem solved with two pointers on the sorted tail. Skip duplicates to keep the triplets unique.',
   'mental_model', '2026-08-25 16:20:00', '2026-08-25 16:20:00');

-- ============================================================
-- More external resources (RESOURCES section)
-- ------------------------------------------------------------
-- 3Sum (p2) is deliberately left without resources or AI links so the
-- section empty states are visible on a real problem page.
-- ============================================================
INSERT OR IGNORE INTO resources (id, problem_id, type, title, url, creator, description, notes, created_at) VALUES
  ('res-2', 'p3', 'article', 'Counting vs sorting for an anagram check', 'https://leetcode.com/problems/valid-anagram/discuss/', 'LeetCode Discuss',
   'Community thread comparing the 26-bucket frequency count with sorting both strings; the O(n) version with no extra array is the one to remember.',
   'The 26-bucket version lines up with the frequency-table mental model I use for Group Anagrams.', '2026-08-16 08:30:00'),
  ('res-3', 'p8', 'article', 'Sliding window method, from first principles', 'https://en.wikipedia.org/wiki/Sliding_window_method', 'Wikipedia',
   'Short reference on why the window only ever moves forward: expand on the right, contract on the left, and keep the best window seen so far.',
   'Answered "why can the left pointer never go back?" in one paragraph.', '2026-08-20 15:00:00'),
  ('res-4', 'p5', 'article', 'Binary search boundary cheat sheet', 'https://leetcode.com/problems/binary-search/discuss/', 'LeetCode Discuss',
   'A table of half-open vs closed interval templates for the four search shapes I keep mixing up.',
   'Coming back to this one before the review date.', '2026-08-28 11:15:00');