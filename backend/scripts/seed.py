"""Seed the database with a curated problem set and a global list.

Idempotent: safe to run multiple times (upserts by slug/name).

Usage:
    python -m scripts.seed
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal  # noqa: E402
from app.models.list import ProblemList  # noqa: E402
from app.models.list_problem import ListProblem  # noqa: E402
from app.models.problem import Problem  # noqa: E402

GLOBAL_LIST_NAME = "NeetCode 150"
GLOBAL_LIST_DESCRIPTION = (
    "Curated set of foundational problems covering the core interview patterns."
)

# (title, slug, platform, platform_url, difficulty, topic_tags, company_tags)
PROBLEMS = [
    ("Two Sum", "two-sum", "leetcode", "https://leetcode.com/problems/two-sum/", "easy",
     ["Array", "Hash Table"], ["Google", "Amazon"]),
    ("Contains Duplicate", "contains-duplicate", "leetcode",
     "https://leetcode.com/problems/contains-duplicate/", "easy",
     ["Array", "Hash Table"], ["Adobe"]),
    ("Valid Anagram", "valid-anagram", "leetcode",
     "https://leetcode.com/problems/valid-anagram/", "easy",
     ["Hash Table", "String", "Sorting"], ["Amazon"]),
    ("Group Anagrams", "group-anagrams", "leetcode",
     "https://leetcode.com/problems/group-anagrams/", "medium",
     ["Hash Table", "String", "Sorting"], ["Amazon", "Uber"]),
    ("Top K Frequent Elements", "top-k-frequent-elements", "leetcode",
     "https://leetcode.com/problems/top-k-frequent-elements/", "medium",
     ["Array", "Hash Table", "Heap", "Sorting"], ["Amazon", "Meta"]),
    ("Product of Array Except Self", "product-of-array-except-self", "leetcode",
     "https://leetcode.com/problems/product-of-array-except-self/", "medium",
     ["Array"], ["Amazon", "Meta", "Microsoft"]),
    ("Valid Sudoku", "valid-sudoku", "leetcode",
     "https://leetcode.com/problems/valid-sudoku/", "medium",
     ["Array", "Hash Table", "Matrix"], ["Apple"]),
    ("Longest Consecutive Sequence", "longest-consecutive-sequence", "leetcode",
     "https://leetcode.com/problems/longest-consecutive-sequence/", "medium",
     ["Array", "Hash Table"], ["Google", "Meta"]),
    ("Valid Palindrome", "valid-palindrome", "leetcode",
     "https://leetcode.com/problems/valid-palindrome/", "easy",
     ["Two Pointers", "String"], ["Microsoft"]),
    ("Two Sum II - Input Array Is Sorted", "two-sum-ii-input-array-is-sorted", "leetcode",
     "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", "medium",
     ["Two Pointers", "Array", "Binary Search"], ["Amazon"]),
    ("3Sum", "3sum", "leetcode", "https://leetcode.com/problems/3sum/", "medium",
     ["Two Pointers", "Array", "Sorting"], ["Amazon", "Meta", "Microsoft"]),
    ("Container With Most Water", "container-with-most-water", "leetcode",
     "https://leetcode.com/problems/container-with-most-water/", "medium",
     ["Two Pointers", "Array", "Greedy"], ["Google", "Bloomberg"]),
    ("Trapping Rain Water", "trapping-rain-water", "leetcode",
     "https://leetcode.com/problems/trapping-rain-water/", "hard",
     ["Two Pointers", "Array", "Stack"], ["Amazon", "Google", "Goldman Sachs"]),
    ("Best Time to Buy and Sell Stock", "best-time-to-buy-and-sell-stock", "leetcode",
     "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", "easy",
     ["Sliding Window", "Array", "Dynamic Programming"], ["Amazon", "Meta"]),
    ("Longest Substring Without Repeating Characters",
     "longest-substring-without-repeating-characters", "leetcode",
     "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
     "medium", ["Sliding Window", "Hash Table", "String"], ["Amazon", "Adobe"]),
    ("Longest Repeating Character Replacement",
     "longest-repeating-character-replacement", "leetcode",
     "https://leetcode.com/problems/longest-repeating-character-replacement/",
     "medium", ["Sliding Window", "String", "Hash Table"], ["Google"]),
    ("Minimum Window Substring", "minimum-window-substring", "leetcode",
     "https://leetcode.com/problems/minimum-window-substring/", "hard",
     ["Sliding Window", "String", "Hash Table"], ["Meta", "Uber"]),
    ("Valid Parentheses", "valid-parentheses", "leetcode",
     "https://leetcode.com/problems/valid-parentheses/", "easy",
     ["Stack", "String"], ["Amazon", "Google", "Bloomberg"]),
    ("Min Stack", "min-stack", "leetcode", "https://leetcode.com/problems/min-stack/",
     "medium", ["Stack", "Design"], ["Amazon"]),
    ("Evaluate Reverse Polish Notation", "evaluate-reverse-polish-notation", "leetcode",
     "https://leetcode.com/problems/evaluate-reverse-polish-notation/", "medium",
     ["Stack", "Math"], ["Meta"]),
    ("Generate Parentheses", "generate-parentheses", "leetcode",
     "https://leetcode.com/problems/generate-parentheses/", "medium",
     ["Stack", "Backtracking", "Recursion"], ["Google", "Meta"]),
    ("Daily Temperatures", "daily-temperatures", "leetcode",
     "https://leetcode.com/problems/daily-temperatures/", "medium",
     ["Stack", "Array"], ["Amazon", "TikTok"]),
    ("Binary Search", "binary-search", "leetcode",
     "https://leetcode.com/problems/binary-search/", "easy",
     ["Binary Search", "Array"], ["Google"]),
    ("Search in Rotated Sorted Array", "search-in-rotated-sorted-array", "leetcode",
     "https://leetcode.com/problems/search-in-rotated-sorted-array/", "medium",
     ["Binary Search", "Array"], ["Amazon", "Microsoft", "Meta"]),
    ("Find Minimum in Rotated Sorted Array",
     "find-minimum-in-rotated-sorted-array", "leetcode",
     "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
     "medium", ["Binary Search", "Array"], ["Microsoft", "Amazon"]),
    ("Koko Eating Bananas", "koko-eating-bananas", "leetcode",
     "https://leetcode.com/problems/koko-eating-bananas/", "medium",
     ["Binary Search", "Array"], ["Google", "Netflix"]),
    ("Reverse Linked List", "reverse-linked-list", "leetcode",
     "https://leetcode.com/problems/reverse-linked-list/", "easy",
     ["Linked List", "Recursion"], ["Amazon", "Microsoft", "Apple"]),
    ("Merge Two Sorted Lists", "merge-two-sorted-lists", "leetcode",
     "https://leetcode.com/problems/merge-two-sorted-lists/", "easy",
     ["Linked List", "Recursion"], ["Amazon", "Apple"]),
    ("Reorder List", "reorder-list", "leetcode",
     "https://leetcode.com/problems/reorder-list/", "medium",
     ["Linked List", "Two Pointers"], ["Meta", "Amazon"]),
    ("Remove Nth Node From End of List",
     "remove-nth-node-from-end-of-list", "leetcode",
     "https://leetcode.com/problems/remove-nth-node-from-end-of-list/",
     "medium", ["Linked List", "Two Pointers"], ["Meta"]),
    ("Linked List Cycle", "linked-list-cycle", "leetcode",
     "https://leetcode.com/problems/linked-list-cycle/", "easy",
     ["Linked List", "Two Pointers"], ["Amazon", "Bloomberg"]),
    ("Merge k Sorted Lists", "merge-k-sorted-lists", "leetcode",
     "https://leetcode.com/problems/merge-k-sorted-lists/", "hard",
     ["Linked List", "Heap", "Sorting"], ["Google", "Amazon", "Meta"]),
    ("Invert Binary Tree", "invert-binary-tree", "leetcode",
     "https://leetcode.com/problems/invert-binary-tree/", "easy",
     ["Tree", "Recursion"], ["Google"]),
    ("Maximum Depth of Binary Tree", "maximum-depth-of-binary-tree", "leetcode",
     "https://leetcode.com/problems/maximum-depth-of-binary-tree/", "easy",
     ["Tree", "Recursion"], ["Amazon", "Microsoft"]),
    ("Same Tree", "same-tree", "leetcode", "https://leetcode.com/problems/same-tree/",
     "easy", ["Tree", "Recursion"], ["Amazon", "Bloomberg"]),
    ("Subtree of Another Tree", "subtree-of-another-tree", "leetcode",
     "https://leetcode.com/problems/subtree-of-another-tree/", "easy",
     ["Tree", "Recursion"], ["Meta"]),
    ("Lowest Common Ancestor of a Binary Search Tree",
     "lowest-common-ancestor-of-a-binary-search-tree", "leetcode",
     "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
     "medium", ["Tree", "Binary Search", "Recursion"], ["Amazon", "Meta"]),
    ("Binary Tree Level Order Traversal",
     "binary-tree-level-order-traversal", "leetcode",
     "https://leetcode.com/problems/binary-tree-level-order-traversal/",
     "medium", ["Tree", "Graph"], ["Amazon", "Microsoft", "Meta"]),
    ("Validate Binary Search Tree", "validate-binary-search-tree", "leetcode",
     "https://leetcode.com/problems/validate-binary-search-tree/", "medium",
     ["Tree", "Binary Search", "Recursion"], ["Meta", "Microsoft"]),
    ("Kth Smallest Element in a BST", "kth-smallest-element-in-a-bst", "leetcode",
     "https://leetcode.com/problems/kth-smallest-element-in-a-bst/", "medium",
     ["Tree", "Binary Search", "Recursion"], ["Amazon", "Google"]),
    ("Construct Binary Tree from Preorder and Inorder Traversal",
     "construct-binary-tree-from-preorder-and-inorder-traversal", "leetcode",
     "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/",
     "medium", ["Tree", "Recursion"], ["Microsoft", "Amazon"]),
    ("Binary Tree Maximum Path Sum", "binary-tree-maximum-path-sum", "leetcode",
     "https://leetcode.com/problems/binary-tree-maximum-path-sum/", "hard",
     ["Tree", "Dynamic Programming", "Recursion"], ["Meta", "Microsoft"]),
    ("Serialize and Deserialize Binary Tree",
     "serialize-and-deserialize-binary-tree", "leetcode",
     "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
     "hard", ["Tree", "Design", "Recursion"], ["Google", "Amazon", "Meta"]),
    ("Implement Trie (Prefix Tree)", "implement-trie-prefix-tree", "leetcode",
     "https://leetcode.com/problems/implement-trie-prefix-tree/", "medium",
     ["Trie", "Design", "String"], ["Google", "Amazon"]),
    ("Design Add and Search Words Data Structure",
     "design-add-and-search-words-data-structure", "leetcode",
     "https://leetcode.com/problems/design-add-and-search-words-data-structure/",
     "medium", ["Trie", "Design", "String"], ["Meta"]),
    ("Word Search II", "word-search-ii", "leetcode",
     "https://leetcode.com/problems/word-search-ii/", "hard",
     ["Trie", "Backtracking", "Matrix"], ["Google", "Uber"]),
    ("Find Median from Data Stream", "find-median-from-data-stream", "leetcode",
     "https://leetcode.com/problems/find-median-from-data-stream/", "hard",
     ["Heap", "Design", "Sorting"], ["Google", "Amazon"]),
    ("Kth Largest Element in an Array", "kth-largest-element-in-an-array", "leetcode",
     "https://leetcode.com/problems/kth-largest-element-in-an-array/", "medium",
     ["Heap", "Sorting", "Array"], ["Amazon", "Meta"]),
    ("Task Scheduler", "task-scheduler", "leetcode",
     "https://leetcode.com/problems/task-scheduler/", "medium",
     ["Heap", "Greedy", "Array"], ["Meta", "Amazon"]),
    ("Number of Islands", "number-of-islands", "leetcode",
     "https://leetcode.com/problems/number-of-islands/", "medium",
     ["Graph", "Matrix"], ["Amazon", "Google", "Microsoft"]),
    ("Clone Graph", "clone-graph", "leetcode",
     "https://leetcode.com/problems/clone-graph/", "medium",
     ["Graph", "Hash Table", "Recursion"], ["Meta", "Google"]),
    ("Pacific Atlantic Water Flow", "pacific-atlantic-water-flow", "leetcode",
     "https://leetcode.com/problems/pacific-atlantic-water-flow/", "medium",
     ["Graph", "Matrix"], ["Google"]),
    ("Course Schedule", "course-schedule", "leetcode",
     "https://leetcode.com/problems/course-schedule/", "medium",
     ["Graph"], ["Amazon", "Meta", "Microsoft"]),
    ("Redundant Connection", "redundant-connection", "leetcode",
     "https://leetcode.com/problems/redundant-connection/", "medium",
     ["Graph"], ["Google"]),
    ("Word Ladder", "word-ladder", "leetcode",
     "https://leetcode.com/problems/word-ladder/", "hard",
     ["Graph", "String"], ["Amazon", "Meta"]),
    ("Climbing Stairs", "climbing-stairs", "leetcode",
     "https://leetcode.com/problems/climbing-stairs/", "easy",
     ["Dynamic Programming", "Math"], ["Amazon", "Adobe"]),
    ("House Robber", "house-robber", "leetcode",
     "https://leetcode.com/problems/house-robber/", "medium",
     ["Dynamic Programming", "Array"], ["Amazon", "Google"]),
    ("House Robber II", "house-robber-ii", "leetcode",
     "https://leetcode.com/problems/house-robber-ii/", "medium",
     ["Dynamic Programming", "Array"], ["Amazon"]),
    ("Longest Palindromic Substring", "longest-palindromic-substring", "leetcode",
     "https://leetcode.com/problems/longest-palindromic-substring/", "medium",
     ["Dynamic Programming", "Two Pointers", "String"], ["Amazon", "Microsoft"]),
    ("Palindromic Substrings", "palindromic-substrings", "leetcode",
     "https://leetcode.com/problems/palindromic-substrings/", "medium",
     ["Dynamic Programming", "Two Pointers", "String"], ["Meta"]),
    ("Decode Ways", "decode-ways", "leetcode",
     "https://leetcode.com/problems/decode-ways/", "medium",
     ["Dynamic Programming", "String"], ["Meta", "Uber"]),
    ("Coin Change", "coin-change", "leetcode",
     "https://leetcode.com/problems/coin-change/", "medium",
     ["Dynamic Programming", "Array"], ["Amazon", "Google", "Goldman Sachs"]),
    ("Maximum Product Subarray", "maximum-product-subarray", "leetcode",
     "https://leetcode.com/problems/maximum-product-subarray/", "medium",
     ["Dynamic Programming", "Array"], ["Amazon", "Meta"]),
    ("Word Break", "word-break", "leetcode",
     "https://leetcode.com/problems/word-break/", "medium",
     ["Dynamic Programming", "String"], ["Amazon", "Meta", "Google"]),
    ("Longest Increasing Subsequence", "longest-increasing-subsequence", "leetcode",
     "https://leetcode.com/problems/longest-increasing-subsequence/", "medium",
     ["Dynamic Programming", "Binary Search"], ["Microsoft", "Google"]),
    ("Unique Paths", "unique-paths", "leetcode",
     "https://leetcode.com/problems/unique-paths/", "medium",
     ["Dynamic Programming", "Matrix", "Math"], ["Amazon", "Google"]),
    ("Longest Common Subsequence", "longest-common-subsequence", "leetcode",
     "https://leetcode.com/problems/longest-common-subsequence/", "medium",
     ["Dynamic Programming", "String"], ["Amazon", "Microsoft"]),
    ("Maximum Subarray", "maximum-subarray", "leetcode",
     "https://leetcode.com/problems/maximum-subarray/", "medium",
     ["Dynamic Programming", "Array"], ["Amazon", "Microsoft", "Bloomberg"]),
    ("Jump Game", "jump-game", "leetcode",
     "https://leetcode.com/problems/jump-game/", "medium",
     ["Greedy", "Array"], ["Amazon", "Google", "Microsoft"]),
    ("Gas Station", "gas-station", "leetcode",
     "https://leetcode.com/problems/gas-station/", "medium",
     ["Greedy", "Array"], ["Meta"]),
    ("Insert Interval", "insert-interval", "leetcode",
     "https://leetcode.com/problems/insert-interval/", "medium",
     ["Array", "Sorting", "Greedy"], ["Google", "Meta"]),
    ("Merge Intervals", "merge-intervals", "leetcode",
     "https://leetcode.com/problems/merge-intervals/", "medium",
     ["Array", "Sorting"], ["Amazon", "Meta", "Microsoft", "Bloomberg"]),
    ("Non-overlapping Intervals", "non-overlapping-intervals", "leetcode",
     "https://leetcode.com/problems/non-overlapping-intervals/", "medium",
     ["Array", "Sorting", "Greedy"], ["Meta"]),
    ("Rotate Image", "rotate-image", "leetcode",
     "https://leetcode.com/problems/rotate-image/", "medium",
     ["Matrix", "Array"], ["Amazon", "Microsoft", "Apple"]),
    ("Spiral Matrix", "spiral-matrix", "leetcode",
     "https://leetcode.com/problems/spiral-matrix/", "medium",
     ["Matrix", "Array"], ["Amazon", "Microsoft", "Adobe"]),
    ("Set Matrix Zeroes", "set-matrix-zeroes", "leetcode",
     "https://leetcode.com/problems/set-matrix-zeroes/", "medium",
     ["Matrix", "Array"], ["Amazon", "Meta", "Microsoft"]),
    ("Subsets", "subsets", "leetcode", "https://leetcode.com/problems/subsets/",
     "medium", ["Backtracking", "Array", "Recursion"], ["Amazon", "Meta", "Google"]),
    ("Combination Sum", "combination-sum", "leetcode",
     "https://leetcode.com/problems/combination-sum/", "medium",
     ["Backtracking", "Array", "Recursion"], ["Amazon", "Meta", "Uber"]),
    ("Permutations", "permutations", "leetcode",
     "https://leetcode.com/problems/permutations/", "medium",
     ["Backtracking", "Array", "Recursion"], ["Amazon", "Microsoft"]),
    ("Word Search", "word-search", "leetcode",
     "https://leetcode.com/problems/word-search/", "medium",
     ["Backtracking", "Matrix", "Recursion"], ["Amazon", "Microsoft", "Bloomberg"]),
]


def seed():
    db = SessionLocal()
    try:
        problems_by_slug = {}
        for title, slug, platform, url, difficulty, topics, companies in PROBLEMS:
            existing = db.query(Problem).filter(Problem.slug == slug).first()
            if existing:
                problems_by_slug[slug] = existing
                continue
            p = Problem(
                title=title,
                slug=slug,
                platform=platform,
                platform_url=url,
                difficulty=difficulty,
                topic_tags=topics,
                company_tags=companies,
            )
            db.add(p)
            db.flush()
            problems_by_slug[slug] = p
        db.commit()
        print(f"Seeded {len(problems_by_slug)} problems.")

        global_list = db.query(ProblemList).filter(
            ProblemList.name == GLOBAL_LIST_NAME, ProblemList.is_global.is_(True)
        ).first()
        if not global_list:
            global_list = ProblemList(
                name=GLOBAL_LIST_NAME,
                description=GLOBAL_LIST_DESCRIPTION,
                is_global=True,
                is_custom=False,
            )
            db.add(global_list)
            db.flush()
        db.commit()

        existing_problem_ids = {
            row.problem_id
            for row in db.query(ListProblem.problem_id).filter(
                ListProblem.list_id == global_list.id
            ).all()
        }
        order = len(existing_problem_ids)
        added = 0
        for _, slug, *_rest in PROBLEMS:
            p = problems_by_slug[slug]
            if p.id in existing_problem_ids:
                continue
            db.add(ListProblem(list_id=global_list.id, problem_id=p.id, order=order))
            order += 1
            added += 1
        db.commit()
        print(f"Added {added} problems to '{GLOBAL_LIST_NAME}' (list_id={global_list.id}).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
