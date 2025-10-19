import { useState, useEffect } from "react";
import { getAllPlaibooks } from "@/lib/localStorage";
import { Plaibook, SavedQuestion } from "@/lib/types";
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
    calculateStats();
  }, []);

  const calculateStats = () => {
    const plaibooks = getAllPlaibooks();
    let totalQuestions = 0;
    let answeredQuestions = 0;
    let totalScore = 0;
    let scoredQuestions = 0;
    let positiveCount = 0;
    let feedbackCount = 0;
    const activities: RecentActivity[] = [];

    plaibooks.forEach((plaibook: Plaibook) => {
      if (plaibook.questions) {
        plaibook.questions.forEach((question: SavedQuestion) => {
          totalQuestions++;
          
          if (question.answer) {
            answeredQuestions++;
            activities.push({
              plaibookTitle: plaibook.title,
              question: question.question,
              timestamp: Date.now(),
              hasAnswer: true,
            });
          }

          if (question.feedback) {
            feedbackCount++;
            if (question.feedback.score !== undefined) {
              totalScore += question.feedback.score;
              scoredQuestions++;
            }
            if (question.feedback.thumbsUp) {
              positiveCount++;
            }
          }
        });
      }
    });

    setStats({
      totalPlaibooks: plaibooks.length,
      totalQuestions,
      answeredQuestions,
      pendingQuestions: totalQuestions - answeredQuestions,
      averageScore: scoredQuestions > 0 ? Math.round(totalScore / scoredQuestions) : 0,
      positiveRate: feedbackCount > 0 ? Math.round((positiveCount / feedbackCount) * 100) : 0,
    });

    setRecentActivity(activities.slice(0, 5));
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
