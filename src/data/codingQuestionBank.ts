import { CodingProblem, CodingDifficulty, CodingSubject } from '../types/coding';

export const DEFAULT_CODING_QUESTION_BANK: CodingProblem[] = [
  // ==========================================
  // ARRAYS — EASY
  // ==========================================
  {
    id: 'dsa_arr_01',
    title: 'Two Sum',
    difficulty: 'Easy',
    subject: 'DSA',
    topic: 'Arrays',
    tags: ['Arrays', 'Hashing', 'Two Pointers'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
      {
        input: 'nums = [3, 3], target = 6',
        output: '[0, 1]',
        explanation: 'nums[0] + nums[1] = 3 + 3 = 6.',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    expectedComplexity: {
      time: 'O(N)',
      space: 'O(N)',
    },
    functionSignature: {
      C: 'int* twoSum(int* nums, int numsSize, int target, int* returnSize)',
      'C++': 'vector<int> twoSum(vector<int>& nums, int target)',
      Java: 'public int[] twoSum(int[] nums, int target)',
      Python: 'def twoSum(self, nums: List[int], target: int) -> List[int]:',
      JavaScript: 'function twoSum(nums, target)',
    },
    starterCode: {
      C: `#include <stdio.h>\n#include <stdlib.h>\n\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    *returnSize = 2;\n    int* res = (int*)malloc(2 * sizeof(int));\n    // Write your solution here\n    return res;\n}`,
      'C++': `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};`,
      Java: `import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[2];\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your solution here\n        pass`,
      JavaScript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  // Write your solution here\n  return [];\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'nums = [2, 7, 11, 15], target = 9', expectedOutput: '[0, 1]', isHidden: false },
      { id: 'tc_2', input: 'nums = [3, 2, 4], target = 6', expectedOutput: '[1, 2]', isHidden: false },
      { id: 'tc_3', input: 'nums = [3, 3], target = 6', expectedOutput: '[0, 1]', isHidden: true },
      { id: 'tc_4', input: 'nums = [-1, -2, -3, -4, -5], target = -8', expectedOutput: '[2, 4]', isHidden: true },
    ],
    hints: [
      'A brute force approach scans every pair with nested loops in O(N^2).',
      'Can you use a Hash Table to look up the complement (target - nums[i]) in O(1) time?',
    ],
    editorial: {
      approach: 'Maintain a hash map storing value to index. As we traverse nums, check if (target - num) exists in the map.',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(N)',
    },
  },
  {
    id: 'dsa_arr_02',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    subject: 'DSA',
    topic: 'Arrays',
    tags: ['Arrays', 'Dynamic Programming', 'Greedy'],
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`-th day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.`,
    examples: [
      {
        input: 'prices = [7, 1, 5, 3, 6, 4]',
        output: '5',
        explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5.',
      },
      {
        input: 'prices = [7, 6, 4, 3, 1]',
        output: '0',
        explanation: 'In this case, no transactions are done and the max profit = 0.',
      },
    ],
    constraints: [
      '1 <= prices.length <= 10^5',
      '0 <= prices[i] <= 10^4',
    ],
    expectedComplexity: {
      time: 'O(N)',
      space: 'O(1)',
    },
    functionSignature: {
      C: 'int maxProfit(int* prices, int pricesSize)',
      'C++': 'int maxProfit(vector<int>& prices)',
      Java: 'public int maxProfit(int[] prices)',
      Python: 'def maxProfit(self, prices: List[int]) -> int:',
      JavaScript: 'function maxProfit(prices)',
    },
    starterCode: {
      C: `#include <stdio.h>\n\nint maxProfit(int* prices, int pricesSize) {\n    // Write your solution here\n    return 0;\n}`,
      'C++': `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Write your solution here\n        return 0;\n    }\n};`,
      Java: `class Solution {\n    public int maxProfit(int[] prices) {\n        // Write your solution here\n        return 0;\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        # Write your solution here\n        pass`,
      JavaScript: `function maxProfit(prices) {\n  // Write your solution here\n  return 0;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'prices = [7, 1, 5, 3, 6, 4]', expectedOutput: '5', isHidden: false },
      { id: 'tc_2', input: 'prices = [7, 6, 4, 3, 1]', expectedOutput: '0', isHidden: false },
      { id: 'tc_3', input: 'prices = [2, 4, 1]', expectedOutput: '2', isHidden: true },
    ],
    hints: [
      'Keep track of the minimum price observed so far.',
      'At each day, calculate profit if sold today: price - minPrice.',
    ],
    editorial: {
      approach: 'Single pass tracking minimum buying price and updating maximum profit seen so far.',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
    },
  },
  {
    id: 'dsa_arr_03',
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    subject: 'DSA',
    topic: 'Arrays',
    tags: ['Arrays', 'Hash Table', 'Sorting'],
    description: `Given an integer array \`nums\`, return \`true\` if any value appears **at least twice** in the array, and return \`false\` if every element is distinct.`,
    examples: [
      {
        input: 'nums = [1, 2, 3, 1]',
        output: 'true',
        explanation: '1 appears at index 0 and 3.',
      },
      {
        input: 'nums = [1, 2, 3, 4]',
        output: 'false',
        explanation: 'All elements are distinct.',
      },
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^9 <= nums[i] <= 10^9',
    ],
    expectedComplexity: {
      time: 'O(N)',
      space: 'O(N)',
    },
    functionSignature: {
      C: 'bool containsDuplicate(int* nums, int numsSize)',
      'C++': 'bool containsDuplicate(vector<int>& nums)',
      Java: 'public boolean containsDuplicate(int[] nums)',
      Python: 'def containsDuplicate(self, nums: List[int]) -> bool:',
      JavaScript: 'function containsDuplicate(nums)',
    },
    starterCode: {
      C: `#include <stdio.h>\n#include <stdbool.h>\n\nbool containsDuplicate(int* nums, int numsSize) {\n    // Write your solution here\n    return false;\n}`,
      'C++': `#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        // Write your solution here\n        return false;\n    }\n};`,
      Java: `import java.util.*;\n\nclass Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Write your solution here\n        return false;\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        # Write your solution here\n        pass`,
      JavaScript: `function containsDuplicate(nums) {\n  // Write your solution here\n  return false;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'nums = [1, 2, 3, 1]', expectedOutput: 'true', isHidden: false },
      { id: 'tc_2', input: 'nums = [1, 2, 3, 4]', expectedOutput: 'false', isHidden: false },
      { id: 'tc_3', input: 'nums = [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]', expectedOutput: 'true', isHidden: true },
    ],
    hints: ['Insert elements into a Hash Set and check if already present.'],
    editorial: {
      approach: 'Hash Set lookup in O(1) average time.',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(N)',
    },
  },
  {
    id: 'dsa_arr_04',
    title: 'Move Zeroes',
    difficulty: 'Easy',
    subject: 'DSA',
    topic: 'Arrays',
    tags: ['Arrays', 'Two Pointers'],
    description: `Given an integer array \`nums\`, move all \`0\`'s to the end of it while maintaining the relative order of the non-zero elements.

**Note** that you must do this in-place without making a copy of the array.`,
    examples: [
      {
        input: 'nums = [0, 1, 0, 3, 12]',
        output: '[1, 3, 12, 0, 0]',
        explanation: 'All zeroes are moved to the end, non-zero order is preserved.',
      },
      {
        input: 'nums = [0]',
        output: '[0]',
        explanation: 'Single element zero remains.',
      },
    ],
    constraints: [
      '1 <= nums.length <= 10^4',
      '-2^31 <= nums[i] <= 2^31 - 1',
    ],
    expectedComplexity: {
      time: 'O(N)',
      space: 'O(1)',
    },
    functionSignature: {
      C: 'void moveZeroes(int* nums, int numsSize)',
      'C++': 'void moveZeroes(vector<int>& nums)',
      Java: 'public void moveZeroes(int[] nums)',
      Python: 'def moveZeroes(self, nums: List[int]) -> None:',
      JavaScript: 'function moveZeroes(nums)',
    },
    starterCode: {
      C: `#include <stdio.h>\n\nvoid moveZeroes(int* nums, int numsSize) {\n    // Write in-place solution here\n}`,
      'C++': `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void moveZeroes(vector<int>& nums) {\n        // Write in-place solution here\n    }\n};`,
      Java: `class Solution {\n    public void moveZeroes(int[] nums) {\n        // Write in-place solution here\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def moveZeroes(self, nums: List[int]) -> None:\n        # Write in-place solution here\n        pass`,
      JavaScript: `function moveZeroes(nums) {\n  // Write in-place solution here\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'nums = [0, 1, 0, 3, 12]', expectedOutput: '[1, 3, 12, 0, 0]', isHidden: false },
      { id: 'tc_2', input: 'nums = [0]', expectedOutput: '[0]', isHidden: false },
      { id: 'tc_3', input: 'nums = [1, 2, 3]', expectedOutput: '[1, 2, 3]', isHidden: true },
    ],
    hints: ['Use two pointers: one pointing to the insert position for next non-zero.'],
    editorial: {
      approach: 'Slow and fast pointer swapping non-zeroes to the left.',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
    },
  },

  // ==========================================
  // ARRAYS — MEDIUM
  // ==========================================
  {
    id: 'dsa_arr_05',
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    subject: 'DSA',
    topic: 'Arrays',
    tags: ['Arrays', 'Divide and Conquer', 'Dynamic Programming', "Kadane's Algorithm"],
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

A **subarray** is a contiguous non-empty sequence of elements within an array.`,
    examples: [
      {
        input: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
        output: '6',
        explanation: 'The subarray [4, -1, 2, 1] has the largest sum 6.',
      },
      {
        input: 'nums = [1]',
        output: '1',
        explanation: 'The subarray [1] has the largest sum 1.',
      },
      {
        input: 'nums = [5, 4, -1, 7, 8]',
        output: '23',
        explanation: 'The subarray [5, 4, -1, 7, 8] has the largest sum 23.',
      },
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
    ],
    expectedComplexity: {
      time: 'O(N)',
      space: 'O(1)',
    },
    functionSignature: {
      C: 'int maxSubArray(int* nums, int numsSize)',
      'C++': 'int maxSubArray(vector<int>& nums)',
      Java: 'public int maxSubArray(int[] nums)',
      Python: 'def maxSubArray(self, nums: List[int]) -> int:',
      JavaScript: 'function maxSubArray(nums)',
    },
    starterCode: {
      C: `#include <stdio.h>\n#include <limits.h>\n\nint maxSubArray(int* nums, int numsSize) {\n    // Write your solution using Kadane's algorithm\n    return 0;\n}`,
      'C++': `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};`,
      Java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        # Write your solution here\n        pass`,
      JavaScript: `function maxSubArray(nums) {\n  // Write your solution here\n  return 0;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]', expectedOutput: '6', isHidden: false },
      { id: 'tc_2', input: 'nums = [1]', expectedOutput: '1', isHidden: false },
      { id: 'tc_3', input: 'nums = [5, 4, -1, 7, 8]', expectedOutput: '23', isHidden: false },
      { id: 'tc_4', input: 'nums = [-1, -2, -3]', expectedOutput: '-1', isHidden: true },
    ],
    hints: [
      'If current sum becomes negative, is it ever beneficial to carry it forward?',
      "Use Kadane's algorithm: currentMax = max(nums[i], currentMax + nums[i]).",
    ],
    editorial: {
      approach: "Kadane's Algorithm maintains the maximum sum ending at the current index in O(1) space.",
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
    },
  },
  {
    id: 'dsa_arr_06',
    title: 'Rotate Array',
    difficulty: 'Medium',
    subject: 'DSA',
    topic: 'Arrays',
    tags: ['Arrays', 'Math', 'Two Pointers'],
    description: `Given an integer array \`nums\`, rotate the array to the right by \`k\` steps, where \`k\` is non-negative.

Try to come up with as many solutions as you can. There are at least three different ways to solve this problem, including an in-place \`O(1)\` extra space algorithm.`,
    examples: [
      {
        input: 'nums = [1, 2, 3, 4, 5, 6, 7], k = 3',
        output: '[5, 6, 7, 1, 2, 3, 4]',
        explanation: 'rotate 1 steps to the right: [7, 1, 2, 3, 4, 5, 6]\nrotate 2 steps: [6, 7, 1, 2, 3, 4, 5]\nrotate 3 steps: [5, 6, 7, 1, 2, 3, 4]',
      },
      {
        input: 'nums = [-1, -100, 3, 99], k = 2',
        output: '[3, 99, -1, -100]',
        explanation: 'rotate 2 steps to the right.',
      },
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-2^31 <= nums[i] <= 2^31 - 1',
      '0 <= k <= 10^5',
    ],
    expectedComplexity: {
      time: 'O(N)',
      space: 'O(1)',
    },
    functionSignature: {
      C: 'void rotate(int* nums, int numsSize, int k)',
      'C++': 'void rotate(vector<int>& nums, int k)',
      Java: 'public void rotate(int[] nums, int k)',
      Python: 'def rotate(self, nums: List[int], k: int) -> None:',
      JavaScript: 'function rotate(nums, k)',
    },
    starterCode: {
      C: `#include <stdio.h>\n\nvoid rotate(int* nums, int numsSize, int k) {\n    // Write in-place solution here\n}`,
      'C++': `#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    void rotate(vector<int>& nums, int k) {\n        // Write in-place solution here\n    }\n};`,
      Java: `class Solution {\n    public void rotate(int[] nums, int k) {\n        // Write in-place solution here\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def rotate(self, nums: List[int], k: int) -> None:\n        # Write in-place solution here\n        pass`,
      JavaScript: `function rotate(nums, k) {\n  // Write in-place solution here\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'nums = [1, 2, 3, 4, 5, 6, 7], k = 3', expectedOutput: '[5, 6, 7, 1, 2, 3, 4]', isHidden: false },
      { id: 'tc_2', input: 'nums = [-1, -100, 3, 99], k = 2', expectedOutput: '[3, 99, -1, -100]', isHidden: false },
      { id: 'tc_3', input: 'nums = [1, 2], k = 3', expectedOutput: '[2, 1]', isHidden: true },
    ],
    hints: [
      'k = k % nums.length.',
      'Reverse the whole array, then reverse first k elements, then reverse the rest.',
    ],
    editorial: {
      approach: 'Three-reversal algorithm: reverse(0, n-1), reverse(0, k-1), reverse(k, n-1).',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
    },
  },
  {
    id: 'dsa_arr_07',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    subject: 'DSA',
    topic: 'Arrays',
    tags: ['Arrays', 'Sorting', 'Intervals'],
    description: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return *an array of the non-overlapping intervals that cover all the intervals in the input*.`,
    examples: [
      {
        input: 'intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]',
        output: '[[1, 6], [8, 10], [15, 18]]',
        explanation: 'Since intervals [1, 3] and [2, 6] overlap, merge them into [1, 6].',
      },
      {
        input: 'intervals = [[1, 4], [4, 5]]',
        output: '[[1, 5]]',
        explanation: 'Intervals [1, 4] and [4, 5] are considered overlapping.',
      },
    ],
    constraints: [
      '1 <= intervals.length <= 10^4',
      'intervals[i].length == 2',
      '0 <= start_i <= end_i <= 10^4',
    ],
    expectedComplexity: {
      time: 'O(N log N)',
      space: 'O(N)',
    },
    functionSignature: {
      C: 'int** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes)',
      'C++': 'vector<vector<int>> merge(vector<vector<int>>& intervals)',
      Java: 'public int[][] merge(int[][] intervals)',
      Python: 'def merge(self, intervals: List[List[int]]) -> List[List[int]]:',
      JavaScript: 'function merge(intervals)',
    },
    starterCode: {
      C: `#include <stdio.h>\n#include <stdlib.h>\n\nint** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes) {\n    // Write your solution here\n    return NULL;\n}`,
      'C++': `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Write your solution here\n        return {};\n    }\n};`,
      Java: `import java.util.*;\n\nclass Solution {\n    public int[][] merge(int[][] intervals) {\n        // Write your solution here\n        return new int[0][0];\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        # Write your solution here\n        pass`,
      JavaScript: `function merge(intervals) {\n  // Write your solution here\n  return [];\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]', expectedOutput: '[[1, 6], [8, 10], [15, 18]]', isHidden: false },
      { id: 'tc_2', input: 'intervals = [[1, 4], [4, 5]]', expectedOutput: '[[1, 5]]', isHidden: false },
      { id: 'tc_3', input: 'intervals = [[1, 4], [0, 4]]', expectedOutput: '[[0, 4]]', isHidden: true },
    ],
    hints: ['Sort the intervals by their start time.', 'Merge intervals when curr.start <= prev.end.'],
    editorial: {
      approach: 'Sort intervals by start timestamp and linearly merge overlapping intervals.',
      timeComplexity: 'O(N log N)',
      spaceComplexity: 'O(N)',
    },
  },
  {
    id: 'dsa_arr_08',
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    subject: 'DSA',
    topic: 'Arrays',
    tags: ['Arrays', 'Prefix Sum'],
    description: `Given an integer array \`nums\`, return *an array* \`answer\` *such that* \`answer[i]\` *is equal to the product of all the elements of* \`nums\` *except* \`nums[i]\`.

The product of any prefix or suffix of \`nums\` is **guaranteed** to fit in a **32-bit** integer.

You must write an algorithm that runs in \`O(n)\` time and without using the division operation.`,
    examples: [
      {
        input: 'nums = [1, 2, 3, 4]',
        output: '[24, 12, 8, 6]',
        explanation: 'answer[0] = 2*3*4 = 24, answer[1] = 1*3*4 = 12, etc.',
      },
      {
        input: 'nums = [-1, 1, 0, -3, 3]',
        output: '[0, 0, 9, 0, 0]',
        explanation: 'Only index 2 (value 0) has non-zero product.',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^5',
      '-30 <= nums[i] <= 30',
      'The input is generated such that answer[i] fits in a 32-bit integer.',
    ],
    expectedComplexity: {
      time: 'O(N)',
      space: 'O(1)',
    },
    functionSignature: {
      C: 'int* productExceptSelf(int* nums, int numsSize, int* returnSize)',
      'C++': 'vector<int> productExceptSelf(vector<int>& nums)',
      Java: 'public int[] productExceptSelf(int[] nums)',
      Python: 'def productExceptSelf(self, nums: List[int]) -> List[int]:',
      JavaScript: 'function productExceptSelf(nums)',
    },
    starterCode: {
      C: `#include <stdio.h>\n#include <stdlib.h>\n\nint* productExceptSelf(int* nums, int numsSize, int* returnSize) {\n    *returnSize = numsSize;\n    int* res = (int*)malloc(numsSize * sizeof(int));\n    // Write your solution here\n    return res;\n}`,
      'C++': `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        // Write your solution here\n        return {};\n    }\n};`,
      Java: `class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        // Write your solution here\n        return new int[nums.length];\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def productExceptSelf(self, nums: List[int]) -> List[int]:\n        # Write your solution here\n        pass`,
      JavaScript: `function productExceptSelf(nums) {\n  // Write your solution here\n  return [];\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'nums = [1, 2, 3, 4]', expectedOutput: '[24, 12, 8, 6]', isHidden: false },
      { id: 'tc_2', input: 'nums = [-1, 1, 0, -3, 3]', expectedOutput: '[0, 0, 9, 0, 0]', isHidden: false },
      { id: 'tc_3', input: 'nums = [4, 5]', expectedOutput: '[5, 4]', isHidden: true },
    ],
    hints: ['Construct prefix products in the first pass, and suffix products in the reverse pass.'],
    editorial: {
      approach: 'Prefix array and running suffix multiplier to compute output in O(1) auxiliary memory.',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
    },
  },
  {
    id: 'dsa_arr_09',
    title: 'Container With Most Water',
    difficulty: 'Medium',
    subject: 'DSA',
    topic: 'Arrays',
    tags: ['Arrays', 'Two Pointers', 'Greedy'],
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`-th line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return *the maximum amount of water a container can store*.

**Notice** that you may not slant the container.`,
    examples: [
      {
        input: 'height = [1, 8, 6, 2, 5, 4, 8, 3, 7]',
        output: '49',
        explanation: 'The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water (blue section) the container can contain is 49.',
      },
      {
        input: 'height = [1, 1]',
        output: '1',
        explanation: 'Area is min(1, 1) * (1 - 0) = 1.',
      },
    ],
    constraints: [
      'n == height.length',
      '2 <= n <= 10^5',
      '0 <= height[i] <= 10^4',
    ],
    expectedComplexity: {
      time: 'O(N)',
      space: 'O(1)',
    },
    functionSignature: {
      C: 'int maxArea(int* height, int heightSize)',
      'C++': 'int maxArea(vector<int>& height)',
      Java: 'public int maxArea(int[] height)',
      Python: 'def maxArea(self, height: List[int]) -> int:',
      JavaScript: 'function maxArea(height)',
    },
    starterCode: {
      C: `#include <stdio.h>\n\nint maxArea(int* height, int heightSize) {\n    // Write your two pointer solution here\n    return 0;\n}`,
      'C++': `#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // Write your solution here\n        return 0;\n    }\n};`,
      Java: `class Solution {\n    public int maxArea(int[] height) {\n        // Write your solution here\n        return 0;\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def maxArea(self, height: List[int]) -> int:\n        # Write your solution here\n        pass`,
      JavaScript: `function maxArea(height) {\n  // Write your solution here\n  return 0;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'height = [1, 8, 6, 2, 5, 4, 8, 3, 7]', expectedOutput: '49', isHidden: false },
      { id: 'tc_2', input: 'height = [1, 1]', expectedOutput: '1', isHidden: false },
      { id: 'tc_3', input: 'height = [4, 3, 2, 1, 4]', expectedOutput: '16', isHidden: true },
    ],
    hints: ['Start with left at 0 and right at n - 1.', 'Always move the pointer pointing to the shorter line.'],
    editorial: {
      approach: 'Two-pointer greedy technique moving the smaller boundary inward.',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
    },
  },
  {
    id: 'dsa_arr_10',
    title: '3Sum',
    difficulty: 'Medium',
    subject: 'DSA',
    topic: 'Arrays',
    tags: ['Arrays', 'Two Pointers', 'Sorting'],
    description: `Given an integer array \`nums\`, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.`,
    examples: [
      {
        input: 'nums = [-1, 0, 1, 2, -1, -4]',
        output: '[[-1, -1, 2], [-1, 0, 1]]',
        explanation: 'The distinct triplets are [-1, 0, 1] and [-1, -1, 2].',
      },
      {
        input: 'nums = [0, 1, 1]',
        output: '[]',
        explanation: 'The only possible triplet does not sum up to 0.',
      },
    ],
    constraints: [
      '3 <= nums.length <= 3000',
      '-10^5 <= nums[i] <= 10^5',
    ],
    expectedComplexity: {
      time: 'O(N^2)',
      space: 'O(1)',
    },
    functionSignature: {
      C: 'int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes)',
      'C++': 'vector<vector<int>> threeSum(vector<int>& nums)',
      Java: 'public List<List<Integer>> threeSum(int[] nums)',
      Python: 'def threeSum(self, nums: List[int]) -> List[List[int]]:',
      JavaScript: 'function threeSum(nums)',
    },
    starterCode: {
      C: `#include <stdio.h>\n#include <stdlib.h>\n\nint** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    // Write your solution here\n    return NULL;\n}`,
      'C++': `#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        // Write your solution here\n        return {};\n    }\n};`,
      Java: `import java.util.*;\n\nclass Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        # Write your solution here\n        pass`,
      JavaScript: `function threeSum(nums) {\n  // Write your solution here\n  return [];\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'nums = [-1, 0, 1, 2, -1, -4]', expectedOutput: '[[-1, -1, 2], [-1, 0, 1]]', isHidden: false },
      { id: 'tc_2', input: 'nums = [0, 0, 0]', expectedOutput: '[[0, 0, 0]]', isHidden: false },
      { id: 'tc_3', input: 'nums = [0, 1, 1]', expectedOutput: '[]', isHidden: true },
    ],
    hints: ['Sort the array first.', 'Fix one number and use two pointers for the remaining two.'],
    editorial: {
      approach: 'Sort array and perform two-pointer search while skipping duplicate elements.',
      timeComplexity: 'O(N^2)',
      spaceComplexity: 'O(1)',
    },
  },

  // ==========================================
  // ARRAYS — HARD
  // ==========================================
  {
    id: 'dsa_arr_11',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    subject: 'DSA',
    topic: 'Arrays',
    tags: ['Arrays', 'Two Pointers', 'Dynamic Programming', 'Monotonic Stack'],
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    examples: [
      {
        input: 'height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]',
        output: '6',
        explanation: 'The above elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are trapped.',
      },
      {
        input: 'height = [4, 2, 0, 3, 2, 5]',
        output: '9',
        explanation: '9 units of rain water trapped between bars.',
      },
    ],
    constraints: [
      'n == height.length',
      '1 <= n <= 2 * 10^4',
      '0 <= height[i] <= 10^5',
    ],
    expectedComplexity: {
      time: 'O(N)',
      space: 'O(1)',
    },
    functionSignature: {
      C: 'int trap(int* height, int heightSize)',
      'C++': 'int trap(vector<int>& height)',
      Java: 'public int trap(int[] height)',
      Python: 'def trap(self, height: List[int]) -> int:',
      JavaScript: 'function trap(height)',
    },
    starterCode: {
      C: `#include <stdio.h>\n\nint trap(int* height, int heightSize) {\n    // Write two-pointer solution here\n    return 0;\n}`,
      'C++': `#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write your solution here\n        return 0;\n    }\n};`,
      Java: `class Solution {\n    public int trap(int[] height) {\n        // Write your solution here\n        return 0;\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def trap(self, height: List[int]) -> int:\n        # Write your solution here\n        pass`,
      JavaScript: `function trap(height) {\n  // Write your solution here\n  return 0;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]', expectedOutput: '6', isHidden: false },
      { id: 'tc_2', input: 'height = [4, 2, 0, 3, 2, 5]', expectedOutput: '9', isHidden: false },
      { id: 'tc_3', input: 'height = [3, 0, 2, 0, 4]', expectedOutput: '7', isHidden: true },
    ],
    hints: ['Water trapped at index i is min(maxLeft, maxRight) - height[i].', 'Maintain leftMax and rightMax with two pointers.'],
    editorial: {
      approach: 'Two pointers converging from ends tracking max heights.',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
    },
  },
  {
    id: 'dsa_arr_12',
    title: 'First Missing Positive',
    difficulty: 'Hard',
    subject: 'DSA',
    topic: 'Arrays',
    tags: ['Arrays', 'Hash Table', 'Cyclic Sort'],
    description: `Given an unsorted integer array \`nums\`, return the *smallest missing positive integer*.

You must implement an algorithm that runs in \`O(n)\` time and uses \`O(1)\` auxiliary space.`,
    examples: [
      {
        input: 'nums = [1, 2, 0]',
        output: '3',
        explanation: 'The numbers in the range [1,2] are all in the array.',
      },
      {
        input: 'nums = [3, 4, -1, 1]',
        output: '2',
        explanation: '1 is in the array, but 2 is missing.',
      },
      {
        input: 'nums = [7, 8, 9, 11, 12]',
        output: '1',
        explanation: 'The smallest positive integer 1 is missing.',
      },
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-2^31 <= nums[i] <= 2^31 - 1',
    ],
    expectedComplexity: {
      time: 'O(N)',
      space: 'O(1)',
    },
    functionSignature: {
      C: 'int firstMissingPositive(int* nums, int numsSize)',
      'C++': 'int firstMissingPositive(vector<int>& nums)',
      Java: 'public int firstMissingPositive(int[] nums)',
      Python: 'def firstMissingPositive(self, nums: List[int]) -> int:',
      JavaScript: 'function firstMissingPositive(nums)',
    },
    starterCode: {
      C: `#include <stdio.h>\n\nint firstMissingPositive(int* nums, int numsSize) {\n    // Write in-place cyclic placement solution\n    return 1;\n}`,
      'C++': `#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int firstMissingPositive(vector<int>& nums) {\n        // Write your solution here\n        return 1;\n    }\n};`,
      Java: `class Solution {\n    public int firstMissingPositive(int[] nums) {\n        // Write your solution here\n        return 1;\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def firstMissingPositive(self, nums: List[int]) -> int:\n        # Write your solution here\n        pass`,
      JavaScript: `function firstMissingPositive(nums) {\n  // Write your solution here\n  return 1;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'nums = [1, 2, 0]', expectedOutput: '3', isHidden: false },
      { id: 'tc_2', input: 'nums = [3, 4, -1, 1]', expectedOutput: '2', isHidden: false },
      { id: 'tc_3', input: 'nums = [7, 8, 9, 11, 12]', expectedOutput: '1', isHidden: false },
      { id: 'tc_4', input: 'nums = [1]', expectedOutput: '2', isHidden: true },
    ],
    hints: ['The answer must be in the range [1, N + 1].', 'Place each number x in index x - 1 if 1 <= x <= N.'],
    editorial: {
      approach: 'In-place index hashing / cyclic sort placing num into index num - 1.',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
    },
  },

  // ==========================================
  // STRINGS — EASY / MEDIUM / HARD
  // ==========================================
  {
    id: 'dsa_str_01',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    subject: 'DSA',
    topic: 'Strings',
    tags: ['Strings', 'Hash Table', 'Sorting'],
    description: `Given two strings \`s\` and \`t\`, return \`true\` *if* \`t\` *is an anagram of* \`s\`, *and* \`false\` *otherwise*.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true', explanation: 'Both strings contain the exact same characters with the same frequencies.' },
      { input: 's = "rat", t = "car"', output: 'false', explanation: 'Different letters.' },
    ],
    constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters.'],
    expectedComplexity: { time: 'O(N)', space: 'O(1)' },
    functionSignature: {
      C: 'bool isAnagram(char* s, char* t)',
      'C++': 'bool isAnagram(string s, string t)',
      Java: 'public boolean isAnagram(String s, String t)',
      Python: 'def isAnagram(self, s: str, t: str) -> bool:',
      JavaScript: 'function isAnagram(s, t)',
    },
    starterCode: {
      C: `#include <stdio.h>\n#include <stdbool.h>\n#include <string.h>\n\nbool isAnagram(char* s, char* t) {\n    // Write your solution here\n    return false;\n}`,
      'C++': `#include <string>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // Write your solution here\n        return false;\n    }\n};`,
      Java: `class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Write your solution here\n        return false;\n    }\n}`,
      Python: `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        # Write your solution here\n        pass`,
      JavaScript: `function isAnagram(s, t) {\n  // Write your solution here\n  return false;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 's = "anagram", t = "nagaram"', expectedOutput: 'true', isHidden: false },
      { id: 'tc_2', input: 's = "rat", t = "car"', expectedOutput: 'false', isHidden: false },
      { id: 'tc_3', input: 's = "a", t = "ab"', expectedOutput: 'false', isHidden: true },
    ],
    hints: ['Count the frequencies of each character using an array of size 26.'],
    editorial: { approach: 'Fixed-size frequency table subtraction.', timeComplexity: 'O(N)', spaceComplexity: 'O(1)' },
  },
  {
    id: 'dsa_str_02',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    subject: 'DSA',
    topic: 'Strings',
    tags: ['Strings', 'Sliding Window', 'Hash Table'],
    description: `Given a string \`s\`, find the length of the **longest substring** without duplicate characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with length of 3.' },
    ],
    constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    expectedComplexity: { time: 'O(N)', space: 'O(min(N, M))' },
    functionSignature: {
      C: 'int lengthOfLongestSubstring(char* s)',
      'C++': 'int lengthOfLongestSubstring(string s)',
      Java: 'public int lengthOfLongestSubstring(String s)',
      Python: 'def lengthOfLongestSubstring(self, s: str) -> int:',
      JavaScript: 'function lengthOfLongestSubstring(s)',
    },
    starterCode: {
      C: `#include <stdio.h>\n#include <string.h>\n\nint lengthOfLongestSubstring(char* s) {\n    // Write sliding window solution here\n    return 0;\n}`,
      'C++': `#include <string>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your solution here\n        return 0;\n    }\n};`,
      Java: `import java.util.*;\n\nclass Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your solution here\n        return 0;\n    }\n}`,
      Python: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Write your solution here\n        pass`,
      JavaScript: `function lengthOfLongestSubstring(s) {\n  // Write your solution here\n  return 0;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 's = "abcabcbb"', expectedOutput: '3', isHidden: false },
      { id: 'tc_2', input: 's = "bbbbb"', expectedOutput: '1', isHidden: false },
      { id: 'tc_3', input: 's = "pwwkew"', expectedOutput: '3', isHidden: false },
      { id: 'tc_4', input: 's = " "', expectedOutput: '1', isHidden: true },
    ],
    hints: ['Use a sliding window [left, right] and store the last seen position of each character.'],
    editorial: { approach: 'Sliding window tracking character indices to shift left pointer.', timeComplexity: 'O(N)', spaceComplexity: 'O(min(N, alphabet))' },
  },
  {
    id: 'dsa_str_03',
    title: 'Group Anagrams',
    difficulty: 'Medium',
    subject: 'DSA',
    topic: 'Strings',
    tags: ['Strings', 'Hash Table', 'Sorting'],
    description: `Given an array of strings \`strs\`, group **the anagrams** together. You can return the answer in **any order**.`,
    examples: [
      {
        input: 'strs = ["eat", "tea", "tan", "ate", "nat", "bat"]',
        output: '[["bat"], ["nat", "tan"], ["ate", "eat", "tea"]]',
        explanation: 'Group words with matching character sets.',
      },
    ],
    constraints: ['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100', 'strs[i] consists of lowercase English letters.'],
    expectedComplexity: { time: 'O(N * K log K)', space: 'O(N * K)' },
    functionSignature: {
      'C++': 'vector<vector<string>> groupAnagrams(vector<string>& strs)',
      Java: 'public List<List<String>> groupAnagrams(String[] strs)',
      Python: 'def groupAnagrams(self, strs: List[str]) -> List[List[str]]:',
      JavaScript: 'function groupAnagrams(strs)',
    },
    starterCode: {
      'C++': `#include <vector>\n#include <string>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        // Write your solution here\n        return {};\n    }\n};`,
      Java: `import java.util.*;\n\nclass Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}`,
      Python: `from typing import List\nfrom collections import defaultdict\n\nclass Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        # Write your solution here\n        pass`,
      JavaScript: `function groupAnagrams(strs) {\n  // Write your solution here\n  return [];\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'strs = ["eat", "tea", "tan", "ate", "nat", "bat"]', expectedOutput: '[["bat"], ["nat", "tan"], ["ate", "eat", "tea"]]', isHidden: false },
      { id: 'tc_2', input: 'strs = [""]', expectedOutput: '[[""]]', isHidden: false },
      { id: 'tc_3', input: 'strs = ["a"]', expectedOutput: '[["a"]]', isHidden: true },
    ],
    hints: ['Use the sorted string or character count tuple as the hash map key.'],
    editorial: { approach: 'Hash map with sorted string keys.', timeComplexity: 'O(N * K log K)', spaceComplexity: 'O(N * K)' },
  },

  // ==========================================
  // LINKED LISTS — EASY / MEDIUM / HARD
  // ==========================================
  {
    id: 'dsa_ll_01',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    subject: 'DSA',
    topic: 'Linked Lists',
    tags: ['Linked Lists', 'Recursion', 'Two Pointers'],
    description: `Given the \`head\` of a singly linked list, reverse the list, and return *the reversed list*.`,
    examples: [
      { input: 'head = [1, 2, 3, 4, 5]', output: '[5, 4, 3, 2, 1]', explanation: 'Reversed order.' },
      { input: 'head = [1, 2]', output: '[2, 1]', explanation: 'Reversed order.' },
    ],
    constraints: ['The number of nodes in the list is the range [0, 5000].', '-5000 <= Node.val <= 5000'],
    expectedComplexity: { time: 'O(N)', space: 'O(1)' },
    functionSignature: {
      C: 'struct ListNode* reverseList(struct ListNode* head)',
      'C++': 'ListNode* reverseList(ListNode* head)',
      Java: 'public ListNode reverseList(ListNode head)',
      Python: 'def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:',
      JavaScript: 'function reverseList(head)',
    },
    starterCode: {
      C: `/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     struct ListNode *next;\n * };\n */\nstruct ListNode* reverseList(struct ListNode* head) {\n    // Write iterative reverse here\n    return NULL;\n}`,
      'C++': `class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write iterative reverse here\n        return nullptr;\n    }\n};`,
      Java: `class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write iterative reverse here\n        return null;\n    }\n}`,
      Python: `class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        # Write iterative reverse here\n        pass`,
      JavaScript: `function reverseList(head) {\n  // Write iterative reverse here\n  return null;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'head = [1, 2, 3, 4, 5]', expectedOutput: '[5, 4, 3, 2, 1]', isHidden: false },
      { id: 'tc_2', input: 'head = [1, 2]', expectedOutput: '[2, 1]', isHidden: false },
      { id: 'tc_3', input: 'head = []', expectedOutput: '[]', isHidden: true },
    ],
    hints: ['Iterate through the list, maintaining prev, curr, and next pointers.'],
    editorial: { approach: 'Three pointers (prev, curr, next) reversing links in single pass.', timeComplexity: 'O(N)', spaceComplexity: 'O(1)' },
  },
  {
    id: 'dsa_ll_02',
    title: 'Linked List Cycle',
    difficulty: 'Easy',
    subject: 'DSA',
    topic: 'Linked Lists',
    tags: ['Linked Lists', 'Two Pointers', "Floyd's Cycle Finding"],
    description: `Given \`head\`, the head of a linked list, determine if the linked list has a cycle in it.

Return \`true\` *if there is a cycle in the linked list*. Otherwise, return \`false\`.`,
    examples: [
      { input: 'head = [3, 2, 0, -4], pos = 1', output: 'true', explanation: 'There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed).' },
      { input: 'head = [1, 2], pos = 0', output: 'true', explanation: 'There is a cycle where tail connects to 0th node.' },
      { input: 'head = [1], pos = -1', output: 'false', explanation: 'No cycle.' },
    ],
    constraints: ['The number of the nodes in the list is in the range [0, 10^4].', '-10^5 <= Node.val <= 10^5'],
    expectedComplexity: { time: 'O(N)', space: 'O(1)' },
    functionSignature: {
      C: 'bool hasCycle(struct ListNode *head)',
      'C++': 'bool hasCycle(ListNode *head)',
      Java: 'public boolean hasCycle(ListNode head)',
      Python: 'def hasCycle(self, head: Optional[ListNode]) -> bool:',
      JavaScript: 'function hasCycle(head)',
    },
    starterCode: {
      C: `bool hasCycle(struct ListNode *head) {\n    // Write Floyd's cycle detection algorithm\n    return false;\n}`,
      'C++': `class Solution {\npublic:\n    bool hasCycle(ListNode *head) {\n        // Write Floyd's cycle algorithm\n        return false;\n    }\n};`,
      Java: `public class Solution {\n    public boolean hasCycle(ListNode head) {\n        // Write Floyd's cycle algorithm\n        return false;\n    }\n}`,
      Python: `class Solution:\n    def hasCycle(self, head: Optional[ListNode]) -> bool:\n        # Write Floyd's cycle algorithm\n        pass`,
      JavaScript: `function hasCycle(head) {\n  // Write Floyd's cycle algorithm\n  return false;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'head = [3, 2, 0, -4], pos = 1', expectedOutput: 'true', isHidden: false },
      { id: 'tc_2', input: 'head = [1], pos = -1', expectedOutput: 'false', isHidden: false },
    ],
    hints: ['Use two pointers (slow and fast); slow moves 1 step, fast moves 2 steps.'],
    editorial: { approach: "Floyd's Tortoise and Hare algorithm.", timeComplexity: 'O(N)', spaceComplexity: 'O(1)' },
  },
  {
    id: 'dsa_ll_03',
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    subject: 'DSA',
    topic: 'Linked Lists',
    tags: ['Linked Lists', 'Recursion', 'Two Pointers'],
    description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one **sorted** list. The list should be made by splicing together the nodes of the first two lists.

Return *the head of the merged linked list*.`,
    examples: [
      { input: 'list1 = [1, 2, 4], list2 = [1, 3, 4]', output: '[1, 1, 2, 3, 4, 4]', explanation: 'Merged sorted sequence.' },
      { input: 'list1 = [], list2 = []', output: '[]', explanation: 'Empty lists.' },
    ],
    constraints: ['The number of nodes in both lists is in the range [0, 50].', '-100 <= Node.val <= 100'],
    expectedComplexity: { time: 'O(N + M)', space: 'O(1)' },
    functionSignature: {
      C: 'struct ListNode* mergeTwoLists(struct ListNode* list1, struct ListNode* list2)',
      'C++': 'ListNode* mergeTwoLists(ListNode* list1, ListNode* list2)',
      Java: 'public ListNode mergeTwoLists(ListNode list1, ListNode list2)',
      Python: 'def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:',
      JavaScript: 'function mergeTwoLists(list1, list2)',
    },
    starterCode: {
      C: `struct ListNode* mergeTwoLists(struct ListNode* list1, struct ListNode* list2) {\n    // Write iterative merge with dummy head\n    return NULL;\n}`,
      'C++': `class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        // Write solution here\n        return nullptr;\n    }\n};`,
      Java: `class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        // Write solution here\n        return null;\n    }\n}`,
      Python: `class Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        # Write solution here\n        pass`,
      JavaScript: `function mergeTwoLists(list1, list2) {\n  // Write solution here\n  return null;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'list1 = [1, 2, 4], list2 = [1, 3, 4]', expectedOutput: '[1, 1, 2, 3, 4, 4]', isHidden: false },
      { id: 'tc_2', input: 'list1 = [], list2 = [0]', expectedOutput: '[0]', isHidden: false },
    ],
    hints: ['Create a dummy node and attach the smaller head pointer.'],
    editorial: { approach: 'Dummy head pointer linear merge.', timeComplexity: 'O(N + M)', spaceComplexity: 'O(1)' },
  },

  // ==========================================
  // STACKS & QUEUES
  // ==========================================
  {
    id: 'dsa_stk_01',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    subject: 'DSA',
    topic: 'Stack',
    tags: ['Stack', 'Strings'],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"', output: 'true', explanation: 'Single matched pair.' },
      { input: 's = "()[]{}"', output: 'true', explanation: 'Consecutive matched brackets.' },
      { input: 's = "(]"', output: 'false', explanation: 'Mismatched closing bracket.' },
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only \'()[]{}\'.'],
    expectedComplexity: { time: 'O(N)', space: 'O(N)' },
    functionSignature: {
      C: 'bool isValid(char* s)',
      'C++': 'bool isValid(string s)',
      Java: 'public boolean isValid(String s)',
      Python: 'def isValid(self, s: str) -> bool:',
      JavaScript: 'function isValid(s)',
    },
    starterCode: {
      C: `#include <stdio.h>\n#include <stdbool.h>\n#include <string.h>\n\nbool isValid(char* s) {\n    // Write stack based solution here\n    return false;\n}`,
      'C++': `#include <string>\n#include <stack>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Write solution here\n        return false;\n    }\n};`,
      Java: `import java.util.*;\n\nclass Solution {\n    public boolean isValid(String s) {\n        // Write solution here\n        return false;\n    }\n}`,
      Python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        # Write solution here\n        pass`,
      JavaScript: `function isValid(s) {\n  // Write solution here\n  return false;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 's = "()"', expectedOutput: 'true', isHidden: false },
      { id: 'tc_2', input: 's = "()[]{}"', expectedOutput: 'true', isHidden: false },
      { id: 'tc_3', input: 's = "(]"', expectedOutput: 'false', isHidden: false },
      { id: 'tc_4', input: 's = "([)]"', expectedOutput: 'false', isHidden: true },
    ],
    hints: ['Push opening brackets onto stack; pop when encountering corresponding closing bracket.'],
    editorial: { approach: 'LIFO Stack matching closing brackets.', timeComplexity: 'O(N)', spaceComplexity: 'O(N)' },
  },
  {
    id: 'dsa_stk_02',
    title: 'Daily Temperatures',
    difficulty: 'Medium',
    subject: 'DSA',
    topic: 'Stack',
    tags: ['Stack', 'Monotonic Stack', 'Arrays'],
    description: `Given an array of integers \`temperatures\` represents the daily temperatures, return *an array* \`answer\` *such that* \`answer[i]\` *is the number of days you have to wait after the* \`i\`-th *day to get a warmer temperature*. If there is no future day for which this is possible, keep \`answer[i] == 0\` instead.`,
    examples: [
      { input: 'temperatures = [73, 74, 75, 71, 69, 72, 76, 73]', output: '[1, 1, 4, 2, 1, 1, 0, 0]', explanation: 'Daily wait times.' },
      { input: 'temperatures = [30, 40, 50, 60]', output: '[1, 1, 1, 0]', explanation: 'Monotonically increasing.' },
    ],
    constraints: ['1 <= temperatures.length <= 10^5', '30 <= temperatures[i] <= 100'],
    expectedComplexity: { time: 'O(N)', space: 'O(N)' },
    functionSignature: {
      C: 'int* dailyTemperatures(int* temperatures, int temperaturesSize, int* returnSize)',
      'C++': 'vector<int> dailyTemperatures(vector<int>& temperatures)',
      Java: 'public int[] dailyTemperatures(int[] temperatures)',
      Python: 'def dailyTemperatures(self, temperatures: List[int]) -> List[int]:',
      JavaScript: 'function dailyTemperatures(temperatures)',
    },
    starterCode: {
      C: `#include <stdio.h>\n#include <stdlib.h>\n\nint* dailyTemperatures(int* temperatures, int temperaturesSize, int* returnSize) {\n    *returnSize = temperaturesSize;\n    int* res = (int*)calloc(temperaturesSize, sizeof(int));\n    // Write monotonic stack solution\n    return res;\n}`,
      'C++': `#include <vector>\n#include <stack>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        // Write monotonic stack solution\n        return {};\n    }\n};`,
      Java: `import java.util.*;\n\nclass Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        // Write monotonic stack solution\n        return new int[temperatures.length];\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:\n        # Write monotonic stack solution\n        pass`,
      JavaScript: `function dailyTemperatures(temperatures) {\n  // Write monotonic stack solution\n  return [];\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'temperatures = [73, 74, 75, 71, 69, 72, 76, 73]', expectedOutput: '[1, 1, 4, 2, 1, 1, 0, 0]', isHidden: false },
      { id: 'tc_2', input: 'temperatures = [30, 40, 50, 60]', expectedOutput: '[1, 1, 1, 0]', isHidden: false },
      { id: 'tc_3', input: 'temperatures = [30, 60, 90]', expectedOutput: '[1, 1, 0]', isHidden: true },
    ],
    hints: ['Maintain a monotonically decreasing stack of temperature indices.'],
    editorial: { approach: 'Monotonic decreasing stack.', timeComplexity: 'O(N)', spaceComplexity: 'O(N)' },
  },

  // ==========================================
  // TREES & BINARY SEARCH TREES
  // ==========================================
  {
    id: 'dsa_tree_01',
    title: 'Maximum Depth of Binary Tree',
    difficulty: 'Easy',
    subject: 'DSA',
    topic: 'Trees',
    tags: ['Trees', 'Binary Tree', 'DFS', 'BFS'],
    description: `Given the \`root\` of a binary tree, return *its maximum depth*.

A binary tree's **maximum depth** is the number of nodes along the longest path from the root node down to the farthest leaf node.`,
    examples: [
      { input: 'root = [3, 9, 20, null, null, 15, 7]', output: '3', explanation: 'Longest path has 3 nodes: 3 -> 20 -> 15.' },
      { input: 'root = [1, null, 2]', output: '2', explanation: 'Path 1 -> 2 has length 2.' },
    ],
    constraints: ['The number of nodes in the tree is in the range [0, 10^4].', '-100 <= Node.val <= 100'],
    expectedComplexity: { time: 'O(N)', space: 'O(H)' },
    functionSignature: {
      C: 'int maxDepth(struct TreeNode* root)',
      'C++': 'int maxDepth(TreeNode* root)',
      Java: 'public int maxDepth(TreeNode root)',
      Python: 'def maxDepth(self, root: Optional[TreeNode]) -> int:',
      JavaScript: 'function maxDepth(root)',
    },
    starterCode: {
      C: `int maxDepth(struct TreeNode* root) {\n    if (!root) return 0;\n    int left = maxDepth(root->left);\n    int right = maxDepth(root->right);\n    return (left > right ? left : right) + 1;\n}`,
      'C++': `class Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        // Write recursive DFS or BFS here\n        return 0;\n    }\n};`,
      Java: `class Solution {\n    public int maxDepth(TreeNode root) {\n        // Write solution here\n        return 0;\n    }\n}`,
      Python: `class Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        # Write solution here\n        pass`,
      JavaScript: `function maxDepth(root) {\n  // Write solution here\n  return 0;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'root = [3, 9, 20, null, null, 15, 7]', expectedOutput: '3', isHidden: false },
      { id: 'tc_2', input: 'root = [1, null, 2]', expectedOutput: '2', isHidden: false },
      { id: 'tc_3', input: 'root = []', expectedOutput: '0', isHidden: true },
    ],
    hints: ['Recursive base case: if root is null return 0. Otherwise return 1 + max(left, right).'],
    editorial: { approach: 'Depth-first search traversing left and right subtrees.', timeComplexity: 'O(N)', spaceComplexity: 'O(H)' },
  },
  {
    id: 'dsa_tree_02',
    title: 'Invert Binary Tree',
    difficulty: 'Easy',
    subject: 'DSA',
    topic: 'Trees',
    tags: ['Trees', 'Binary Tree', 'DFS'],
    description: `Given the \`root\` of a binary tree, invert the tree, and return *its root*.`,
    examples: [
      { input: 'root = [4, 2, 7, 1, 3, 6, 9]', output: '[4, 7, 2, 9, 6, 3, 1]', explanation: 'Every left and right child is swapped.' },
    ],
    constraints: ['The number of nodes in the tree is in the range [0, 100].', '-100 <= Node.val <= 100'],
    expectedComplexity: { time: 'O(N)', space: 'O(H)' },
    functionSignature: {
      C: 'struct TreeNode* invertTree(struct TreeNode* root)',
      'C++': 'TreeNode* invertTree(TreeNode* root)',
      Java: 'public TreeNode invertTree(TreeNode root)',
      Python: 'def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:',
      JavaScript: 'function invertTree(root)',
    },
    starterCode: {
      C: `struct TreeNode* invertTree(struct TreeNode* root) {\n    // Write recursive tree inversion\n    return NULL;\n}`,
      'C++': `class Solution {\npublic:\n    TreeNode* invertTree(TreeNode* root) {\n        // Write solution here\n        return nullptr;\n    }\n};`,
      Java: `class Solution {\n    public TreeNode invertTree(TreeNode root) {\n        // Write solution here\n        return null;\n    }\n}`,
      Python: `class Solution:\n    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:\n        # Write solution here\n        pass`,
      JavaScript: `function invertTree(root) {\n  // Write solution here\n  return null;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'root = [4, 2, 7, 1, 3, 6, 9]', expectedOutput: '[4, 7, 2, 9, 6, 3, 1]', isHidden: false },
      { id: 'tc_2', input: 'root = []', expectedOutput: '[]', isHidden: true },
    ],
    hints: ['Recursively swap root.left and root.right.'],
    editorial: { approach: 'Post-order or pre-order recursive child swap.', timeComplexity: 'O(N)', spaceComplexity: 'O(H)' },
  },

  // ==========================================
  // DYNAMIC PROGRAMMING
  // ==========================================
  {
    id: 'dsa_dp_01',
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    subject: 'DSA',
    topic: 'Dynamic Programming',
    tags: ['Dynamic Programming', 'Math', 'Memoization'],
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    examples: [
      { input: 'n = 2', output: '2', explanation: 'There are two ways: 1 step + 1 step, or 2 steps.' },
      { input: 'n = 3', output: '3', explanation: 'There are three ways: (1+1+1), (1+2), (2+1).' },
    ],
    constraints: ['1 <= n <= 45'],
    expectedComplexity: { time: 'O(N)', space: 'O(1)' },
    functionSignature: {
      C: 'int climbStairs(int n)',
      'C++': 'int climbStairs(int n)',
      Java: 'public int climbStairs(int n)',
      Python: 'def climbStairs(self, n: int) -> int:',
      JavaScript: 'function climbStairs(n)',
    },
    starterCode: {
      C: `int climbStairs(int n) {\n    // Write iterative DP with O(1) space\n    return 0;\n}`,
      'C++': `class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write your solution here\n        return 0;\n    }\n};`,
      Java: `class Solution {\n    public int climbStairs(int n) {\n        // Write your solution here\n        return 0;\n    }\n}`,
      Python: `class Solution:\n    def climbStairs(self, n: int) -> int:\n        # Write your solution here\n        pass`,
      JavaScript: `function climbStairs(n) {\n  // Write your solution here\n  return 0;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'n = 2', expectedOutput: '2', isHidden: false },
      { id: 'tc_2', input: 'n = 3', expectedOutput: '3', isHidden: false },
      { id: 'tc_3', input: 'n = 5', expectedOutput: '8', isHidden: true },
    ],
    hints: ['Notice that ways(n) = ways(n-1) + ways(n-2), exactly like the Fibonacci sequence.'],
    editorial: { approach: 'Fibonacci recurrence with two rolling variables.', timeComplexity: 'O(N)', spaceComplexity: 'O(1)' },
  },
  {
    id: 'dsa_dp_02',
    title: 'Coin Change',
    difficulty: 'Medium',
    subject: 'DSA',
    topic: 'Dynamic Programming',
    tags: ['Dynamic Programming', 'BFS'],
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    examples: [
      { input: 'coins = [1, 2, 5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1 (3 coins).' },
      { input: 'coins = [2], amount = 3', output: '-1', explanation: 'Cannot make 3 with coin 2.' },
      { input: 'coins = [1], amount = 0', output: '0', explanation: '0 coins required.' },
    ],
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    expectedComplexity: { time: 'O(amount * len(coins))', space: 'O(amount)' },
    functionSignature: {
      C: 'int coinChange(int* coins, int coinsSize, int amount)',
      'C++': 'int coinChange(vector<int>& coins, int amount)',
      Java: 'public int coinChange(int[] coins, int amount)',
      Python: 'def coinChange(self, coins: List[int], amount: int) -> int:',
      JavaScript: 'function coinChange(coins, amount)',
    },
    starterCode: {
      C: `#include <stdio.h>\n#include <stdlib.h>\n\nint coinChange(int* coins, int coinsSize, int amount) {\n    // Write bottom-up DP\n    return -1;\n}`,
      'C++': `#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        // Write bottom-up DP\n        return -1;\n    }\n};`,
      Java: `import java.util.*;\n\nclass Solution {\n    public int coinChange(int[] coins, int amount) {\n        // Write bottom-up DP\n        return -1;\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        # Write bottom-up DP\n        pass`,
      JavaScript: `function coinChange(coins, amount) {\n  // Write bottom-up DP\n  return -1;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'coins = [1, 2, 5], amount = 11', expectedOutput: '3', isHidden: false },
      { id: 'tc_2', input: 'coins = [2], amount = 3', expectedOutput: '-1', isHidden: false },
      { id: 'tc_3', input: 'coins = [1], amount = 0', expectedOutput: '0', isHidden: false },
      { id: 'tc_4', input: 'coins = [186, 419, 83, 408], amount = 6249', expectedOutput: '20', isHidden: true },
    ],
    hints: ['dp[i] stores min coins to make amount i. dp[i] = min(dp[i - c] + 1) for coin c <= i.'],
    editorial: { approach: '1D bottom-up Dynamic Programming.', timeComplexity: 'O(amount * coins.length)', spaceComplexity: 'O(amount)' },
  },

  // ==========================================
  // GRAPHS — BFS / DFS
  // ==========================================
  {
    id: 'dsa_graph_01',
    title: 'Number of Islands',
    difficulty: 'Medium',
    subject: 'DSA',
    topic: 'Graphs',
    tags: ['Graphs', 'BFS', 'DFS', 'Union Find', 'Matrix'],
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return *the number of islands*.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    examples: [
      {
        input: 'grid = [\n  ["1","1","1","1","0"],\n  ["1","1","0","1","0"],\n  ["1","1","0","0","0"],\n  ["0","0","0","0","0"]\n]',
        output: '1',
        explanation: 'All connected 1s form a single island.',
      },
      {
        input: 'grid = [\n  ["1","1","0","0","0"],\n  ["1","1","0","0","0"],\n  ["0","0","1","0","0"],\n  ["0","0","0","1","1"]\n]',
        output: '3',
        explanation: 'Three separate islands.',
      },
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300', 'grid[i][j] is \'0\' or \'1\'.'],
    expectedComplexity: { time: 'O(M * N)', space: 'O(M * N)' },
    functionSignature: {
      C: 'int numIslands(char** grid, int gridSize, int* gridColSize)',
      'C++': 'int numIslands(vector<vector<char>>& grid)',
      Java: 'public int numIslands(char[][] grid)',
      Python: 'def numIslands(self, grid: List[List[str]]) -> int:',
      JavaScript: 'function numIslands(grid)',
    },
    starterCode: {
      C: `#include <stdio.h>\n\nint numIslands(char** grid, int gridSize, int* gridColSize) {\n    // Write DFS island sinking\n    return 0;\n}`,
      'C++': `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        // Write solution here\n        return 0;\n    }\n};`,
      Java: `class Solution {\n    public int numIslands(char[][] grid) {\n        // Write solution here\n        return 0;\n    }\n}`,
      Python: `from typing import List\n\nclass Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        # Write solution here\n        pass`,
      JavaScript: `function numIslands(grid) {\n  // Write solution here\n  return 0;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: '1', isHidden: false },
      { id: 'tc_2', input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: '3', isHidden: false },
    ],
    hints: ['Iterate through each cell; whenever you find "1", increment island count and DFS/BFS to sink the island (mark as "0").'],
    editorial: { approach: 'Connected component traversal using DFS sink.', timeComplexity: 'O(M * N)', spaceComplexity: 'O(M * N)' },
  },

  // ==========================================
  // SQL TOPICS
  // ==========================================
  {
    id: 'sql_q_01',
    title: 'Second Highest Salary',
    difficulty: 'Medium',
    subject: 'SQL',
    topic: 'Basic Queries & SELECT',
    tags: ['SQL', 'Aggregation', 'Subqueries'],
    description: `Table: \`Employee\`
\`\`\`
+-------------+------+
| Column Name | Type |
+-------------+------+
| id          | int  |
| salary      | int  |
+-------------+------+
id is the primary key column for this table.
\`\`\`

Write a solution to find the **second highest** distinct salary from the \`Employee\` table. If there is no second highest salary, return \`null\` (or \`NULL\` in SQL).`,
    examples: [
      {
        input: 'Employee table: id=1, salary=100; id=2, salary=200; id=3, salary=300',
        output: 'SecondHighestSalary = 200',
        explanation: 'The highest salary is 300, and the second highest is 200.',
      },
    ],
    constraints: ['The Employee table contains at least 1 record.'],
    expectedComplexity: { time: 'O(N)', space: 'O(1)' },
    functionSignature: {
      SQL: 'SELECT ... AS SecondHighestSalary',
    },
    starterCode: {
      SQL: `-- Write your SQL query statement below\nSELECT (\n    SELECT DISTINCT salary\n    FROM Employee\n    ORDER BY salary DESC\n    LIMIT 1 OFFSET 1\n) AS SecondHighestSalary;`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'Employee = [{id: 1, salary: 100}, {id: 2, salary: 200}, {id: 3, salary: 300}]', expectedOutput: '200', isHidden: false },
    ],
    hints: ['Use DISTINCT and ORDER BY salary DESC LIMIT 1 OFFSET 1 wrapped in a subquery.'],
    editorial: { approach: 'Subquery wrapping LIMIT 1 OFFSET 1 ensures NULL if fewer than 2 distinct salaries exist.', timeComplexity: 'O(N log N)', spaceComplexity: 'O(1)' },
  },
  {
    id: 'sql_q_02',
    title: 'Duplicate Emails',
    difficulty: 'Easy',
    subject: 'SQL',
    topic: 'Aggregation & GROUP BY',
    tags: ['SQL', 'GROUP BY', 'HAVING'],
    description: `Table: \`Person\`
\`\`\`
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| email       | varchar |
+-------------+---------+
id is the primary key column for this table.
\`\`\`

Write a solution to report all the duplicate emails. Note that it's guaranteed email field is not NULL.

Return the result table in **any order**.`,
    examples: [
      {
        input: 'Person table: id=1, email="a@b.com"; id=2, email="c@d.com"; id=3, email="a@b.com"',
        output: 'Email = ["a@b.com"]',
        explanation: 'a@b.com appears twice.',
      },
    ],
    constraints: ['Person table contains records with valid emails.'],
    expectedComplexity: { time: 'O(N)', space: 'O(N)' },
    functionSignature: {
      SQL: 'SELECT email FROM Person GROUP BY email HAVING COUNT(email) > 1',
    },
    starterCode: {
      SQL: `-- Write your PostgreSQL / MySQL query statement below\nSELECT email\nFROM Person\nGROUP BY email\nHAVING COUNT(email) > 1;`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'Person = [{id: 1, email: "a@b.com"}, {id: 2, email: "c@d.com"}, {id: 3, email: "a@b.com"}]', expectedOutput: '["a@b.com"]', isHidden: false },
    ],
    hints: ['Use GROUP BY email and filter with HAVING COUNT(*) > 1.'],
    editorial: { approach: 'Grouping with HAVING count filter.', timeComplexity: 'O(N)', spaceComplexity: 'O(N)' },
  },

  // ==========================================
  // OPERATING SYSTEMS
  // ==========================================
  {
    id: 'os_q_01',
    title: 'Simulate Round Robin CPU Scheduling',
    difficulty: 'Medium',
    subject: 'Operating Systems',
    topic: 'CPU Scheduling Algorithms',
    tags: ['Operating Systems', 'Queue', 'CPU Scheduling', 'Simulation'],
    description: `You are given a list of \`processes\` where \`processes[i] = [pid, arrivalTime, burstTime]\` and a time slice \`timeQuantum\`.

Simulate the **Round Robin (RR)** preemptive scheduling algorithm.
Compute the average **Waiting Time** and average **Turnaround Time** for all processes.

Return an array \`[avgWaitingTime, avgTurnaroundTime]\` rounded to 2 decimal places.`,
    examples: [
      {
        input: 'processes = [[1, 0, 5], [2, 1, 4], [3, 2, 2]], timeQuantum = 2',
        output: '[4.33, 8.00]',
        explanation: 'P1 executes 0-2, P2 executes 2-4, P3 executes 4-6 (finishes at 6), P1 executes 6-8, etc.',
      },
    ],
    constraints: ['1 <= processes.length <= 100', '1 <= timeQuantum <= 10'],
    expectedComplexity: { time: 'O(Total Burst / Quantum)', space: 'O(N)' },
    functionSignature: {
      'C++': 'vector<double> roundRobinScheduling(vector<vector<int>>& processes, int timeQuantum)',
      Java: 'public double[] roundRobinScheduling(int[][] processes, int timeQuantum)',
      Python: 'def roundRobinScheduling(self, processes: List[List[int]], timeQuantum: int) -> List[float]:',
      JavaScript: 'function roundRobinScheduling(processes, timeQuantum)',
    },
    starterCode: {
      'C++': `#include <vector>\n#include <queue>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<double> roundRobinScheduling(vector<vector<int>>& processes, int timeQuantum) {\n        // Write Round Robin simulation\n        return {0.0, 0.0};\n    }\n};`,
      Java: `import java.util.*;\n\nclass Solution {\n    public double[] roundRobinScheduling(int[][] processes, int timeQuantum) {\n        // Write Round Robin simulation\n        return new double[]{0.0, 0.0};\n    }\n}`,
      Python: `from typing import List\nfrom collections import deque\n\nclass Solution:\n    def roundRobinScheduling(self, processes: List[List[int]], timeQuantum: int) -> List[float]:\n        # Write Round Robin simulation\n        pass`,
      JavaScript: `function roundRobinScheduling(processes, timeQuantum) {\n  // Write Round Robin simulation\n  return [0.0, 0.0];\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'processes = [[1, 0, 5], [2, 1, 4], [3, 2, 2]], timeQuantum = 2', expectedOutput: '[4.33, 8.00]', isHidden: false },
    ],
    hints: ['Use a Ready Queue to push processes arriving at current time, decrement remaining burst by min(quantum, remaining).'],
    editorial: { approach: 'Queue-based discrete time simulation tracking arrival and completion.', timeComplexity: 'O(N * B)', spaceComplexity: 'O(N)' },
  },
  {
    id: 'os_q_02',
    title: 'LRU Page Replacement Simulation',
    difficulty: 'Medium',
    subject: 'Operating Systems',
    topic: 'Virtual Memory & Page Replacement',
    tags: ['Operating Systems', 'LRU', 'Virtual Memory', 'Hash Table'],
    description: `Given an array of page references \`pages\` and the maximum number of frames \`capacity\` in physical memory, calculate the total number of **Page Faults** that occur using the **Least Recently Used (LRU)** page replacement algorithm.

Assume memory is initially empty.`,
    examples: [
      {
        input: 'pages = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2], capacity = 4',
        output: '6',
        explanation: 'A total of 6 page faults occur as pages are swapped out based on least recent usage.',
      },
    ],
    constraints: ['1 <= pages.length <= 1000', '1 <= capacity <= 50'],
    expectedComplexity: { time: 'O(N)', space: 'O(capacity)' },
    functionSignature: {
      'C++': 'int lruPageFaults(vector<int>& pages, int capacity)',
      Java: 'public int lruPageFaults(int[] pages, int capacity)',
      Python: 'def lruPageFaults(self, pages: List[int], capacity: int) -> int:',
      JavaScript: 'function lruPageFaults(pages, capacity)',
    },
    starterCode: {
      'C++': `#include <vector>\n#include <unordered_map>\n#include <list>\nusing namespace std;\n\nclass Solution {\npublic:\n    int lruPageFaults(vector<int>& pages, int capacity) {\n        // Write LRU simulation\n        return 0;\n    }\n};`,
      Java: `import java.util.*;\n\nclass Solution {\n    public int lruPageFaults(int[] pages, int capacity) {\n        // Write LRU simulation\n        return 0;\n    }\n}`,
      Python: `from typing import List\nfrom collections import OrderedDict\n\nclass Solution:\n    def lruPageFaults(self, pages: List[int], capacity: int) -> int:\n        # Write LRU simulation\n        pass`,
      JavaScript: `function lruPageFaults(pages, capacity) {\n  // Write LRU simulation\n  return 0;\n}`,
    },
    hiddenTestCases: [
      { id: 'tc_1', input: 'pages = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2], capacity = 4', expectedOutput: '6', isHidden: false },
    ],
    hints: ['Use an OrderedDict or Doubly Linked List + HashMap to maintain the recency order of active pages in memory.'],
    editorial: { approach: 'LRU Cache tracking page accesses in physical frames.', timeComplexity: 'O(N)', spaceComplexity: 'O(capacity)' },
  },
];

/**
 * Helper: Find questions matching subject, topic, and optional difficulty
 */
export function getQuestionsForTopic(
  subject: string,
  topic: string,
  difficulty?: string
): CodingProblem[] {
  const cleanSubj = (subject || 'DSA').toLowerCase().trim();
  const cleanTopic = (topic || '').toLowerCase().trim();

  let filtered = DEFAULT_CODING_QUESTION_BANK.filter((p) => {
    const pSubj = (p.subject || '').toLowerCase().trim();
    const pTopic = (p.topic || '').toLowerCase().trim();

    const subjMatch =
      pSubj === cleanSubj ||
      (cleanSubj === 'dsa' && (pSubj === 'dsa' || pSubj === '')) ||
      (cleanSubj.includes('os') && pSubj.includes('operating')) ||
      (cleanSubj.includes('dbms') && (pSubj === 'dbms' || pSubj === 'sql'));

    const topicMatch =
      !cleanTopic ||
      pTopic === cleanTopic ||
      pTopic.includes(cleanTopic) ||
      cleanTopic.includes(pTopic) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(cleanTopic)));

    return subjMatch && topicMatch;
  });

  if (difficulty && difficulty !== 'All') {
    filtered = filtered.filter((p) => p.difficulty.toLowerCase() === difficulty.toLowerCase());
  }

  return filtered;
}

export interface TopicQuestionCount {
  topic: string;
  totalQuestions: number;
  easy: number;
  medium: number;
  hard: number;
}

/**
 * Helper: Find a problem in the bank by id
 */
export function findQuestionById(id: string): CodingProblem | undefined {
  return DEFAULT_CODING_QUESTION_BANK.find((p) => p.id === id);
}

/**
 * Helper: Get all available topics with question counts for a subject
 */
export function getAvailableTopicsWithCounts(subject: string): TopicQuestionCount[] {
  const cleanSubj = (subject || 'DSA').toLowerCase().trim();
  const topicMap = new Map<string, { total: number; easy: number; medium: number; hard: number }>();

  for (const p of DEFAULT_CODING_QUESTION_BANK) {
    const pSubj = (p.subject || '').toLowerCase().trim();
    const match =
      pSubj === cleanSubj ||
      (cleanSubj === 'dsa' && (pSubj === 'dsa' || pSubj === '')) ||
      (cleanSubj.includes('os') && pSubj.includes('operating')) ||
      (cleanSubj.includes('dbms') && (pSubj === 'dbms' || pSubj === 'sql'));

    if (match && p.topic) {
      const existing = topicMap.get(p.topic) || { total: 0, easy: 0, medium: 0, hard: 0 };
      existing.total++;
      if (p.difficulty === 'Easy') existing.easy++;
      else if (p.difficulty === 'Medium') existing.medium++;
      else if (p.difficulty === 'Hard') existing.hard++;
      topicMap.set(p.topic, existing);
    }
  }

  return Array.from(topicMap.entries()).map(([topic, counts]) => ({
    topic,
    totalQuestions: counts.total,
    easy: counts.easy,
    medium: counts.medium,
    hard: counts.hard,
  }));
}
