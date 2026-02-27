/**
 * topicConfig.js — Single source of truth for every playable topic.
 * Goals, commands, simulator mode, and hints all live here.
 * Both stores and UI read from this config.
 */

export const SIMULATOR = {
  MEMORY: "memory",  // OS memory allocator — ALLOC / FREE
  BTREE:  "btree",   // DBMS B-tree visualizer — INSERT / SELECT
  SCHEMA: "schema",  // DBMS schema builder — CREATE / USE
};

export const TOPIC_CONFIG = {

  // ── OS: Fundamentals ──────────────────────────────────────────────────────
  "what-is-an-operating-system": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Allocate your first memory block (any size)",  xp: 30, check: s => s.memory.blocks.length >= 1 },
      { id: 2, text: "Allocate a block larger than 200 MB",          xp: 40, check: s => s.memory.blocks.some(b => b.size > 200) },
      { id: 3, text: "Free a block — observe memory reclaimed",      xp: 30, check: s => s.freed >= 1 },
    ],
    commands: [
      { cmd: "ALLOC [size] [name]", desc: "Allocate a memory block  (e.g. ALLOC 256 Kernel)" },
      { cmd: "FREE [name]",         desc: "Release a block  (e.g. FREE Kernel)" },
    ],
    terminalHint: "ALLOC 512 Kernel  →  ALLOC 128 UserApp  →  FREE UserApp",
  },

  "kernel-vs-user-mode": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Allocate a 'Kernel' process block",     xp: 30, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "kernel") },
      { id: 2, text: "Allocate a 'UserApp' process block",    xp: 30, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "userapp") },
      { id: 3, text: "Free UserApp — simulate user process exit", xp: 40, check: s => s.freed >= 1 },
    ],
    commands: [
      { cmd: "ALLOC 128 Kernel",  desc: "Privileged kernel space" },
      { cmd: "ALLOC 64 UserApp",  desc: "Unprivileged user process" },
      { cmd: "FREE [name]",       desc: "Process exits / mode switch" },
    ],
    terminalHint: "ALLOC 128 Kernel  →  ALLOC 64 UserApp  →  FREE UserApp",
  },

  "system-calls": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Allocate memory for 3 different processes",     xp: 40, check: s => s.memory.blocks.length >= 3 },
      { id: 2, text: "Simulate a system call: allocate 'SysBuffer'",  xp: 30, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "sysbuffer") },
      { id: 3, text: "Free SysBuffer — return memory to OS",          xp: 30, check: s => s.freed >= 1 },
    ],
    commands: [
      { cmd: "ALLOC [size] [name]", desc: "brk() / mmap() system call analogue" },
      { cmd: "FREE [name]",         desc: "munmap() system call analogue" },
    ],
    terminalHint: "ALLOC 64 ProcA  →  ALLOC 128 SysBuffer  →  ALLOC 32 ProcB  →  FREE SysBuffer",
  },

  "os-architecture": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Allocate 'Kernel', 'FS', and 'Drivers' layers", xp: 50, check: s => {
        const n = s.memory.blocks.map(b => b.name?.toLowerCase());
        return n.includes("kernel") && n.includes("fs") && n.includes("drivers");
      }},
      { id: 2, text: "Total allocated memory exceeds 300 MB",         xp: 30, check: s => s.memory.heapUsed > 300 },
      { id: 3, text: "Free one layer — simulate hot-swap driver reload", xp: 30, check: s => s.freed >= 1 },
    ],
    commands: [
      { cmd: "ALLOC 128 Kernel",  desc: "Kernel layer" },
      { cmd: "ALLOC 64 FS",       desc: "File system layer" },
      { cmd: "ALLOC 64 Drivers",  desc: "Device driver layer" },
      { cmd: "FREE [name]",       desc: "Unload a layer" },
    ],
    terminalHint: "ALLOC 128 Kernel  →  ALLOC 64 FS  →  ALLOC 64 Drivers  →  FREE Drivers",
  },

  // ── OS: Process Management ─────────────────────────────────────────────────
  "process-vs-program": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Launch a process (program → process transition)",  xp: 30, check: s => s.memory.blocks.length >= 1 },
      { id: 2, text: "Run 3 concurrent processes simultaneously",        xp: 40, check: s => s.memory.blocks.length >= 3 },
      { id: 3, text: "Terminate a process (FREE it)",                    xp: 30, check: s => s.freed >= 1 },
    ],
    commands: [
      { cmd: "ALLOC 200 Chrome",   desc: "Launch Chrome process" },
      { cmd: "ALLOC 150 VSCode",   desc: "Launch VSCode process" },
      { cmd: "ALLOC 80 Terminal",  desc: "Launch Terminal process" },
      { cmd: "FREE [name]",        desc: "Terminate a process" },
    ],
    terminalHint: "ALLOC 200 Chrome  →  ALLOC 150 VSCode  →  ALLOC 80 Terminal  →  FREE Chrome",
  },

  "process-states": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Create a 'Ready' process  (ALLOC 64 Ready)",      xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "ready") },
      { id: 2, text: "Create a 'Running' process  (ALLOC 128 Running)", xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "running") },
      { id: 3, text: "Create a 'Waiting' process  (ALLOC 64 Waiting)",  xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "waiting") },
      { id: 4, text: "Terminate all — FREE Ready, Running, Waiting",    xp: 50, check: s => s.memory.blocks.length === 0 && s.freed >= 3 },
    ],
    commands: [
      { cmd: "ALLOC 64 Ready",    desc: "Process enters Ready queue" },
      { cmd: "ALLOC 128 Running", desc: "Process dispatched to CPU" },
      { cmd: "ALLOC 64 Waiting",  desc: "Process blocked on I/O" },
      { cmd: "FREE [name]",       desc: "Process terminates" },
    ],
    terminalHint: "ALLOC 64 Ready  →  ALLOC 128 Running  →  ALLOC 64 Waiting  →  FREE Running  →  FREE Waiting  →  FREE Ready",
  },

  "context-switching": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Allocate P1 (128 MB) — process gets CPU",     xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "p1") },
      { id: 2, text: "Allocate PCB_P1 (16 MB) — save CPU state",    xp: 35, check: s => s.memory.blocks.some(b => b.name?.toLowerCase().includes("pcb")) },
      { id: 3, text: "Allocate P2 (128 MB) — next process gets CPU",xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "p2") },
      { id: 4, text: "FREE PCB_P1 — context restore complete",       xp: 35, check: s => s.freed >= 1 },
    ],
    commands: [
      { cmd: "ALLOC 128 P1",    desc: "Process 1 running on CPU" },
      { cmd: "ALLOC 16 PCB_P1", desc: "Save P1 register state to PCB" },
      { cmd: "ALLOC 128 P2",    desc: "Process 2 gets CPU time" },
      { cmd: "FREE PCB_P1",     desc: "Restore P1 context later" },
    ],
    terminalHint: "ALLOC 128 P1  →  ALLOC 16 PCB_P1  →  ALLOC 128 P2  →  FREE PCB_P1",
  },

  "cpu-scheduling---fcfs": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Enqueue P1 first  (ALLOC 100 P1)",            xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "p1") },
      { id: 2, text: "Enqueue P2 second  (ALLOC 150 P2)",           xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "p2") },
      { id: 3, text: "Enqueue P3 third  (ALLOC 80 P3)",             xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "p3") },
      { id: 4, text: "Complete FCFS — FREE in order: P1, P2, P3",   xp: 50, check: s => s.memory.blocks.length === 0 && s.freed >= 3 },
    ],
    commands: [
      { cmd: "ALLOC [burst] [name]", desc: "Enqueue process (size = burst time)" },
      { cmd: "FREE [name]",          desc: "Process completes — FCFS order" },
    ],
    terminalHint: "ALLOC 100 P1  →  ALLOC 150 P2  →  ALLOC 80 P3  →  FREE P1  →  FREE P2  →  FREE P3",
  },

  "round-robin": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Add 4 processes to the ready queue",           xp: 30, check: s => s.memory.blocks.length >= 4 },
      { id: 2, text: "One RR cycle — FREE P1 and re-allocate it",    xp: 40, check: s => s.freed >= 1 && s.memory.blocks.length >= 4 },
      { id: 3, text: "Clear queue — all quantum slices complete",    xp: 50, check: s => s.memory.blocks.length === 0 && s.freed >= 5 },
    ],
    commands: [
      { cmd: "ALLOC 20 P1", desc: "Quantum = 20 ms" },
      { cmd: "ALLOC 20 P2", desc: "Each process gets equal turns" },
      { cmd: "FREE [name]", desc: "Quantum expired — preempt" },
    ],
    terminalHint: "ALLOC 20 P1  →  P2  →  P3  →  P4  →  FREE P1  →  ALLOC 20 P1  →  FREE P2  →  ...",
  },

  // ── OS: Memory Management ──────────────────────────────────────────────────
  "contiguous-allocation": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Allocate 3 contiguous blocks A, B, C",         xp: 30, check: s => s.memory.blocks.length >= 3 },
      { id: 2, text: "FREE middle block B — observe the hole",        xp: 40, check: s => s.freed >= 1 },
      { id: 3, text: "Allocate D larger than B's hole — fits or not?",xp: 50, check: s => s.freed >= 1 && s.memory.blocks.length >= 3 },
    ],
    commands: [
      { cmd: "ALLOC 300 A", desc: "First block" },
      { cmd: "ALLOC 200 B", desc: "Middle block (free this one)" },
      { cmd: "ALLOC 300 C", desc: "Third block" },
      { cmd: "FREE B",       desc: "Fragmentation gap appears" },
      { cmd: "ALLOC 250 D", desc: "Try to fit into freed space" },
    ],
    terminalHint: "ALLOC 300 A  →  ALLOC 200 B  →  ALLOC 300 C  →  FREE B  →  ALLOC 250 D",
  },

  "paging": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Load 4 equal page frames (64 MB each)",         xp: 40, check: s => s.memory.blocks.filter(b => b.size === 64).length >= 4 },
      { id: 2, text: "Page fault — load Page5 into a new frame",      xp: 30, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "page5") },
      { id: 3, text: "Page replacement — FREE Page1 (LRU victim)",    xp: 50, check: s => s.freed >= 1 },
    ],
    commands: [
      { cmd: "ALLOC 64 Page1", desc: "Load page into frame 1" },
      { cmd: "ALLOC 64 Page2", desc: "Load page into frame 2" },
      { cmd: "ALLOC 64 Page5", desc: "Page fault — new page needed" },
      { cmd: "FREE Page1",     desc: "LRU eviction" },
    ],
    terminalHint: "ALLOC 64 Page1  →  Page2  →  Page3  →  Page4  →  ALLOC 64 Page5  →  FREE Page1",
  },

  "segmentation": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Allocate Code segment  (ALLOC 100 Code)",       xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "code") },
      { id: 2, text: "Allocate Data segment  (ALLOC 200 Data)",       xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "data") },
      { id: 3, text: "Allocate Stack segment  (ALLOC 64 Stack)",      xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "stack") },
      { id: 4, text: "Allocate Heap segment  (ALLOC 150 Heap)",       xp: 50, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "heap") },
    ],
    commands: [
      { cmd: "ALLOC 100 Code",  desc: "Code (text) segment" },
      { cmd: "ALLOC 200 Data",  desc: "Initialised data segment" },
      { cmd: "ALLOC 64 Stack",  desc: "Stack segment (grows down)" },
      { cmd: "ALLOC 150 Heap",  desc: "Heap segment (grows up)" },
    ],
    terminalHint: "ALLOC 100 Code  →  ALLOC 200 Data  →  ALLOC 64 Stack  →  ALLOC 150 Heap",
  },

  "virtual-memory": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Fill physical RAM — allocate 900 MB total",     xp: 40, check: s => s.memory.heapUsed >= 900 },
      { id: 2, text: "Try ALLOC 200 Swap — should fail (OOM)",        xp: 40, check: s => s.lastError?.includes("memory") || s.memory.heapUsed >= 900 },
      { id: 3, text: "FREE 300 MB — page-out to disk, space recovered",xp: 50, check: s => s.freed >= 1 && s.memory.heapUsed <= 700 },
    ],
    commands: [
      { cmd: "ALLOC 400 App1",  desc: "Virtual address space claim" },
      { cmd: "ALLOC 300 App2",  desc: "Another allocation" },
      { cmd: "ALLOC 200 App3",  desc: "Near the limit" },
      { cmd: "ALLOC 200 Swap",  desc: "This will fail — OOM" },
      { cmd: "FREE App1",        desc: "Page-out: return 400 MB" },
    ],
    terminalHint: "ALLOC 400 App1  →  ALLOC 300 App2  →  ALLOC 200 App3  →  ALLOC 200 Swap (fails)  →  FREE App1",
  },

  "page-replacement---lru": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Fill 4 frames: Page1 – Page4",                  xp: 30, check: s => s.memory.blocks.length >= 4 },
      { id: 2, text: "Page fault: FREE Page1 (LRU), load Page5",      xp: 40, check: s => s.freed >= 1 && s.memory.blocks.some(b => b.name?.toLowerCase() === "page5") },
      { id: 3, text: "Second replacement cycle (Page6 in)",           xp: 50, check: s => s.freed >= 2 && s.memory.blocks.some(b => b.name?.toLowerCase() === "page6") },
    ],
    commands: [
      { cmd: "ALLOC 64 Page1", desc: "Load frame 1" },
      { cmd: "FREE Page1",      desc: "Evict LRU page" },
      { cmd: "ALLOC 64 Page5", desc: "Load replacement page" },
    ],
    terminalHint: "ALLOC 64 Page1  →  Page2  →  Page3  →  Page4  →  FREE Page1  →  ALLOC 64 Page5  →  FREE Page2  →  ALLOC 64 Page6",
  },

  // ── OS: Synchronisation ────────────────────────────────────────────────────
  "critical-section": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Allocate SharedMem — the critical resource",    xp: 30, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "sharedmem") },
      { id: 2, text: "P1 enters — ALLOC P1Lock",                      xp: 30, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "p1lock") },
      { id: 3, text: "P1 exits — FREE P1Lock",                        xp: 40, check: s => s.freed >= 1 },
      { id: 4, text: "P2 enters safely — ALLOC P2Lock",               xp: 30, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "p2lock") },
    ],
    commands: [
      { cmd: "ALLOC 256 SharedMem", desc: "Critical shared resource" },
      { cmd: "ALLOC 8 P1Lock",      desc: "P1 acquires lock (enter section)" },
      { cmd: "FREE P1Lock",          desc: "P1 releases lock (exit section)" },
      { cmd: "ALLOC 8 P2Lock",      desc: "P2 now safely enters" },
    ],
    terminalHint: "ALLOC 256 SharedMem  →  ALLOC 8 P1Lock  →  FREE P1Lock  →  ALLOC 8 P2Lock",
  },

  "mutex": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Create the Mutex object  (ALLOC 8 Mutex)",      xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "mutex") },
      { id: 2, text: "Lock: ALLOC 4 Acquired",                         xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "acquired") },
      { id: 3, text: "Unlock: FREE Acquired",                          xp: 25, check: s => s.freed >= 1 },
      { id: 4, text: "Lock + Unlock 2 more times",                     xp: 50, check: s => s.freed >= 3 },
    ],
    commands: [
      { cmd: "ALLOC 8 Mutex",     desc: "Create mutex object" },
      { cmd: "ALLOC 4 Acquired",  desc: "pthread_mutex_lock()" },
      { cmd: "FREE Acquired",      desc: "pthread_mutex_unlock()" },
    ],
    terminalHint: "ALLOC 8 Mutex  →  ALLOC 4 Acquired  →  FREE Acquired  →  ALLOC 4 Acquired  →  FREE Acquired",
  },

  "semaphores": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Create Semaphore  (ALLOC 4 Semaphore)",         xp: 20, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "semaphore") },
      { id: 2, text: "Wait() ×3 — ALLOC Permit1, Permit2, Permit3",   xp: 40, check: s => ["permit1","permit2","permit3"].every(n => s.memory.blocks.some(b => b.name?.toLowerCase() === n)) },
      { id: 3, text: "Signal() — FREE one permit",                     xp: 30, check: s => s.freed >= 1 },
      { id: 4, text: "Full cycle — all permits released",              xp: 50, check: s => s.freed >= 3 },
    ],
    commands: [
      { cmd: "ALLOC 4 Semaphore", desc: "sem_init(s, 0, 3)" },
      { cmd: "ALLOC 4 Permit1",   desc: "sem_wait() — decrement" },
      { cmd: "FREE Permit1",       desc: "sem_post() — increment" },
    ],
    terminalHint: "ALLOC 4 Semaphore  →  ALLOC 4 Permit1  →  Permit2  →  Permit3  →  FREE Permit1  →  Permit2  →  Permit3",
  },

  "deadlock": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "P1 holds ResA  (ALLOC 100 ResA_P1)",            xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "resa_p1") },
      { id: 2, text: "P2 holds ResB  (ALLOC 100 ResB_P2)",            xp: 25, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "resb_p2") },
      { id: 3, text: "Deadlock! FREE one resource to break the cycle", xp: 50, check: s => s.freed >= 1 },
      { id: 4, text: "Recovery — both processes now complete",         xp: 50, check: s => s.freed >= 2 },
    ],
    commands: [
      { cmd: "ALLOC 100 ResA_P1", desc: "P1 acquires Resource A" },
      { cmd: "ALLOC 100 ResB_P2", desc: "P2 acquires Resource B" },
      { cmd: "FREE ResA_P1",       desc: "Break deadlock: P1 yields A" },
      { cmd: "FREE ResB_P2",       desc: "P2 can now complete" },
    ],
    terminalHint: "ALLOC 100 ResA_P1  →  ALLOC 100 ResB_P2  →  (deadlock!)  →  FREE ResA_P1  →  FREE ResB_P2",
  },

  "bankers-algorithm": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Claim: P1=200, P2=150, P3=100 (safe state)",    xp: 40, check: s => s.memory.heapUsed >= 450 },
      { id: 2, text: "Safety check — total < 80% of 1024 MB",         xp: 40, check: s => s.memory.heapUsed < 819 && s.memory.heapUsed >= 450 },
      { id: 3, text: "Banker grants P2 — FREE P2",                    xp: 50, check: s => s.freed >= 1 },
    ],
    commands: [
      { cmd: "ALLOC 200 P1", desc: "P1 max claim" },
      { cmd: "ALLOC 150 P2", desc: "P2 max claim" },
      { cmd: "ALLOC 100 P3", desc: "P3 max claim (safe total = 450)" },
      { cmd: "FREE P2",       desc: "Banker grants resources to P2" },
    ],
    terminalHint: "ALLOC 200 P1  →  ALLOC 150 P2  →  ALLOC 100 P3  →  FREE P2",
  },

  // ── OS: File Systems ───────────────────────────────────────────────────────
  "inodes": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Allocate InodeTable  (ALLOC 32 InodeTable)",    xp: 30, check: s => s.memory.blocks.some(b => b.name?.toLowerCase() === "inodetable") },
      { id: 2, text: "Allocate 3 data blocks for a file",             xp: 40, check: s => s.memory.blocks.filter(b => b.name?.toLowerCase().startsWith("block")).length >= 3 },
      { id: 3, text: "Delete file — FREE all data blocks",            xp: 50, check: s => s.freed >= 3 },
    ],
    commands: [
      { cmd: "ALLOC 32 InodeTable", desc: "Inode metadata table" },
      { cmd: "ALLOC 64 Block1",     desc: "File data block 1" },
      { cmd: "ALLOC 64 Block2",     desc: "File data block 2" },
      { cmd: "FREE [name]",          desc: "Unlink and reclaim block" },
    ],
    terminalHint: "ALLOC 32 InodeTable  →  ALLOC 64 Block1  →  Block2  →  Block3  →  FREE Block1  →  Block2  →  Block3",
  },

  "disk-scheduling---fcfs": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Queue 4 disk requests",                          xp: 30, check: s => s.memory.blocks.length >= 4 },
      { id: 2, text: "Service FCFS — FREE Req1 first",                 xp: 40, check: s => s.freed >= 1 },
      { id: 3, text: "All requests serviced in arrival order",         xp: 50, check: s => s.memory.blocks.length === 0 && s.freed >= 4 },
    ],
    commands: [
      { cmd: "ALLOC 98 Req1",  desc: "Request at cylinder 98" },
      { cmd: "ALLOC 183 Req2", desc: "Request at cylinder 183" },
      { cmd: "FREE Req1",       desc: "Service in arrival order" },
    ],
    terminalHint: "ALLOC 98 Req1  →  ALLOC 183 Req2  →  ALLOC 37 Req3  →  ALLOC 122 Req4  →  FREE Req1  →  Req2  →  Req3  →  Req4",
  },

  "scan": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Queue 5 requests across cylinders",              xp: 30, check: s => s.memory.blocks.length >= 5 },
      { id: 2, text: "SCAN sweep right — FREE low-cylinder requests",  xp: 40, check: s => s.freed >= 2 },
      { id: 3, text: "SCAN sweep back — FREE high-cylinder requests",  xp: 50, check: s => s.memory.blocks.length === 0 },
    ],
    commands: [
      { cmd: "ALLOC [cyl] [name]", desc: "Queue disk request (size = cylinder)" },
      { cmd: "FREE [name]",         desc: "Service in SCAN order" },
    ],
    terminalHint: "ALLOC 50 Low1  →  ALLOC 75 Low2  →  ALLOC 150 High1  →  ALLOC 190 High2  →  ALLOC 20 Low3  →  FREE Low1  →  Low2  →  then High",
  },

  "c-scan": {
    simulator: SIMULATOR.MEMORY, color: "#00e5ff",
    goals: [
      { id: 1, text: "Queue 6 disk requests",                          xp: 30, check: s => s.memory.blocks.length >= 6 },
      { id: 2, text: "C-SCAN right sweep — FREE first 4",              xp: 40, check: s => s.freed >= 3 },
      { id: 3, text: "Jump to start — FREE the remaining low ones",    xp: 50, check: s => s.memory.blocks.length === 0 },
    ],
    commands: [
      { cmd: "ALLOC [cyl] [name]", desc: "Queue request" },
      { cmd: "FREE [name]",         desc: "Service in C-SCAN circular order" },
    ],
    terminalHint: "ALLOC 50 R1  →  100 R2  →  175 R3  →  190 R4  →  10 R5  →  25 R6  →  FREE R1..R4  →  (jump)  →  FREE R5  →  R6",
  },

  // ── DBMS: Fundamentals ─────────────────────────────────────────────────────
  "what-is-dbms": {
    simulator: SIMULATOR.SCHEMA, color: "#a855f7",
    goals: [
      { id: 1, text: "CREATE DATABASE — make your first database",     xp: 40, check: s => s.dbSchema.children.length > 1 },
      { id: 2, text: "CREATE TABLE — add a table inside it",           xp: 40, check: s => s.dbSchema.children.some(db => db.tables?.length > 0) },
      { id: 3, text: "USE [name] — switch to your new database",       xp: 30, check: s => s.activeTable?.dbName !== "Ecommerce_DB" },
    ],
    commands: [
      { cmd: "CREATE DATABASE [name]", desc: "Create a new database" },
      { cmd: "USE [name]",             desc: "Switch active database" },
      { cmd: "CREATE TABLE [name]",    desc: "Add a table to active DB" },
    ],
    terminalHint: "CREATE DATABASE School  →  USE School  →  CREATE TABLE Students",
  },

  "database-architecture": {
    simulator: SIMULATOR.SCHEMA, color: "#a855f7",
    goals: [
      { id: 1, text: "Create 2 separate databases",                    xp: 30, check: s => s.dbSchema.children.length >= 3 },
      { id: 2, text: "Add 2 tables to each database",                  xp: 40, check: s => s.dbSchema.children.filter(db => db.tables?.length >= 2).length >= 2 },
      { id: 3, text: "USE each database to inspect its schema",        xp: 30, check: s => !!s.activeTable?.dbName },
    ],
    commands: [
      { cmd: "CREATE DATABASE App1",  desc: "First application schema" },
      { cmd: "CREATE DATABASE App2",  desc: "Second application schema" },
      { cmd: "USE App1",              desc: "Switch to App1" },
      { cmd: "CREATE TABLE [name]",   desc: "Add table to active DB" },
    ],
    terminalHint: "CREATE DATABASE App1  →  USE App1  →  CREATE TABLE Users  →  CREATE TABLE Orders  →  CREATE DATABASE App2  →  USE App2",
  },

  "advantages-of-dbms": {
    simulator: SIMULATOR.SCHEMA, color: "#a855f7",
    goals: [
      { id: 1, text: "Create a structured database with 3 tables",    xp: 40, check: s => s.dbSchema.children.some(db => db.tables?.length >= 3) },
      { id: 2, text: "USE the database — demonstrate data sharing",    xp: 30, check: s => !!s.activeTable?.dbName },
      { id: 3, text: "Add an Analytics table for reporting",           xp: 30, check: s => s.dbSchema.children.some(db => db.tables?.some(t => t.name?.toLowerCase().includes("analytic"))) },
    ],
    commands: [
      { cmd: "CREATE DATABASE Corp",    desc: "Corporate database" },
      { cmd: "USE Corp",                desc: "Select it" },
      { cmd: "CREATE TABLE Employees",  desc: "Core entity" },
      { cmd: "CREATE TABLE Analytics",  desc: "Reporting layer" },
    ],
    terminalHint: "CREATE DATABASE Corp  →  USE Corp  →  CREATE TABLE Employees  →  CREATE TABLE Products  →  CREATE TABLE Analytics",
  },

  "types-of-databases": {
    simulator: SIMULATOR.SCHEMA, color: "#a855f7",
    goals: [
      { id: 1, text: "CREATE DATABASE RelationalDB  (SQL)",            xp: 25, check: s => s.dbSchema.children.some(db => db.name?.toLowerCase().includes("relational")) },
      { id: 2, text: "CREATE DATABASE DocumentDB  (NoSQL)",            xp: 25, check: s => s.dbSchema.children.some(db => db.name?.toLowerCase().includes("document")) },
      { id: 3, text: "CREATE DATABASE TimeSeriesDB",                   xp: 25, check: s => s.dbSchema.children.some(db => db.name?.toLowerCase().includes("timeseries")) },
      { id: 4, text: "Add one table to each DB type",                  xp: 50, check: s => s.dbSchema.children.filter(db => !db.name?.includes("SQL_SERVER") && db.tables?.length > 0).length >= 3 },
    ],
    commands: [
      { cmd: "CREATE DATABASE RelationalDB",  desc: "Row-based / SQL store" },
      { cmd: "CREATE DATABASE DocumentDB",    desc: "JSON document store" },
      { cmd: "CREATE DATABASE TimeSeriesDB",  desc: "Time-ordered events" },
      { cmd: "USE [name]  then  CREATE TABLE [name]", desc: "Add tables" },
    ],
    terminalHint: "CREATE DATABASE RelationalDB  →  USE RelationalDB  →  CREATE TABLE Rows  →  repeat for DocumentDB and TimeSeriesDB",
  },

  // ── DBMS: Relational / Normalisation ──────────────────────────────────────
  "relational-model": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "INSERT 5 keys — build your first relation",      xp: 30, check: s => s.insertCount >= 5 },
      { id: 2, text: "SELECT a key — relational lookup",               xp: 30, check: s => s.searchCount >= 1 },
      { id: 3, text: "Trigger a node split — relation grows",          xp: 60, check: s => !!s.bTreeData?.children },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "Add a record  (e.g. INSERT 42)" },
      { cmd: "SELECT [key]", desc: "Point query  (e.g. SELECT 42)" },
    ],
    terminalHint: "INSERT 10  →  20  →  30  →  5  →  25  →  SELECT 20",
  },

  "er-model": {
    simulator: SIMULATOR.SCHEMA, color: "#a855f7",
    goals: [
      { id: 1, text: "Entity: CREATE TABLE Students",                  xp: 25, check: s => s.dbSchema.children.some(db => db.tables?.some(t => t.name?.toLowerCase() === "students")) },
      { id: 2, text: "Entity: CREATE TABLE Courses",                   xp: 25, check: s => s.dbSchema.children.some(db => db.tables?.some(t => t.name?.toLowerCase() === "courses")) },
      { id: 3, text: "Relationship: CREATE TABLE Enrollment",          xp: 25, check: s => s.dbSchema.children.some(db => db.tables?.some(t => t.name?.toLowerCase() === "enrollment")) },
      { id: 4, text: "All 3 tables in one database",                   xp: 50, check: s => s.dbSchema.children.some(db => {
        const n = db.tables?.map(t => t.name?.toLowerCase()) || [];
        return n.includes("students") && n.includes("courses") && n.includes("enrollment");
      })},
    ],
    commands: [
      { cmd: "CREATE DATABASE University", desc: "Container" },
      { cmd: "USE University",             desc: "Select it" },
      { cmd: "CREATE TABLE Students",      desc: "Entity" },
      { cmd: "CREATE TABLE Courses",       desc: "Entity" },
      { cmd: "CREATE TABLE Enrollment",    desc: "Relationship (M:N junction)" },
    ],
    terminalHint: "CREATE DATABASE University  →  USE University  →  CREATE TABLE Students  →  Courses  →  Enrollment",
  },

  "functional-dependencies": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "INSERT 8 keys — establish the relation",         xp: 40, check: s => s.insertCount >= 8 },
      { id: 2, text: "Trigger 2 node splits",                          xp: 50, check: s => s.splitCount >= 2 },
      { id: 3, text: "SELECT 3 keys — same key always same path (A→B)",xp: 30, check: s => s.searchCount >= 3 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "A determines B — deterministic" },
      { cmd: "SELECT [key]", desc: "Verify A → B: same key, same traversal" },
    ],
    terminalHint: "INSERT 1  →  5  →  10  →  15  →  20  →  25  →  30  →  35  →  SELECT 10  →  SELECT 25  →  SELECT 10 (same path!)",
  },

  "1nf-/-2nf-/-3nf": {
    simulator: SIMULATOR.SCHEMA, color: "#a855f7",
    goals: [
      { id: 1, text: "1NF: CREATE TABLE Orders  (atomic values)",      xp: 25, check: s => s.dbSchema.children.some(db => db.tables?.some(t => t.name?.toLowerCase() === "orders")) },
      { id: 2, text: "2NF: CREATE TABLE Customers  (remove partial FD)",xp: 25, check: s => s.dbSchema.children.some(db => db.tables?.some(t => t.name?.toLowerCase() === "customers")) },
      { id: 3, text: "3NF: CREATE TABLE Addresses  (no transitive FD)",xp: 25, check: s => s.dbSchema.children.some(db => db.tables?.some(t => t.name?.toLowerCase() === "addresses")) },
      { id: 4, text: "All 3 normalised tables in one database",        xp: 50, check: s => s.dbSchema.children.some(db => {
        const n = db.tables?.map(t => t.name?.toLowerCase()) || [];
        return n.includes("orders") && n.includes("customers") && n.includes("addresses");
      })},
    ],
    commands: [
      { cmd: "CREATE DATABASE NF_Demo",   desc: "Normalisation demo" },
      { cmd: "USE NF_Demo",               desc: "Select it" },
      { cmd: "CREATE TABLE Orders",       desc: "1NF" },
      { cmd: "CREATE TABLE Customers",    desc: "2NF decomposition" },
      { cmd: "CREATE TABLE Addresses",    desc: "3NF decomposition" },
    ],
    terminalHint: "CREATE DATABASE NF_Demo  →  USE NF_Demo  →  CREATE TABLE Orders  →  Customers  →  Addresses",
  },

  "bcnf": {
    simulator: SIMULATOR.SCHEMA, color: "#a855f7",
    goals: [
      { id: 1, text: "CREATE TABLE Rooms  (violates BCNF)",            xp: 25, check: s => s.dbSchema.children.some(db => db.tables?.some(t => t.name?.toLowerCase() === "rooms")) },
      { id: 2, text: "Decompose: CREATE TABLE CourseRoom",             xp: 35, check: s => s.dbSchema.children.some(db => db.tables?.some(t => t.name?.toLowerCase() === "courseroom")) },
      { id: 3, text: "Decompose: CREATE TABLE InstructorRoom",         xp: 35, check: s => s.dbSchema.children.some(db => db.tables?.some(t => t.name?.toLowerCase() === "instructorroom")) },
    ],
    commands: [
      { cmd: "CREATE DATABASE BCNF_Demo",     desc: "Example container" },
      { cmd: "USE BCNF_Demo",                  desc: "Select it" },
      { cmd: "CREATE TABLE Rooms",             desc: "Original (BCNF violation)" },
      { cmd: "CREATE TABLE CourseRoom",        desc: "Decomposed table 1" },
      { cmd: "CREATE TABLE InstructorRoom",    desc: "Decomposed table 2" },
    ],
    terminalHint: "CREATE DATABASE BCNF_Demo  →  USE BCNF_Demo  →  CREATE TABLE Rooms  →  CourseRoom  →  InstructorRoom",
  },

  // ── DBMS: Transactions ─────────────────────────────────────────────────────
  "transactions": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "BEGIN: INSERT 3 keys as one transaction",        xp: 30, check: s => s.insertCount >= 3 },
      { id: 2, text: "COMMIT: SELECT all 3 keys (verify persistence)", xp: 40, check: s => s.searchCount >= 3 },
      { id: 3, text: "Batch transaction: INSERT 5 more keys",          xp: 50, check: s => s.insertCount >= 8 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "Transaction write  (e.g. INSERT 10)" },
      { cmd: "SELECT [key]", desc: "Verify committed record exists" },
    ],
    terminalHint: "INSERT 10  →  INSERT 20  →  INSERT 30  (commit)  →  SELECT 10  →  SELECT 20  →  SELECT 30",
  },

  "acid-properties": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "Atomicity: INSERT 4 keys as one batch",          xp: 30, check: s => s.insertCount >= 4 },
      { id: 2, text: "Consistency: tree stays balanced after inserts", xp: 30, check: s => s.insertCount >= 4 },
      { id: 3, text: "Isolation: SELECT while more inserts pending",   xp: 30, check: s => s.searchCount >= 1 && s.insertCount >= 4 },
      { id: 4, text: "Durability: INSERT 4 more (total 8+)",           xp: 50, check: s => s.insertCount >= 8 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "Atomic write  (e.g. INSERT 5)" },
      { cmd: "SELECT [key]", desc: "Isolated read — does not block" },
    ],
    terminalHint: "INSERT 5  →  10  →  15  →  20  →  SELECT 10  →  INSERT 25  →  30  →  35  →  40",
  },

  "concurrency-problems": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "INSERT 6 keys rapidly — concurrent writes",      xp: 40, check: s => s.insertCount >= 6 },
      { id: 2, text: "SELECT the same key 3× — simulate dirty reads",  xp: 30, check: s => s.searchCount >= 3 },
      { id: 3, text: "Trigger a split — write conflict resolved",      xp: 50, check: s => !!s.bTreeData?.children },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "Concurrent write (no isolation here)" },
      { cmd: "SELECT [key]", desc: "Concurrent read — may see stale data" },
    ],
    terminalHint: "INSERT 10  →  20  →  30  →  40  →  50  →  60  →  SELECT 30  →  SELECT 30  →  SELECT 30",
  },

  "locks-and-2pl": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "Growing phase: INSERT 5 keys  (acquire locks)",  xp: 40, check: s => s.insertCount >= 5 },
      { id: 2, text: "Lock point: SELECT all 5 keys",                  xp: 30, check: s => s.searchCount >= 5 },
      { id: 3, text: "Shrinking phase: INSERT 3 more  (all reads done)",xp: 50, check: s => s.insertCount >= 8 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "Grow phase: acquire write lock" },
      { cmd: "SELECT [key]", desc: "Read lock (still in growing phase)" },
    ],
    terminalHint: "INSERT 10  →  20  →  30  →  40  →  50  →  SELECT all 5  →  INSERT 60  →  70  →  80",
  },

  "deadlocks": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "T1 locks rows: INSERT 10 and INSERT 20",         xp: 30, check: s => s.insertCount >= 2 },
      { id: 2, text: "T2 blocks: INSERT 30 then SELECT 10",            xp: 30, check: s => s.insertCount >= 3 && s.searchCount >= 1 },
      { id: 3, text: "Deadlock resolved: INSERT remaining 3 keys",     xp: 40, check: s => s.insertCount >= 6 },
      { id: 4, text: "All transactions committed: SELECT all keys",    xp: 50, check: s => s.searchCount >= 4 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "T1 / T2 write-locks a record" },
      { cmd: "SELECT [key]", desc: "Transaction requests read lock" },
    ],
    terminalHint: "INSERT 10  →  INSERT 20  →  INSERT 30  →  SELECT 10  →  (deadlock!)  →  INSERT 40  →  50  →  60  →  SELECT all",
  },

  // ── DBMS: Indexing ─────────────────────────────────────────────────────────
  "binary-search-tree": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "INSERT 50  (root)",                              xp: 15, check: s => s.insertCount >= 1 },
      { id: 2, text: "INSERT 30 (left) and INSERT 70 (right)",         xp: 25, check: s => s.insertCount >= 3 },
      { id: 3, text: "Build 7-node BST  (7 total inserts)",           xp: 30, check: s => s.insertCount >= 7 },
      { id: 4, text: "SELECT 3 keys — watch the traversal path",       xp: 50, check: s => s.searchCount >= 3 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "Place in BST  (e.g. INSERT 50)" },
      { cmd: "SELECT [key]", desc: "Traversal highlights path" },
    ],
    terminalHint: "INSERT 50  →  30  →  70  →  20  →  40  →  60  →  80  →  SELECT 30  →  SELECT 70  →  SELECT 40",
  },

  "b-tree": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "INSERT enough to trigger a root split",          xp: 50, check: s => !!s.bTreeData?.children },
      { id: 2, text: "SELECT a key — multi-level traversal",           xp: 30, check: s => s.searchCount >= 1 && !!s.bTreeData?.children },
      { id: 3, text: "Trigger a 2nd split  (more keys)",              xp: 60, check: s => s.splitCount >= 2 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "Insert into B-Tree  (e.g. INSERT 10)" },
      { cmd: "SELECT [key]", desc: "Animated traversal path" },
    ],
    terminalHint: "INSERT 10  →  20  →  30  (split!)  →  40  →  50  →  SELECT 20  →  INSERT 60  →  70",
  },

  "b+-tree": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "Build B+ tree with 8 keys",                     xp: 40, check: s => s.insertCount >= 8 },
      { id: 2, text: "SELECT 3 sequential keys — leaf-level linked scan",xp: 40, check: s => s.searchCount >= 3 },
      { id: 3, text: "Trigger 3 splits — tree grows multiple levels",  xp: 60, check: s => s.splitCount >= 3 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "All data lives at leaf level" },
      { cmd: "SELECT [key]", desc: "Range scan from leaf chain" },
    ],
    terminalHint: "INSERT 5  →  10  →  15  →  20  →  25  →  30  →  35  →  40  →  SELECT 10  →  SELECT 20  →  SELECT 30",
  },

  "node-splitting": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "1st split — 3 keys in one node overflows",       xp: 30, check: s => s.splitCount >= 1 },
      { id: 2, text: "2nd split — median propagates upward",           xp: 40, check: s => s.splitCount >= 2 },
      { id: 3, text: "3rd split — root splits, tree grows a level",    xp: 60, check: s => s.splitCount >= 3 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "May trigger overflow and split" },
      { cmd: "SELECT [key]", desc: "Verify structural integrity after split" },
    ],
    terminalHint: "INSERT 10  →  20  →  30  (1st!)  →  40  →  50  (2nd!)  →  60  →  70  (3rd!)",
  },

  "traversal-paths": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "Build tree with 10+ keys",                       xp: 30, check: s => s.insertCount >= 10 },
      { id: 2, text: "SELECT a leaf-level key — full traversal",       xp: 30, check: s => s.searchCount >= 1 },
      { id: 3, text: "SELECT 5 different keys — master every path",    xp: 60, check: s => s.searchCount >= 5 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "Build the tree first" },
      { cmd: "SELECT [key]", desc: "Watch highlighted traversal" },
    ],
    terminalHint: "INSERT 10  →  20  →  30  →  40  →  50  →  60  →  70  →  80  →  90  →  100  →  SELECT 10  →  40  →  70  →  90  →  50",
  },

  // ── DBMS: Query Processing ─────────────────────────────────────────────────
  "select-statement": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "INSERT 6 rows into the indexed table",           xp: 25, check: s => s.insertCount >= 6 },
      { id: 2, text: "SELECT the smallest key  (leftmost leaf)",       xp: 25, check: s => s.searchCount >= 1 },
      { id: 3, text: "SELECT the largest key  (rightmost leaf)",       xp: 25, check: s => s.searchCount >= 2 },
      { id: 4, text: "SELECT 4 different keys  (index scan)",          xp: 50, check: s => s.searchCount >= 4 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "Add rows to the indexed table" },
      { cmd: "SELECT [key]", desc: "Full SELECT — shows index traversal cost" },
    ],
    terminalHint: "INSERT 5  →  15  →  25  →  35  →  45  →  55  →  SELECT 5  →  SELECT 55  →  SELECT 25  →  SELECT 45",
  },

  "where-filtering": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "INSERT 8 keys  (populate the table)",            xp: 25, check: s => s.insertCount >= 8 },
      { id: 2, text: "SELECT a key that EXISTS  (WHERE satisfied)",    xp: 25, check: s => s.searchCount >= 1 },
      { id: 3, text: "SELECT a key NOT in tree  (full scan, not found)",xp: 30, check: s => s.searchCount >= 2 },
      { id: 4, text: "SELECT 5 different keys  (range filter practice)",xp: 40, check: s => s.searchCount >= 5 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "Populate table rows" },
      { cmd: "SELECT [key]", desc: "WHERE key = [value] — index lookup" },
    ],
    terminalHint: "INSERT 10  →  20  →  30  →  40  →  50  →  60  →  70  →  80  →  SELECT 30  →  SELECT 99 (not found)  →  SELECT 50",
  },

  "joins-inner-outer": {
    simulator: SIMULATOR.SCHEMA, color: "#a855f7",
    goals: [
      { id: 1, text: "CREATE TABLE Employees  (left table)",           xp: 20, check: s => s.dbSchema.children.some(db => db.tables?.some(t => t.name?.toLowerCase() === "employees")) },
      { id: 2, text: "CREATE TABLE Departments  (INNER JOIN target)",  xp: 20, check: s => s.dbSchema.children.some(db => db.tables?.some(t => t.name?.toLowerCase() === "departments")) },
      { id: 3, text: "CREATE TABLE Projects  (LEFT OUTER JOIN)",       xp: 20, check: s => s.dbSchema.children.some(db => db.tables?.some(t => t.name?.toLowerCase() === "projects")) },
      { id: 4, text: "All 3 join tables in one database",              xp: 60, check: s => s.dbSchema.children.some(db => {
        const n = db.tables?.map(t => t.name?.toLowerCase()) || [];
        return n.includes("employees") && n.includes("departments") && n.includes("projects");
      })},
    ],
    commands: [
      { cmd: "CREATE DATABASE JoinDemo",  desc: "Container" },
      { cmd: "USE JoinDemo",              desc: "Select it" },
      { cmd: "CREATE TABLE Employees",    desc: "Left table" },
      { cmd: "CREATE TABLE Departments",  desc: "Right table (INNER JOIN)" },
      { cmd: "CREATE TABLE Projects",     desc: "Outer JOIN table" },
    ],
    terminalHint: "CREATE DATABASE JoinDemo  →  USE JoinDemo  →  CREATE TABLE Employees  →  Departments  →  Projects",
  },

  "index-usage-in-queries": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "Build B-Tree index with 10 keys",               xp: 30, check: s => s.insertCount >= 10 },
      { id: 2, text: "Index seek × 3  (O(log n) lookups)",            xp: 30, check: s => s.searchCount >= 3 },
      { id: 3, text: "SELECT keys at every tree level  (6 searches)", xp: 40, check: s => s.searchCount >= 6 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "Build index structure" },
      { cmd: "SELECT [key]", desc: "Index seek — watch the traversal depth" },
    ],
    terminalHint: "INSERT 10  →  20  →  30  →  40  →  50  →  60  →  70  →  80  →  90  →  100  →  SELECT 10  →  50  →  100",
  },

  "query-optimization-basics": {
    simulator: SIMULATOR.BTREE, color: "#a855f7",
    goals: [
      { id: 1, text: "Build a large index  (12+ keys)",               xp: 30, check: s => s.insertCount >= 12 },
      { id: 2, text: "Best-case lookup: SELECT key closest to root",  xp: 30, check: s => s.searchCount >= 1 },
      { id: 3, text: "Worst-case lookup: SELECT a leaf-level key",    xp: 30, check: s => s.searchCount >= 3 },
      { id: 4, text: "Do 6 SELECTs — compare traversal depths",      xp: 60, check: s => s.searchCount >= 6 },
    ],
    commands: [
      { cmd: "INSERT [key]", desc: "Build the index for the query planner" },
      { cmd: "SELECT [key]", desc: "Execute — note depth = query cost" },
    ],
    terminalHint: "INSERT 10 through 120  →  SELECT 60 (root, cheapest)  →  SELECT 10 (leaf, expensive)  →  compare depths",
  },
};

export function getTopicConfig(slug) {
  return TOPIC_CONFIG[slug] || {
    simulator: SIMULATOR.MEMORY,
    color: "#ff8400",
    goals: [
      { id: 1, text: "Allocate your first memory block",  xp: 30, check: s => s.memory.blocks.length >= 1 },
      { id: 2, text: "Allocate 3 blocks total",           xp: 40, check: s => s.memory.blocks.length >= 3 },
      { id: 3, text: "Free one block",                    xp: 30, check: s => s.freed >= 1 },
    ],
    commands: [
      { cmd: "ALLOC [size] [name]", desc: "Allocate memory" },
      { cmd: "FREE [name]",         desc: "Free memory" },
    ],
    terminalHint: "ALLOC 256 MyBlock  →  FREE MyBlock",
  };
}
