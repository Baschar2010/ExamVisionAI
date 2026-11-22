export type ScoredQuestion = { topic: string; points: number; earned?: number };
export type ScoredExam = { id: string; created: string; submitted?: boolean; questions: ScoredQuestion[] };
export type TopicStat = {
  topic: string;
  earned: number;
  possible: number;
  percent: number;
  attempts: number;
  needsReview: boolean;
};
export type TrendPoint = {
  label: string;
  percent: number;
  earned: number;
  possible: number;
  exams: number;
};
export type LearningAnalytics = {
  submitted: number;
  earned: number;
  possible: number;
  percent: number;
  topics: TopicStat[];
  trend: TrendPoint[];
  weakest: string[];
  strongest: string[];
};

function submittedExams(exams: ScoredExam[]): ScoredExam[] {
  return exams
    .filter(exam => exam.submitted && exam.questions.length > 0)
    .slice()
    .sort((a, b) => a.created.localeCompare(b.created));
}

export function examPercent(exam: ScoredExam): number {
  const possible = exam.questions.reduce((sum, question) => sum + Math.max(0, question.points), 0);
  const earned = exam.questions.reduce((sum, question) => sum + Math.max(0, question.earned || 0), 0);
  return possible ? Math.round(earned / possible * 100) : 0;
}

export function topicStats(exams: ScoredExam[], weak: string[] = []): TopicStat[] {
  const map = new Map<string, TopicStat>();
  for (const exam of submittedExams(exams)) {
    for (const question of exam.questions) {
      const topic = question.topic.trim() || 'Unklar';
      const stat = map.get(topic) || { topic, earned: 0, possible: 0, percent: 0, attempts: 0, needsReview: false };
      stat.possible += Math.max(0, question.points);
      stat.earned += Math.max(0, question.earned || 0);
      stat.attempts += 1;
      map.set(topic, stat);
    }
  }
  for (const topic of weak) {
    const key = topic.trim();
    if (!key) continue;
    const stat = map.get(key) || { topic: key, earned: 0, possible: 0, percent: 0, attempts: 0, needsReview: true };
    stat.needsReview = true;
    map.set(key, stat);
  }
  return [...map.values()]
    .map(stat => ({ ...stat, percent: stat.possible ? Math.round(stat.earned / stat.possible * 100) : 0 }))
    .sort((a, b) => a.percent - b.percent || b.attempts - a.attempts || a.topic.localeCompare(b.topic));
}

export function trendStats(exams: ScoredExam[], buckets = 5): TrendPoint[] {
  const done = submittedExams(exams);
  if (!done.length) return [];
  const groupCount = Math.max(1, Math.min(buckets, done.length));
  const groups: ScoredExam[][] = Array.from({ length: groupCount }, () => []);
  done.forEach((exam, index) => groups[Math.floor(index * groupCount / done.length)].push(exam));
  return groups.filter(group => group.length).map(group => {
    const possible = group.reduce((sum, exam) => sum + exam.questions.reduce((s, q) => s + Math.max(0, q.points), 0), 0);
    const earned = group.reduce((sum, exam) => sum + exam.questions.reduce((s, q) => s + Math.max(0, q.earned || 0), 0), 0);
    const last = group[group.length - 1];
    return {
      label: new Date(last.created).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      percent: possible ? Math.round(earned / possible * 100) : 0,
      earned,
      possible,
      exams: group.length
    };
  });
}

export function analyzeLearning(exams: ScoredExam[], weak: string[] = [], minutes = 0): LearningAnalytics & { minutes: number } {
  const done = submittedExams(exams);
  const possible = done.reduce((sum, exam) => sum + exam.questions.reduce((s, q) => s + Math.max(0, q.points), 0), 0);
  const earned = done.reduce((sum, exam) => sum + exam.questions.reduce((s, q) => s + Math.max(0, q.earned || 0), 0), 0);
  const topics = topicStats(exams, weak);
  const needsReview = topics.filter(topic => topic.needsReview || topic.percent < 60);
  const mastered = topics.filter(topic => !topic.needsReview && topic.percent >= 80 && topic.attempts > 0);
  return {
    submitted: done.length,
    earned,
    possible,
    percent: possible ? Math.round(earned / possible * 100) : 0,
    minutes,
    topics,
    trend: trendStats(exams),
    weakest: needsReview.slice(0, 6).map(topic => topic.topic),
    strongest: mastered.slice(-4).reverse().map(topic => topic.topic)
  };
}
