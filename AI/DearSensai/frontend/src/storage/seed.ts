import { db } from './db';
import { Subject, Topic, Subtopic, RevisionItem, ReviewSchedule } from '../core/types';
import { createInitialSchedule } from '../core/scheduler/srs';

export async function seedDatabase(force: boolean = false): Promise<void> {
  const subjectCount = await db.subjects.count();
  if (subjectCount > 0 && !force) {
    return;
  }

  if (force) {
    await db.subjects.clear();
    await db.topics.clear();
    await db.subtopics.clear();
    await db.revisionItems.clear();
    await db.reviewSchedules.clear();
    await db.attempts.clear();
    await db.mistakes.clear();
    await db.syncQueue.clear();
  }

  const now = Date.now();

  // 1. SUBJECTS
  const subjects: Subject[] = [
    {
      id: 'sub_dsa',
      title: 'Data Structures & Algorithms',
      icon: 'Binary',
      description: 'Core patterns, two-pointer, trees, graphs, dynamic programming, and complexity logic.',
      color: 'var(--subject-dsa)',
      orderIndex: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sub_java',
      title: 'Java Core & Advanced',
      icon: 'Coffee',
      description: 'JVM internals, Memory Model, OOP mechanics, Collections framework, and concurrency.',
      color: 'var(--subject-java)',
      orderIndex: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sub_spring',
      title: 'Spring Boot & Microservices',
      icon: 'Leaf',
      description: 'Dependency Injection, Bean lifecycle, JPA transactions, REST architecture, and Security.',
      color: 'var(--subject-spring)',
      orderIndex: 3,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // 2. TOPICS
  const topics: Topic[] = [
    // DSA Topics
    {
      id: 'top_dsa_twopointer',
      subjectId: 'sub_dsa',
      title: 'Two Pointer & Sliding Window',
      description: 'Techniques for sorted arrays, palindrome checks, fast-slow pointers, and subarray ranges.',
      orderIndex: 1,
      updatedAt: now,
    },
    {
      id: 'top_dsa_binarysearch',
      subjectId: 'sub_dsa',
      title: 'Binary Search & Monotonic Space',
      description: 'Search space reduction, boundary predicates, search in rotated arrays.',
      orderIndex: 2,
      updatedAt: now,
    },
    {
      id: 'top_dsa_trees',
      subjectId: 'sub_dsa',
      title: 'Binary Trees & Traversals',
      description: 'DFS (Pre/In/Postorder), BFS level-order, recursion tree frames, and BST properties.',
      orderIndex: 3,
      updatedAt: now,
    },

    // Java Topics
    {
      id: 'top_java_collections',
      subjectId: 'sub_java',
      title: 'Collections & HashMap Internals',
      description: 'Buckets, hash collisions, treeification threshold, equals & hashCode contract.',
      orderIndex: 1,
      updatedAt: now,
    },
    {
      id: 'top_java_memory',
      subjectId: 'sub_java',
      title: 'JVM Memory & Garbage Collection',
      description: 'Stack vs Heap, Metaspace, String Pool immutability, GC Roots and Generations.',
      orderIndex: 2,
      updatedAt: now,
    },
    {
      id: 'top_java_oop',
      subjectId: 'sub_java',
      title: 'OOP Mechanics & Dynamic Binding',
      description: 'Method overriding vs overloading, runtime polymorphism dispatch, abstract classes vs interfaces.',
      orderIndex: 3,
      updatedAt: now,
    },

    // Spring Boot Topics
    {
      id: 'top_spring_core',
      subjectId: 'sub_spring',
      title: 'Spring Core & Bean Lifecycle',
      description: 'IoC Container, Constructor vs Field Injection, Bean scopes, @PostConstruct hooks.',
      orderIndex: 1,
      updatedAt: now,
    },
    {
      id: 'top_spring_data',
      subjectId: 'sub_spring',
      title: 'Spring Data JPA & Transactions',
      description: '@Transactional proxy mechanics, JPA N+1 query problem, fetch strategies, entity states.',
      orderIndex: 2,
      updatedAt: now,
    },
  ];

  // 3. REVISION ITEMS
  const revisionItems: RevisionItem[] = [
    // --- DSA Items ---
    {
      id: 'rev_dsa_01',
      topicId: 'top_dsa_twopointer',
      type: 'LOGIC',
      title: 'In-Place Duplicate Removal on Sorted Array',
      frontContent: 'You are given a sorted array nums. You must remove duplicates in-place such that each unique element appears once. What is the optimal two-pointer logic and time/space complexity?',
      backContent: 'Maintain a slow write-pointer `i = 0` and iterate with fast read-pointer `j = 1` through `nums.length - 1`.\n\nWhenever `nums[j] != nums[i]`, increment `i` and set `nums[i] = nums[j]`.\n\nReturn `i + 1` as the new length.\n\n• Time Complexity: O(n) — single pass.\n• Space Complexity: O(1) — strictly in-place.',
      tip: 'Two Pointer → maintain one pointer for write-index and one for scan-index in sorted arrays.',
      tags: ['Two Pointer', 'Arrays', 'In-Place'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rev_dsa_02',
      topicId: 'top_dsa_twopointer',
      type: 'CODE_RECALL',
      title: 'Two Sum II (Sorted Input Array)',
      frontContent: 'Complete the two-pointer code to find two indices whose elements add up to the given target.',
      backContent: 'Standard left/right converging pointers. When sum < target, left++. When sum > target, right--.',
      codeLanguage: 'java',
      codeSnippet: `public int[] twoSum(int[] numbers, int target) {
    int left = 0, right = numbers.length - 1;
    while (left < right) {
        int sum = numbers[left] + numbers[right];
        if (sum == target) {
            return new int[]{left + 1, right + 1};
        } else if (___BLANK_1___) {
            ___BLANK_2___;
        } else {
            ___BLANK_3___;
        }
    }
    return new int[]{-1, -1};
}`,
      codeBlanks: [
        {
          id: 'BLANK_1',
          target: 'sum < target',
          hint: 'Condition when sum is too small',
          options: ['sum < target', 'sum > target', 'numbers[left] < 0', 'left < right'],
        },
        {
          id: 'BLANK_2',
          target: 'left++',
          hint: 'Pointer adjustment to increase sum',
          options: ['left++', 'right--', 'left--', 'right++'],
        },
        {
          id: 'BLANK_3',
          target: 'right--',
          hint: 'Pointer adjustment to decrease sum',
          options: ['right--', 'left++', 'right = left', 'break'],
        },
      ],
      difficulty: 'LEVEL_1',
      explanation: 'Since the array is sorted, moving `left` forward increases the candidate sum, and moving `right` backward decreases it.',
      tags: ['Two Pointer', 'Code Recall'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rev_dsa_03',
      topicId: 'top_dsa_binarysearch',
      type: 'WHY',
      title: 'Why Does Binary Search Require a Monotonic Search Space?',
      frontContent: 'Why does Binary Search fundamentally rely on monotonicity (sorted order or a boolean condition f(x) transitioning from False to True)?',
      backContent: 'Binary search works by evaluating the middle element `mid` to make an unambiguous elimination decision: guarantee that the target CANNOT exist in one half of the search space.\n\nWithout monotonicity, checking `nums[mid]` gives zero information about whether the target lies to the left or right, destroying the O(log n) divide-and-conquer guarantee.',
      explanation: 'Monotonicity provides the invariant predicate: if condition holds at `mid`, we can discard either `[start..mid]` or `[mid..end]`.',
      tags: ['Binary Search', 'Invariants', 'Why'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rev_dsa_04',
      topicId: 'top_dsa_binarysearch',
      type: 'CODE_RECALL',
      title: 'Classic Binary Search (Overflow-Safe Mid)',
      frontContent: 'Fill in the midpoint calculation and bounds update for standard binary search.',
      backContent: 'Calculate mid safely using `left + (right - left) / 2` to prevent 32-bit integer overflow.',
      codeLanguage: 'java',
      codeSnippet: `public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = ___BLANK_1___;
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            ___BLANK_2___;
        } else {
            ___BLANK_3___;
        }
    }
    return -1;
}`,
      codeBlanks: [
        {
          id: 'BLANK_1',
          target: 'left + (right - left) / 2',
          hint: 'Integer overflow-safe midpoint calculation',
          options: ['left + (right - left) / 2', '(left + right) / 2', 'left + right / 2', '(right - left) / 2'],
        },
        {
          id: 'BLANK_2',
          target: 'left = mid + 1',
          hint: 'Update left bound when mid value is too small',
          options: ['left = mid + 1', 'left = mid', 'right = mid - 1', 'left++'],
        },
        {
          id: 'BLANK_3',
          target: 'right = mid - 1',
          hint: 'Update right bound when mid value is too large',
          options: ['right = mid - 1', 'right = mid', 'left = mid + 1', 'right--'],
        },
      ],
      difficulty: 'LEVEL_1',
      tags: ['Binary Search', 'Code Recall'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rev_dsa_05',
      topicId: 'top_dsa_trees',
      type: 'CONCEPT',
      title: 'DFS vs BFS Space Complexity in a Balanced Binary Tree',
      frontContent: 'What is the auxiliary space complexity of DFS (recursive) vs BFS (Queue) on a balanced binary tree with N nodes and height H?',
      backContent: '• DFS Space: O(H) = O(log N) — proportional to the height of the recursion stack.\n• BFS Space: O(W) = O(N/2) = O(N) — proportional to the maximum width of the tree (leaf level contains ~N/2 nodes).\n\nKey Takeaway: For balanced deep trees, DFS uses significantly less memory than BFS.',
      explanation: 'DFS memory is bound by tree depth, whereas BFS memory is bound by maximum level width.',
      tags: ['Trees', 'Complexity', 'DFS', 'BFS'],
      createdAt: now,
      updatedAt: now,
    },

    // --- Java Items ---
    {
      id: 'rev_java_01',
      topicId: 'top_java_collections',
      type: 'FLASHCARD',
      title: 'HashMap Treeification Threshold (Java 8+)',
      frontContent: 'In Java 8+, under what exact conditions does a HashMap bucket (linked list) convert into a Red-Black Tree (TreeNode)?',
      backContent: 'A bucket treeifies when BOTH conditions are met:\n1. The bucket bin reaches or exceeds TREEIFY_THRESHOLD (≥ 8 elements in the same bucket).\n2. The total table capacity is at least MIN_TREEIFY_CAPACITY (≥ 64).\n\nIf the bin has ≥ 8 items but capacity is < 64, the table is resized instead of treeifying.',
      tip: 'Remember: 8 items in a bin AND 64 total capacity. Otherwise resize!',
      tags: ['Java', 'HashMap', 'Collections'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rev_java_02',
      topicId: 'top_java_collections',
      type: 'CONCEPT',
      title: 'The equals() and hashCode() Contract',
      frontContent: 'What happens if you override equals() but forget to override hashCode() in a Java class used as a key in a HashMap?',
      backContent: 'The HashMap will fail to locate existing keys on `get()` and allow duplicate keys on `put()`.\n\nWhy:\n1. `get(key)` calculates `key.hashCode()` to find the bucket index.\n2. Without overriding, the default `Object.hashCode()` produces different hash codes for two logically equal objects.\n3. The search lands in the wrong bucket, never even reaching `equals()`!',
      explanation: 'Contract: If `a.equals(b) == true`, then `a.hashCode()` MUST equal `b.hashCode()`.',
      tags: ['Java', 'HashMap', 'Contract'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rev_java_03',
      topicId: 'top_java_memory',
      type: 'WHY',
      title: 'Why are String Objects Immutable in Java?',
      frontContent: 'Give the 3 main engineering reasons why java.lang.String was designed to be immutable.',
      backContent: '1. String Pool Caching: Multiple references can point to the same string in the pool without race conditions.\n2. Thread Safety: Immutable strings are inherently thread-safe and can be shared freely across threads without synchronization.\n3. Security & ClassLoading: Strings carry sensitive data (passwords, network sockets, class names). Immutability prevents malicious tampering after validation.\n4. HashCode Caching: Hash code can be lazily computed once and cached, making hash table operations fast.',
      tags: ['Java', 'JVM', 'Strings', 'Immutability'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rev_java_04',
      topicId: 'top_java_oop',
      type: 'CONCEPT',
      title: 'Method Overriding Dynamic Method Dispatch',
      frontContent: 'Consider:\n`Parent obj = new Child(); obj.doSomething();`\nHow does the JVM resolve which method to call at runtime?',
      backContent: 'The JVM uses Dynamic Method Dispatch (invokevirtual bytecode instruction).\n\nAt runtime, the JVM checks the actual object type in Heap memory (`Child`), consults the `vtable` (virtual method table) of the `Child` class, and executes `Child.doSomething()`.\n\nStatic methods, private methods, and final methods bypass dynamic dispatch and use static binding.',
      tags: ['Java', 'OOP', 'JVM', 'Polymorphism'],
      createdAt: now,
      updatedAt: now,
    },

    // --- Spring Boot Items ---
    {
      id: 'rev_spring_01',
      topicId: 'top_spring_core',
      type: 'WHY',
      title: 'Why Constructor Injection is Preferred Over @Autowired Field Injection',
      frontContent: 'Why does the Spring team strongly recommend Constructor Injection over @Autowired on fields?',
      backContent: '1. Immutability: Dependencies can be declared `final`, preventing re-assignment.\n2. Testability: Easy unit testing with plain JUnit/Mockito without needing Spring Test context or reflection.\n3. Null Safety: Prevents `NullPointerException` because beans cannot be instantiated in an incomplete state.\n4. Circular Dependency Detection: Circular dependencies are caught immediately at application startup rather than runtime.',
      tip: 'Use Lombok `@RequiredArgsConstructor` with `private final Dependency dep;` for clean constructor injection.',
      tags: ['Spring Boot', 'DI', 'Best Practices'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rev_spring_02',
      topicId: 'top_spring_core',
      type: 'CODE_RECALL',
      title: 'Spring Bean Lifecycle Hooks',
      frontContent: 'Fill in the standard annotations for execution after dependency injection and before destruction.',
      backContent: '@PostConstruct runs right after bean initialization. @PreDestroy runs before bean destruction.',
      codeLanguage: 'java',
      codeSnippet: `@Component
public class CacheWarmupService {

    ___BLANK_1___
    public void init() {
        System.out.println("Cache initialized after dependencies are injected");
    }

    ___BLANK_2___
    public void cleanup() {
        System.out.println("Releasing resources before container shutdown");
    }
}`,
      codeBlanks: [
        {
          id: 'BLANK_1',
          target: '@PostConstruct',
          hint: 'Jakarta/Javax annotation for post-init hook',
          options: ['@PostConstruct', '@BeforeEach', '@EventListener', '@BeanInit'],
        },
        {
          id: 'BLANK_2',
          target: '@PreDestroy',
          hint: 'Jakarta/Javax annotation for pre-cleanup hook',
          options: ['@PreDestroy', '@Destroy', '@BeforeShutdown', '@Finalize'],
        },
      ],
      difficulty: 'LEVEL_1',
      tags: ['Spring Boot', 'Lifecycle', 'Code Recall'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rev_spring_03',
      topicId: 'top_spring_data',
      type: 'LOGIC',
      title: 'Self-Invocation Pitfall with @Transactional in Spring',
      frontContent: 'What happens if a non-transactional method `methodA()` inside `MyService` calls `@Transactional public void methodB()` inside the SAME `MyService` class?',
      backContent: 'The `@Transactional` annotation on `methodB()` will be completely ignored! No transaction will start.\n\nWhy:\nSpring transactions operate via Dynamic AOP Proxies. Calling `methodB()` from `methodA()` inside the same class is an internal `this.methodB()` call that bypasses the Spring Proxy wrapper completely.\n\nFix:\nMove `methodB()` to a separate service, or inject the self-proxy `self.methodB()`.',
      explanation: 'Spring AOP proxies intercept calls from outside the bean. Direct internal calls bypass proxy interception.',
      tags: ['Spring Boot', 'Transactions', 'AOP', 'Pitfalls'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rev_spring_04',
      topicId: 'top_spring_data',
      type: 'LOGIC',
      title: 'Solving the JPA N+1 Query Problem',
      frontContent: 'Explain the JPA N+1 query problem when fetching parent entities with `@OneToMany` relations, and the primary ways to fix it.',
      backContent: 'Problem:\nFetching N parent entities results in 1 initial query for parents, followed by N separate queries to fetch the lazy children for each parent (1 + N queries total).\n\nSolutions:\n1. `JOIN FETCH`: `SELECT p FROM Parent p JOIN FETCH p.children` in JPQL / Spring Data `@Query`.\n2. `@EntityGraph(attributePaths = {"children"})` on the repository method.\n3. `@BatchSize(size = 20)` on the collection to batch fetch child records in chunks via `WHERE parent_id IN (...)`.',
      tags: ['Spring Data', 'JPA', 'Performance', 'N+1'],
      createdAt: now,
      updatedAt: now,
    },
  ];

  // 4. REVIEW SCHEDULES
  const schedules: ReviewSchedule[] = revisionItems.map((item, idx) => {
    const schedule = createInitialSchedule(item.id);
    // Stagger a couple of due items so "Due Today" immediately has realistic items ready
    if (idx % 2 === 0) {
      schedule.nextReviewDate = now - 1000 * 60 * 60; // 1 hr ago (due now)
    }
    return schedule;
  });

  await db.subjects.bulkPut(subjects);
  await db.topics.bulkPut(topics);
  await db.revisionItems.bulkPut(revisionItems);
  await db.reviewSchedules.bulkPut(schedules);
}
