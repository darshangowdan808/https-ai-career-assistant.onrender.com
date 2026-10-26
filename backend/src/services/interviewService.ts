import prisma from '../config/db';
import aiService from './aiService';

class InterviewService {
  private defaultThreshold = parseFloat(process.env.PASSING_THRESHOLD || '70.0');

  /**
   * Initializes a new 4-round interview session
   */
  public async createSession(
    userId: string,
    targetRole: string,
    targetCompany?: string,
    jobDescription?: string,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM',
    mode: 'TEXT' | 'VOICE' = 'TEXT'
  ) {
    // 1. Fetch user's detected skills from latest resume
    const latestResume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { skills: true },
    });
    const skills = latestResume?.skills.map((s) => s.skillName) || ['Problem Solving', 'Data Structures'];

    // 2. Create InterviewSession
    const session = await prisma.interviewSession.create({
      data: {
        userId,
        targetRole,
        targetCompany,
        jobDescription,
        difficulty,
        mode,
        currentRound: 1,
        status: 'IN_PROGRESS',
        passStatus: 'PENDING',
      },
    });

    // 2.b Fetch previously asked questions for this user to prevent repeats
    const previousQuestions = await prisma.interviewQuestion.findMany({
      where: {
        round: {
          session: {
            userId,
          },
        },
      },
      select: { questionText: true },
    });
    const previouslyAsked = previousQuestions.map((q) => q.questionText);

    // 3. Define the 5 standard recruitment rounds (including DSA Coding Challenge)
    const roundDefs = [
      { num: 1, name: 'Round 1: Introduction & Professional Communication' },
      { num: 2, name: 'Round 2: Quantitative, Logical & Verbal Aptitude' },
      { num: 3, name: 'Round 3: Core Technical & Architecture Interview' },
      { num: 4, name: 'Round 4: Data Structures & Algorithms (DSA) Coding Challenge' },
      { num: 5, name: 'Round 5: HR & Behavioral Culture Alignment' },
    ];

    for (const def of roundDefs) {
      const isFirst = def.num === 1;
      const round = await prisma.interviewRound.create({
        data: {
          sessionId: session.id,
          roundNumber: def.num,
          roundName: def.name,
          status: isFirst ? 'NOT_STARTED' : 'LOCKED',
          passingScore: this.defaultThreshold,
        },
      });

      // Generate non-repeating questions for this round
      const questions = aiService.generateRoundQuestions(def.num, targetRole, skills, difficulty, previouslyAsked);
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        // Register question text immediately into previouslyAsked to guarantee it can never be selected in any other round
        previouslyAsked.push(q.questionText);
        await prisma.interviewQuestion.create({
          data: {
            roundId: round.id,
            questionIndex: i + 1,
            questionText: q.questionText,
            questionType: q.questionType,
            optionsJson: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: q.correctAnswer || null,
            explanation: q.explanation || null,
            rubricJson: q.rubric ? JSON.stringify({ criteria: q.rubric }) : null,
            difficulty: q.difficulty,
          },
        });
      }
    }

    return this.getSessionDetails(session.id, userId);
  }

  /**
   * Fetches session details with rounds and current active questions (safe: hides correct answers for unsubmitted rounds)
   */
  public async getSessionDetails(sessionId: string, userId: string) {
    const session = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            questions: {
              orderBy: { questionIndex: 'asc' },
              include: {
                answers: {
                  where: { userId },
                },
              },
            },
          },
        },
        results: true,
      },
    });

    if (!session) {
      throw new Error('Interview session not found or access denied.');
    }

    // Sanitize questions: strip correctAnswer and explanation for active/uncompleted objective rounds
    const safeRounds = session.rounds.map((round) => {
      const isCompleted = round.status === 'COMPLETED' || round.status === 'FAILED';
      const safeQuestions = round.questions.map((q) => {
        const userAns = q.answers.length > 0 ? q.answers[0] : null;
        return {
          id: q.id,
          questionIndex: q.questionIndex,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.optionsJson ? JSON.parse(q.optionsJson) : null,
          difficulty: q.difficulty,
          userAnswer: userAns ? {
            answerText: userAns.answerText,
            selectedOption: userAns.selectedOption,
            score: userAns.score,
            aiFeedback: userAns.aiFeedback,
            timeTakenSeconds: userAns.timeTakenSeconds,
          } : null,
          // Only expose correct answer and explanation once round is completed
          correctAnswer: isCompleted ? q.correctAnswer : null,
          explanation: isCompleted ? q.explanation : null,
        };
      });

      return {
        id: round.id,
        roundNumber: round.roundNumber,
        roundName: round.roundName,
        status: round.status,
        score: round.score,
        passingScore: round.passingScore,
        feedback: round.feedback,
        evaluation: round.evaluationJson ? JSON.parse(round.evaluationJson) : null,
        startedAt: round.startedAt,
        completedAt: round.completedAt,
        questions: safeQuestions,
      };
    });

    return {
      ...session,
      rounds: safeRounds,
    };
  }

  /**
   * Submits candidate answers for a round, grades them, and triggers state transition
   */
  public async submitRoundAnswers(
    sessionId: string,
    roundNumber: number,
    userId: string,
    submissions: Array<{ questionId: string; answerText?: string; selectedOption?: string; timeTakenSeconds?: number }>
  ) {
    const session = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        rounds: {
          where: { roundNumber },
          include: { questions: true },
        },
      },
    });

    if (!session) {
      throw new Error('Interview session not found.');
    }

    const currentRound = session.rounds[0];
    if (!currentRound) {
      throw new Error(`Round ${roundNumber} does not exist in this interview.`);
    }

    // State machine check: cannot submit a locked round
    if (currentRound.status === 'LOCKED') {
      throw new Error(`Round ${roundNumber} is currently LOCKED. Complete the prior round with a passing score first.`);
    }

    let totalScore = 0;
    const roundEvaluations: any[] = [];

    // Grade each submitted question
    for (const sub of submissions) {
      const question = currentRound.questions.find((q) => q.id === sub.questionId);
      if (!question) continue;

      let score = 0;
      let feedback = '';

      if (question.questionType === 'MCQ') {
        // Objective automatic grading
        if (sub.selectedOption && question.correctAnswer) {
          const isCorrect = sub.selectedOption.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
          score = isCorrect ? 100 : 0;
          feedback = isCorrect
            ? 'Correct answer! Solid grasp of fundamental logic.'
            : `Incorrect. The accurate answer was: "${question.correctAnswer}". ${question.explanation || ''}`;
        }
      } else {
        // Subjective AI evaluation
        const evalResult = aiService.evaluateAnswer(question.questionText, sub.answerText || '', roundNumber);
        score = evalResult.score;
        feedback = evalResult.feedback;
      }

      totalScore += score;
      roundEvaluations.push({
        questionId: question.id,
        score,
        feedback,
      });

      // Upsert answer in database
      const existingAnswer = await prisma.interviewAnswer.findFirst({
        where: { questionId: question.id, userId },
      });

      if (existingAnswer) {
        await prisma.interviewAnswer.update({
          where: { id: existingAnswer.id },
          data: {
            answerText: sub.answerText,
            selectedOption: sub.selectedOption,
            score,
            aiFeedback: feedback,
            timeTakenSeconds: sub.timeTakenSeconds || 0,
            submittedAt: new Date(),
          },
        });
      } else {
        await prisma.interviewAnswer.create({
          data: {
            questionId: question.id,
            userId,
            answerText: sub.answerText,
            selectedOption: sub.selectedOption,
            score,
            aiFeedback: feedback,
            timeTakenSeconds: sub.timeTakenSeconds || 0,
          },
        });
      }
    }

    const averageRoundScore = currentRound.questions.length > 0
      ? Math.round(totalScore / currentRound.questions.length)
      : 0;

    const isPassed = averageRoundScore >= currentRound.passingScore;
    const newStatus = isPassed ? 'COMPLETED' : 'FAILED';

    let roundFeedback = '';
    if (isPassed) {
      roundFeedback = `Congratulations! You cleared Round ${roundNumber} with a score of ${averageRoundScore}% (Passing threshold: ${currentRound.passingScore}%).`;
    } else {
      roundFeedback = `Round score: ${averageRoundScore}%. Required threshold: ${currentRound.passingScore}%. Practice the recommended areas and feel free to retry this round.`;
    }

    // Update current round in database
    await prisma.interviewRound.update({
      where: { id: currentRound.id },
      data: {
        score: averageRoundScore,
        status: newStatus,
        feedback: roundFeedback,
        evaluationJson: JSON.stringify(roundEvaluations),
        completedAt: new Date(),
      },
    });

    // Progression logic
    if (isPassed) {
      const totalRoundsCount = (await prisma.interviewRound.count({ where: { sessionId } })) || 5;
      const nextRoundNum = roundNumber + 1;
      if (nextRoundNum <= totalRoundsCount) {
        // Unlock next round!
        const nextRound = await prisma.interviewRound.findFirst({
          where: { sessionId, roundNumber: nextRoundNum },
        });
        if (nextRound) {
          await prisma.interviewRound.update({
            where: { id: nextRound.id },
            data: { status: 'NOT_STARTED' },
          });
        }
        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: { currentRound: nextRoundNum },
        });
      } else {
        // All rounds successfully finished!
        const allRounds = await prisma.interviewRound.findMany({ where: { sessionId } });
        const overallScore = Math.round(
          allRounds.reduce((acc, r) => acc + (r.score || 0), 0) / allRounds.length
        );
        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: {
            status: 'COMPLETED',
            overallScore,
            passStatus: 'PASSED',
          },
        });
      }
    } else {
      // Failed round, update session status
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { passStatus: 'FAILED' },
      });
    }

    return this.getSessionDetails(sessionId, userId);
  }

  /**
   * Resets a failed round so candidate can practice and retry
   */
  public async retryRound(sessionId: string, roundNumber: number, userId: string) {
    const session = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        rounds: { where: { roundNumber }, include: { questions: true } },
      },
    });

    if (!session) throw new Error('Session not found.');
    const round = session.rounds[0];
    if (!round) throw new Error('Round not found.');

    if (round.status !== 'FAILED') {
      throw new Error('Only failed rounds can be retried.');
    }

    // Reset round answers
    for (const q of round.questions) {
      await prisma.interviewAnswer.deleteMany({
        where: { questionId: q.id, userId },
      });
    }

    // Reset round status
    await prisma.interviewRound.update({
      where: { id: round.id },
      data: {
        status: 'NOT_STARTED',
        score: null,
        feedback: null,
        evaluationJson: null,
        completedAt: null,
      },
    });

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        currentRound: roundNumber,
        passStatus: 'PENDING',
      },
    });

    return this.getSessionDetails(sessionId, userId);
  }
}

export default new InterviewService();
