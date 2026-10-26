import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  ChevronRight,
  Send,
  Clock,
  BookOpen,
  Shield,
  Code2,
  Terminal,
  Trophy,
} from 'lucide-react';
import { api } from '../services/api';
import { InterviewSession, InterviewRound, InterviewQuestion } from '../types';
import { InterviewTimer } from '../components/InterviewTimer';
import { useAuth } from '../context/AuthContext';

export const MockInterviewPage: React.FC = () => {
  const { user } = useAuth();

  // Setup state
  const [targetRole, setTargetRole] = useState('Full Stack Software Engineer');
  const [targetCompany, setTargetCompany] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [creating, setCreating] = useState(false);
  const [selectedLang, setSelectedLang] = useState('javascript');

  // Active session
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [activeRoundNum, setActiveRoundNum] = useState<number>(1);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);

  // Candidate answers for current round
  // Map of questionId -> { answerText, selectedOption }
  const [answersMap, setAnswersMap] = useState<Record<string, { answerText?: string; selectedOption?: string }>>({});
  const [submittingRound, setSubmittingRound] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tab Switch Proctoring state (Permit only 3 tab switches)
  const [tabSwitches, setTabSwitches] = useState<number>(0);
  const [showTabWarning, setShowTabWarning] = useState<boolean>(false);
  const [tabTerminated, setTabTerminated] = useState<boolean>(false);

  // Load existing user interviews on mount
  useEffect(() => {
    if (user) {
      loadMyInterviews();
    }
  }, [user]);

  const loadMyInterviews = async () => {
    try {
      const res = await api.getUserInterviews();
      if (res.success && res.sessions.length > 0) {
        // Load latest session details
        const latestId = res.sessions[0].id;
        const detailRes = await api.getInterviewSession(latestId);
        if (detailRes.success && detailRes.session) {
          setSession(detailRes.session);
          setActiveRoundNum(detailRes.session.currentRound || 1);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please log in or click "Demo Candidate" in the top bar to start interviews.');
      return;
    }
    setCreating(true);
    setErrorMsg('');
    setTabSwitches(0);
    setShowTabWarning(false);
    setTabTerminated(false);

    try {
      const res = await api.startInterview({
        targetRole,
        targetCompany: targetCompany || undefined,
        difficulty,
        mode: 'TEXT',
      });
      if (res.success && res.session) {
        setSession(res.session);
        setActiveRoundNum(1);
        setActiveQuestionIdx(0);
        setAnswersMap({});
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error configuring mock session.');
    } finally {
      setCreating(false);
    }
  };

  const activeRound = session?.rounds.find((r) => r.roundNumber === activeRoundNum);
  const activeQuestion = activeRound?.questions[activeQuestionIdx];

  // Proctoring: Detect Tab Switch (Permit max 3 switches during active assessment)
  useEffect(() => {
    const isRoundLive = activeRound && activeRound.status !== 'COMPLETED' && activeRound.status !== 'FAILED';
    if (!isRoundLive || tabTerminated) return;

    let lastSwitch = 0;

    const recordTabSwitch = () => {
      const now = Date.now();
      if (now - lastSwitch < 1200) return; // Debounce rapid focus-blur events
      lastSwitch = now;

      setTabSwitches((prev) => {
        const next = prev + 1;
        if (next > 3) {
          // Exceeded limit of 3 tab switches -> Terminate round
          setTabTerminated(true);
          setShowTabWarning(false);
          handleProctoringFailure();
          return next;
        } else {
          setShowTabWarning(true);
          return next;
        }
      });
    };

    const handleVisibility = () => {
      if (document.hidden) {
        recordTabSwitch();
      }
    };

    const handleWindowBlur = () => {
      recordTabSwitch();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [activeRound?.id, activeRound?.status, tabTerminated]);

  const handleProctoringFailure = async () => {
    if (!session || !activeRound) return;
    try {
      const submissions = activeRound.questions.map((q) => ({
        questionId: q.id,
        answerText: 'TEST TERMINATED DUE TO PROCTORING VIOLATION: Exceeded 3 permitted tab switches.',
        selectedOption: '',
        timeTakenSeconds: 0,
      }));

      const res = await api.submitRound(session.id, {
        roundNumber: activeRound.roundNumber,
        submissions,
      });

      if (res.success && res.session) {
        setSession(res.session);
      }
    } catch (err) {
      console.error('Proctoring violation submission error:', err);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswersMap((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectedOption: option },
    }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswersMap((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], answerText: text },
    }));
  };

  const handleSubmitActiveRound = async () => {
    if (!session || !activeRound) return;

    // Check if at least some answers provided
    setSubmittingRound(true);
    setErrorMsg('');

    try {
      const submissions = activeRound.questions.map((q) => {
        const recorded = answersMap[q.id] || {};
        return {
          questionId: q.id,
          answerText: recorded.answerText || q.userAnswer?.answerText || '',
          selectedOption: recorded.selectedOption || q.userAnswer?.selectedOption || '',
          timeTakenSeconds: 60,
        };
      });

      const res = await api.submitRound(session.id, {
        roundNumber: activeRound.roundNumber,
        submissions,
      });

      if (res.success && res.session) {
        setSession(res.session);
        // If passed, jump to next round; if failed, stay on round to view feedback/retry
        if (activeRound.roundNumber < (res.session.rounds?.length || 5) && res.session.currentRound > activeRound.roundNumber) {
          setActiveRoundNum(res.session.currentRound);
          setActiveQuestionIdx(0);
          setTabSwitches(0);
          setShowTabWarning(false);
          setTabTerminated(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting round answers.');
    } finally {
      setSubmittingRound(false);
    }
  };

  const handleRetryRound = async (roundNumber: number) => {
    if (!session) return;
    setRetrying(true);
    setTabSwitches(0);
    setShowTabWarning(false);
    setTabTerminated(false);
    try {
      const res = await api.retryRound(session.id, roundNumber);
      if (res.success && res.session) {
        setSession(res.session);
        setActiveRoundNum(roundNumber);
        setActiveQuestionIdx(0);
        setAnswersMap({});
      }
    } catch (err: any) {
      alert(`Could not reset round: ${err.message}`);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-2 border border-brand-200">
          <BrainCircuit className="w-3.5 h-3.5 text-brand-600" />
          <span>Multi-Round Recruitment Assessment</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          AI Mock Interview & Placement Simulator
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Simulate a complete 4-round technical campus/lateral recruitment drive. Questions adapt to your target role and resume skills.
        </p>
      </div>

      {/* If No Active Session: Show Setup Card */}
      {!session ? (
        <div className="card-premium p-6 lg:p-10 max-w-2xl mx-auto bg-white border-slate-200 shadow-card">
          <div className="text-center space-y-2 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-100 shadow-xs">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Configure Your Interview Session</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Choose your target role and difficulty. You will progress through all 4 rounds sequentially.
            </p>
          </div>

          <form onSubmit={handleStartSession} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="select-field"
              >
                <option value="Frontend / React Developer">Frontend / React Developer</option>
                <option value="Backend / Node / Python Developer">Backend / Node / Python Developer</option>
                <option value="Full Stack Software Engineer">Full Stack Software Engineer</option>
                <option value="Data Analytics / BI Specialist">Data Analytics / BI Specialist</option>
                <option value="Java Spring Boot Developer">Java Spring Boot Developer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Employer (Optional)
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Swiggy, Razorpay, TCS, Infosys, Zomato..."
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      difficulty === diff
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={creating}
                className="btn-primary w-full py-3 text-sm shadow-md flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>{creating ? 'Generating Personalized Interview Plan...' : 'Begin Round 1: Introduction'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Active Interview Experience */
        <div className="space-y-8">
          {/* Top Session Status Bar */}
          <div className="card-premium p-5 bg-white border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-800">{session.targetRole}</span>
                {session.targetCompany && <span>• At {session.targetCompany}</span>}
                <span>• Difficulty: {session.difficulty}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {activeRound?.roundName || 'Mock Interview Session'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Anti-Cheating Tab Switch Proctoring Badge */}
              <div
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  tabSwitches === 0
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : tabSwitches <= 2
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : tabSwitches === 3
                    ? 'bg-orange-50 border-orange-400 text-orange-900 font-bold'
                    : 'bg-rose-100 border-rose-300 text-rose-800 font-bold'
                }`}
                title="Only 3 tab switches are permitted during live mock assessments. Exceeding 3 terminates the round."
              >
                <Shield className={`w-3.5 h-3.5 ${tabSwitches > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>
                  Tab Switches: <strong className={tabSwitches >= 3 ? 'text-rose-600' : ''}>{tabSwitches}/3 Permitted</strong>
                </span>
              </div>

              {activeRoundNum === 2 && activeRound?.status !== 'COMPLETED' && (
                <InterviewTimer
                  initialSeconds={15 * 60} // 15 mins for Aptitude round
                  onTimeUp={handleSubmitActiveRound}
                />
              )}

              {activeRoundNum === 4 && activeRound?.status !== 'COMPLETED' && (
                <InterviewTimer
                  initialSeconds={30 * 60} // 30 mins for DSA Coding Challenge (2 problems)
                  onTimeUp={handleSubmitActiveRound}
                />
              )}

              <button
                onClick={() => setSession(null)}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start New Session</span>
              </button>
            </div>
          </div>

          {/* 5 Rounds Progression Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {session.rounds.map((round) => {
              const isCurrent = round.roundNumber === activeRoundNum;
              const isLocked = round.status === 'LOCKED';
              const isCompleted = round.status === 'COMPLETED';
              const isFailed = round.status === 'FAILED';

              return (
                <div
                  key={round.id}
                  onClick={() => {
                    if (!isLocked) {
                      setActiveRoundNum(round.roundNumber);
                      setActiveQuestionIdx(0);
                    }
                  }}
                  className={`p-4 rounded-xl border transition-all select-none ${
                    isLocked
                      ? 'bg-slate-50/70 border-slate-200/80 opacity-60 cursor-not-allowed'
                      : isCurrent
                      ? 'bg-brand-50/40 border-brand-500 shadow-xs cursor-pointer'
                      : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Round {round.roundNumber}
                    </span>

                    {isCompleted && (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        {round.score}% Passed
                      </span>
                    )}

                    {isFailed && (
                      <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        {round.score}% (Needs 70%)
                      </span>
                    )}

                    {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{round.roundName}</h4>

                  <p className="text-[11px] text-slate-500 mt-1">
                    {isLocked ? 'Locked until prior round cleared' : `${round.questions.length} questions`}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Active Round Player Area */}
          {activeRound && (
            <div className="card-premium p-6 lg:p-8 bg-white border-slate-200 shadow-subtle space-y-6">
              {/* Question Navigation Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Question {activeQuestionIdx + 1} of {activeRound.questions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                    {activeQuestion?.questionType}
                  </span>
                </div>

                {/* Question index tabs */}
                <div className="flex items-center space-x-1.5">
                  {activeRound.questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setActiveQuestionIdx(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        activeQuestionIdx === idx
                          ? 'bg-brand-600 text-white shadow-xs'
                          : answersMap[q.id]?.answerText || answersMap[q.id]?.selectedOption || q.userAnswer
                          ? 'bg-brand-100 text-brand-800 border border-brand-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Question Display */}
              {activeQuestion && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <p className="text-base font-semibold text-slate-900 leading-relaxed">
                      {activeQuestion.questionText}
                    </p>
                  </div>

                  {/* Objective MCQ Type */}
                  {activeQuestion.questionType === 'MCQ' && activeQuestion.options && (
                    <div className="space-y-2.5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Select Best Option:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeQuestion.options.map((opt, oIdx) => {
                          const isSelected =
                            (answersMap[activeQuestion.id]?.selectedOption || activeQuestion.userAnswer?.selectedOption) === opt;
                          const isCompleted = activeRound.status === 'COMPLETED' || activeRound.status === 'FAILED';
                          const isCorrect = isCompleted && activeQuestion.correctAnswer === opt;
                          const isWrong = isCompleted && isSelected && !isCorrect;

                          return (
                            <button
                              key={oIdx}
                              disabled={isCompleted}
                              type="button"
                              onClick={() => handleSelectOption(activeQuestion.id, opt)}
                              className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                                isCorrect
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-500/20'
                                  : isWrong
                                  ? 'bg-rose-50 text-rose-900 border-rose-500'
                                  : isSelected
                                  ? 'bg-brand-50 text-brand-900 border-brand-500 ring-2 ring-brand-500/20'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span>{opt}</span>
                              {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation revealed only after attempt */}
                      {activeQuestion.explanation && (
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1 mt-3">
                          <p className="font-bold flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            Solution & Explanation:
                          </p>
                          <p>{activeQuestion.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DSA Coding Challenge Type */}
                  {activeQuestion.questionType === 'CODING' && (
                    <div className="space-y-4">
                      {/* Code Editor Header Bar */}
                      <div className="bg-slate-900 text-slate-200 px-4 py-2.5 rounded-t-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                          <Terminal className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-mono font-bold text-slate-100">Algorithmic Code Editor</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold border border-emerald-500/30">
                            DSA Challenge
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <label className="text-[11px] text-slate-400 font-mono">Language:</label>
                          <select
                            value={selectedLang}
                            onChange={(e) => setSelectedLang(e.target.value)}
                            className="bg-slate-800 text-slate-100 text-xs rounded border border-slate-700 px-2.5 py-1 focus:outline-hidden font-mono"
                          >
                            <option value="javascript">JavaScript (Node.js)</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python 3</option>
                            <option value="java">Java 17</option>
                            <option value="cpp">C++ 20</option>
                          </select>
                        </div>
                      </div>

                      {/* Code Workspace Textarea */}
                      <div className="relative">
                        <textarea
                          rows={12}
                          disabled={activeRound.status === 'COMPLETED' || activeRound.status === 'FAILED'}
                          value={answersMap[activeQuestion.id]?.answerText ?? activeQuestion.userAnswer?.answerText ?? ''}
                          onChange={(e) => handleTextChange(activeQuestion.id, e.target.value)}
                          placeholder={`// Write your clean algorithm and solution here:
// 1. Implementation
// 2. State Time Complexity: O(...)
// 3. State Space Complexity: O(...)

function solution(...) {
  // your code here
}`}
                          className="w-full bg-slate-950 text-emerald-300 font-mono text-xs sm:text-sm p-4 rounded-b-xl border border-slate-800 focus:border-brand-500 focus:outline-hidden leading-relaxed resize-none shadow-inner"
                        />
                      </div>

                      {/* Solution and Explanation revealed after submission */}
                      {activeQuestion.explanation && (
                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-2">
                          <p className="font-bold text-indigo-950 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                            Optimal Reference Solution & Algorithm Complexity:
                          </p>
                          <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                            {activeQuestion.explanation}
                          </pre>
                        </div>
                      )}

                      {/* AI Grader Feedback if submitted */}
                      {activeQuestion.userAnswer?.aiFeedback && (
                        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-2 text-emerald-950">
                          <p className="font-bold flex items-center gap-1 text-emerald-800">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            AI Rubric Score: {activeQuestion.userAnswer.score}/100
                          </p>
                          <p className="leading-relaxed text-emerald-900">{activeQuestion.userAnswer.aiFeedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Standard Subjective Text Type */}
                  {activeQuestion.questionType === 'TEXT' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Your Articulated Response:
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {((answersMap[activeQuestion.id]?.answerText || activeQuestion.userAnswer?.answerText || '').trim().split(/\s+/).filter(Boolean).length)} words
                        </span>
                      </div>

                      <textarea
                        rows={6}
                        disabled={activeRound.status === 'COMPLETED' || activeRound.status === 'FAILED'}
                        value={answersMap[activeQuestion.id]?.answerText ?? activeQuestion.userAnswer?.answerText ?? ''}
                        onChange={(e) => handleTextChange(activeQuestion.id, e.target.value)}
                        placeholder="Structure your answer clearly: Context -> Approach / Action -> Result..."
                        className="input-field text-xs sm:text-sm font-sans leading-relaxed resize-none"
                      />

                      {/* AI Feedback if already submitted */}
                      {activeQuestion.userAnswer?.aiFeedback && (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1 text-emerald-900">
                          <p className="font-bold flex items-center gap-1 text-emerald-800">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            AI Rubric Score: {activeQuestion.userAnswer.score}/100
                          </p>
                          <p className="text-emerald-800 leading-relaxed">{activeQuestion.userAnswer.aiFeedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Nav & Submit Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <button
                    disabled={activeQuestionIdx === 0}
                    onClick={() => setActiveQuestionIdx((i) => Math.max(0, i - 1))}
                    className="btn-secondary text-xs px-3 py-2 disabled:opacity-40"
                  >
                    Previous Question
                  </button>
                  <button
                    disabled={activeQuestionIdx === activeRound.questions.length - 1}
                    onClick={() => setActiveQuestionIdx((i) => Math.min(activeRound.questions.length - 1, i + 1))}
                    className="btn-secondary text-xs px-3 py-2 disabled:opacity-40"
                  >
                    Next Question
                  </button>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  {/* If round is failed, allow retry */}
                  {activeRound.status === 'FAILED' && (
                    <button
                      onClick={() => handleRetryRound(activeRound.roundNumber)}
                      disabled={retrying}
                      className="btn-secondary text-xs px-4 py-2 border-rose-200 text-rose-700 hover:bg-rose-50 flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{retrying ? 'Resetting...' : 'Retry Round'}</span>
                    </button>
                  )}

                  {/* If round is not completed yet, show submit */}
                  {activeRound.status !== 'COMPLETED' && activeRound.status !== 'FAILED' && (
                    <button
                      onClick={handleSubmitActiveRound}
                      disabled={submittingRound}
                      className="btn-primary text-xs px-5 py-2 shadow-sm flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingRound ? 'Grading Responses...' : `Submit Round ${activeRound.roundNumber}`}</span>
                    </button>
                  )}

                  {/* If passed and next round exists, unlock jump */}
                  {activeRound.status === 'COMPLETED' && activeRound.roundNumber < (session.rounds?.length || 5) && (
                    <button
                      onClick={() => {
                        setActiveRoundNum(activeRound.roundNumber + 1);
                        setActiveQuestionIdx(0);
                      }}
                      className="btn-primary text-xs px-5 py-2 shadow-sm flex items-center space-x-1.5"
                    >
                      <span>Proceed to Round {activeRound.roundNumber + 1}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* All rounds completed celebration */}
                  {activeRound.status === 'COMPLETED' && activeRound.roundNumber >= (session.rounds?.length || 5) && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-xl font-bold text-xs border border-emerald-300">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>All 5 Rounds Cleared! Overall Score: {session.overallScore}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Round Score Banner */}
              {activeRound.feedback && (
                <div
                  className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    activeRound.status === 'COMPLETED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <p className="font-bold mb-0.5">
                    {activeRound.status === 'COMPLETED' ? 'Round Cleared!' : 'Threshold Not Met'}
                  </p>
                  <p>{activeRound.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Final Completed Summary Banner if all 4 cleared */}
          {session.status === 'COMPLETED' && (
            <div className="card-premium p-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white shadow-xl space-y-3">
              <div className="flex items-center space-x-2">
                <Award className="w-6 h-6 text-yellow-300" />
                <h3 className="text-xl font-extrabold tracking-tight">Full Mock Assessment Cleared!</h3>
              </div>
              <p className="text-sm opacity-95">
                You achieved an overall readiness rating of <span className="font-bold underline">{session.overallScore}%</span> across all 4 interview rounds. You are well-positioned for placement and interview processes.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab Switch Warning Modal */}
      {showTabWarning && !tabTerminated && tabSwitches <= 3 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-amber-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Tab Switch Warning ({tabSwitches} / 3)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  You navigated away or switched tabs. To maintain strict recruitment test integrity, you are permitted a <strong>maximum of 3 tab switches</strong>.
                </p>
                {tabSwitches === 3 ? (
                  <p className="text-xs font-bold text-rose-600 mt-2 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    ⚠️ FINAL WARNING: 1 more tab switch will automatically terminate and fail this assessment round!
                  </p>
                ) : (
                  <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    Remaining switches allowed: <strong>{3 - tabSwitches}</strong>. Please stay on this tab to complete your interview.
                  </p>
                )}
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTabWarning(false)}
                className="btn-primary text-xs px-4 py-2 w-full sm:w-auto shadow-sm"
              >
                I Understand &amp; Resume Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring Violation Terminated Modal */}
      {tabTerminated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-rose-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-rose-900">
                  Round Terminated: Proctoring Violation
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  You exceeded the allowed limit of <strong>3 tab switches</strong> ({tabSwitches} switches detected).
                </p>
                <div className="text-xs text-rose-700 mt-2 bg-rose-50 p-3 rounded-lg border border-rose-200 space-y-1">
                  <p className="font-semibold">Test Integrity Rule Enforced:</p>
                  <p>In accordance with recruitment portal guidelines, switching windows repeatedly during assessment rounds results in immediate disqualification of this attempt.</p>
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (activeRound) {
                    handleRetryRound(activeRound.roundNumber);
                  }
                }}
                className="btn-primary bg-rose-600 hover:bg-rose-700 text-xs px-4 py-2 w-full shadow-sm flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset &amp; Retry Round</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
