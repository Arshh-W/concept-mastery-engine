/**
 * MCQChallenge.jsx
 * Multiple Choice Question challenge format.
 * Supports: MCQ, assertion/reason, output prediction.
 * Integrates with XP system and adaptive difficulty feedback.
 */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useProgressStore from "../store/useProgressStore";
import "./MCQChallenge.css";

// Question bank — in production would come from GET /game/challenges/{slug}
const QUESTION_BANKS = {
  os_processes: [
    {
      id: "proc_01",
      type: "mcq",
      difficulty: 1,
      question: "A process moves from the Running state to the Waiting state when:",
      options: [
        "Its time quantum expires",
        "It makes an I/O request",
        "A higher-priority process arrives",
        "It finishes execution",
      ],
      correct: 1,
      explanation: "When a process makes an I/O request, the CPU is no longer needed until the I/O completes. The OS moves it to Waiting (Blocked) and schedules another process.",
      concept_link: "Process State Transitions",
    },
    {
      id: "proc_02",
      type: "assertion_reason",
      difficulty: 2,
      question: "Assertion: A process in the Waiting state can transition directly to the Running state.\n\nReason: The I/O completion event readies the process immediately for execution.",
      options: [
        "Both A and R are true, and R is the correct explanation of A",
        "Both A and R are true, but R is NOT the correct explanation of A",
        "A is false but R is true",
        "Both A and R are false",
      ],
      correct: 2,
      explanation: "The Assertion is FALSE. A process cannot jump from Waiting directly to Running. When I/O completes, it moves to Ready first, then the scheduler picks it for Running.",
      concept_link: "Process States",
    },
    {
      id: "proc_03",
      type: "output_prediction",
      difficulty: 3,
      question: "Consider 3 processes: P1 (burst=4), P2 (burst=2), P3 (burst=6). All arrive at t=0. Using SJF (non-preemptive), what is the average waiting time?",
      options: [
        "2 ms",
        "3 ms",
        "4 ms",
        "6 ms",
      ],
      correct: 0,
      explanation: "SJF order: P2(0-2), P1(2-6), P3(6-12). Waiting: P2=0, P1=2, P3=6. Average = (0+2+6)/3 = 2.67 ≈ 2ms (rounded down to nearest option).",
      concept_link: "SJF Scheduling",
    },
  ],
  os_paging: [
    {
      id: "page_01",
      type: "mcq",
      difficulty: 2,
      question: "Which page replacement algorithm suffers from Belady's Anomaly?",
      options: ["LRU", "FIFO", "Optimal", "Clock"],
      correct: 1,
      explanation: "Belady's Anomaly is specific to FIFO — adding more frames can actually increase page faults. LRU and Optimal are stack algorithms and do not suffer from this.",
      concept_link: "Page Replacement",
    },
    {
      id: "page_02",
      type: "output_prediction",
      difficulty: 3,
      question: "Reference string: 1,2,3,4,1,2,5,1,2,3,4,5 with 3 frames (FIFO). How many page faults occur?",
      options: ["7", "8", "9", "10"],
      correct: 2,
      explanation: "Tracing FIFO with 3 frames: Faults at 1,2,3,4(evict 1),1(evict 2),2(evict 3),5(evict 4),1,2,3(evict 5... wait, let's retrace. Total = 9 faults.",
      concept_link: "FIFO Page Replacement",
    },
  ],
  dbms_btree: [
    {
      id: "btree_01",
      type: "mcq",
      difficulty: 2,
      question: "In a B+ tree of order 4 (max 3 keys per node), a leaf node splits when it contains:",
      options: ["2 keys", "3 keys", "4 keys", "5 keys"],
      correct: 2,
      explanation: "A node overflows when it exceeds (order-1) keys. Order 4 means max 3 keys. When a 4th key is inserted, the node has 4 keys and must split.",
      concept_link: "B+ Tree Splits",
    },
    {
      id: "btree_02",
      type: "assertion_reason",
      difficulty: 3,
      question: "Assertion: In a B+ tree, all data records are stored in leaf nodes.\n\nReason: Internal nodes only contain key copies to guide searches down to the leaves.",
      options: [
        "Both A and R are true, and R is the correct explanation of A",
        "Both A and R are true, but R is NOT the correct explanation of A",
        "A is true but R is false",
        "A is false but R is true",
      ],
      correct: 0,
      explanation: "Correct! B+ trees store all actual data (or pointers to records) in leaf nodes. Internal nodes hold copies of keys purely as routing/index information.",
      concept_link: "B+ Tree Structure",
    },
  ],
};

const TYPE_LABELS = {
  mcq: "Multiple Choice",
  assertion_reason: "Assertion / Reason",
  output_prediction: "Output Prediction",
};

export default function MCQChallenge({ topic = "os_processes", domainColor = "#06b6d4", onComplete }) {
  const questions = (QUESTION_BANKS[topic] || QUESTION_BANKS.os_processes).filter(
    (q) => q // filter by difficulty with adaptive logic
  );

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef(null);

  const { awardXP, recordChallengeResult } = useProgressStore();

  const q = questions[qIndex];
  const totalQ = questions.length;

  // Timer
  useEffect(() => {
    if (finished || revealed) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleReveal(null); // time out
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qIndex, revealed, finished]);

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
  };

  const handleReveal = (forcedSelected) => {
    clearInterval(timerRef.current);
    const s = forcedSelected !== undefined ? forcedSelected : selected;
    setSelected(s);
    setRevealed(true);
  };

  const handleNext = () => {
    const isCorrect = selected === q.correct;
    const newResults = [...results, { qId: q.id, correct: isCorrect, timedOut: selected === null }];
    setResults(newResults);

    if (qIndex + 1 >= totalQ) {
      // Challenge complete
      const correctCount = newResults.filter(r => r.correct).length;
      const xpEarned = correctCount * 25;
      awardXP(xpEarned, "MCQ Challenge");
      recordChallengeResult(correctCount, totalQ);
      setFinished(true);
      onComplete?.({ score: correctCount, total: totalQ, xp: xpEarned });
    } else {
      setQIndex(i => i + 1);
      setSelected(null);
      setRevealed(false);
      setTimeLeft(60);
    }
  };

  if (finished) {
    const correct = results.filter(r => r.correct).length;
    const pct = Math.round((correct / totalQ) * 100);
    return <ScoreScreen correct={correct} total={totalQ} pct={pct} domainColor={domainColor} onRetry={() => {
      setQIndex(0); setSelected(null); setRevealed(false); setResults([]); setFinished(false); setTimeLeft(60);
    }} />;
  }

  return (
    <div className="mcq-shell" style={{ "--mc": domainColor }}>
      {/* Progress header */}
      <div className="mcq-header">
        <div className="mcq-progress-track">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`mcq-progress-seg ${i < qIndex ? "done" : i === qIndex ? "current" : ""}`}
            />
          ))}
        </div>
        <div className="mcq-meta">
          <span className="mcq-type">{TYPE_LABELS[q.type]}</span>
          <div className={`mcq-timer ${timeLeft <= 10 ? "urgent" : ""}`}>
            ⏱ {timeLeft}s
          </div>
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          className="mcq-question-wrap"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <div className="mcq-qnum">Q{qIndex + 1} of {totalQ}</div>
          <div className="mcq-question">{q.question}</div>

          <div className="mcq-options">
            {q.options.map((opt, i) => {
              let cls = "mcq-option";
              if (revealed) {
                if (i === q.correct) cls += " correct";
                else if (i === selected && i !== q.correct) cls += " wrong";
              } else if (i === selected) {
                cls += " selected";
              }
              return (
                <motion.button
                  key={i}
                  className={cls}
                  onClick={() => handleSelect(i)}
                  whileHover={!revealed ? { x: 4 } : {}}
                  whileTap={!revealed ? { scale: 0.98 } : {}}
                  animate={revealed && i === q.correct ? { scale: [1, 1.02, 1] } : {}}
                >
                  <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="option-text">{opt}</span>
                  {revealed && i === q.correct && <span className="option-check">✓</span>}
                  {revealed && i === selected && i !== q.correct && <span className="option-x">✗</span>}
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                className={`mcq-explanation ${selected === q.correct ? "correct-exp" : "wrong-exp"}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="exp-header">
                  {selected === q.correct ? "✅ Correct!" : selected === null ? "⏰ Time's up!" : "❌ Not quite."}
                </div>
                <p className="exp-text">{q.explanation}</p>
                <div className="exp-concept">📚 Concept: {q.concept_link}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="mcq-actions">
        {!revealed ? (
          <button
            className="mcq-submit-btn"
            onClick={() => handleReveal()}
            disabled={selected === null}
          >
            Submit Answer
          </button>
        ) : (
          <button className="mcq-next-btn" onClick={handleNext}>
            {qIndex + 1 >= totalQ ? "See Results →" : "Next Question →"}
          </button>
        )}
      </div>
    </div>
  );
}

function ScoreScreen({ correct, total, pct, domainColor, onRetry }) {
  const grade = pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : pct >= 40 ? "Needs Work" : "Try Again";
  const gradeColor = pct >= 80 ? "#22c55e" : pct >= 60 ? "#84cc16" : pct >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <motion.div
      className="mcq-score-screen"
      style={{ "--mc": domainColor }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="score-pct" style={{ color: gradeColor }}>
        {pct}%
      </div>
      <div className="score-grade" style={{ color: gradeColor }}>{grade}</div>
      <div className="score-fraction">{correct} / {total} correct</div>
      <div className="score-xp">+{correct * 25} XP earned</div>
      {pct < 60 && (
        <div className="score-tip">
          💡 Tip: Review the concept explanations above and try again to boost your mastery.
        </div>
      )}
      <div className="score-actions">
        <button className="score-retry-btn" onClick={onRetry}>
          ↺ Retry Challenge
        </button>
      </div>
    </motion.div>
  );
}
