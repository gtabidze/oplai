import { useState, useEffect } from "react";
import { usePlaybooks } from "@/hooks/usePlaybooks";
import { SavedQuestion } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, MessageSquare, CheckCircle, Clock, TrendingUp, ThumbsUp } from "lucide-react";

interface Stats {
  totalPlaibooks: number;
  totalQuestions: number;
  answeredQuestions: number;
  pendingQuestions: number;
  averageScore: number;
  positiveRate: number;
}

interface RecentActivity {
  plaibookTitle: string;
  question: string;
  timestamp: number;
  hasAnswer: boolean;
}

const Monitor = () => {
  const { playbooks: plaibooks, isLoading: playbooksLoading } = usePlaybooks();
  const [stats, setStats] = useState<Stats>({
    totalPlaibooks: 0,
    totalQuestions: 0,
    answeredQuestions: 0,
    pendingQuestions: 0,
    averageScore: 0,
    positiveRate: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    if (!playbooksLoading) {
      calculateStats();
    }
  }, [plaibooks, playbooksLoading]);

  const calculateStats = async () => {
    if (plaibooks.length === 0) {
      setStats({
        totalPlaibooks: 0,
        totalQuestions: 0,
        answeredQuestions: 0,
        pendingQuestions: 0,
        averageScore: 0,
        positiveRate: 0,
      });
      setRecentActivity([]);
      return;
    }

    try {
      const playbookIds = plaibooks.map(p => p.id);

      // Fetch questions for these playbooks
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id, question, playbook_id");

      if (questionsError) throw questionsError;

      const questionIds = questions?.map(q => q.id) || [];

      // Fetch answers for these questions
      const { data: answers, error: answersError } = await supabase
        .from("answers")
        .select("question_id, score, created_at")
        .in("question_id", questionIds);

      if (answersError) throw answersError;

      // Calculate stats
      const totalQuestions = questions?.length || 0;
      const answeredQuestionIds = new Set(answers?.map(a => a.question_id) || []);
      const answeredQuestions = answeredQuestionIds.size;

      let totalScore = 0;
      let scoredCount = 0;
      let positiveCount = 0;

      answers?.forEach(answer => {
        if (answer.score !== null && answer.score !== undefined) {
          totalScore += answer.score;
          scoredCount++;
          if (answer.score >= 50) {
            positiveCount++;
          }
        }
      });

      const averageScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
      const positiveRate = scoredCount > 0 ? Math.round((positiveCount / scoredCount) * 100) : 0;

      setStats({
        totalPlaibooks: plaibooks.length,
        totalQuestions,
        answeredQuestions,
        pendingQuestions: totalQuestions - answeredQuestions,
        averageScore,
        positiveRate,
      });

      // Build recent activity
      const activities: RecentActivity[] = [];
      const sortedAnswers = answers?.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5);

      sortedAnswers?.forEach(answer => {
        const question = questions?.find(q => q.id === answer.question_id);
        const playbook = plaibooks.find(p => p.id === question?.playbook_id);
        if (question && playbook) {
          activities.push({
            plaibookTitle: playbook.title,
            question: question.question,
            timestamp: new Date(answer.created_at).getTime(),
            hasAnswer: true,
          });
        }
      });

      setRecentActivity(activities);
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Monitor Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your evaluation performance and activity
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={FileText}
            title="Total Playbooks"
            value={stats.totalPlaibooks}
            subtitle="Active playbooks"
          />
          <StatCard
            icon={MessageSquare}
            title="Total Questions"
            value={stats.totalQuestions}
            subtitle="Generated questions"
          />
          <StatCard
            icon={CheckCircle}
            title="Answered"
            value={stats.answeredQuestions}
            subtitle={`${stats.pendingQuestions} pending`}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats.averageScore}%</span>
                <span className="text-sm text-muted-foreground">Overall performance</span>
              </div>
              <Progress value={stats.averageScore} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5" />
                Positive Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats.positiveRate}%</span>
                <span className="text-sm text-muted-foreground">User satisfaction</span>
              </div>
              <Progress value={stats.positiveRate} className="h-2" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity. Generate questions to see activity here.
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {activity.hasAnswer ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.plaibookTitle}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activity.question}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Question Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Answered</span>
                <span className="text-sm font-medium">{stats.answeredQuestions}</span>
              </div>
              <Progress
                value={
                  stats.totalQuestions > 0
                    ? (stats.answeredQuestions / stats.totalQuestions) * 100
                    : 0
                }
                className="h-2"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <span className="text-sm font-medium">{stats.pendingQuestions}</span>
              </div>
              <Progress
                value={
                  stats.totalQuestions > 0
                    ? (stats.pendingQuestions / stats.totalQuestions) * 100
                    : 0
                }
                className="h-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="text-sm font-medium">
                  {stats.totalQuestions > 0
                    ? Math.round((stats.answeredQuestions / stats.totalQuestions) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Questions/Playbook</span>
                <span className="text-sm font-medium">
                  {stats.totalPlaibooks > 0
                    ? Math.round(stats.totalQuestions / stats.totalPlaibooks)
                    : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Evaluations</span>
                <span className="text-sm font-medium">{stats.totalQuestions}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Monitor;
