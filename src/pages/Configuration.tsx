import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, MessageSquare, Zap, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const DEFAULT_QUESTION_PROMPT = `You are an expert at generating insightful evaluation questions. 
Generate 5 diverse questions based on the provided content that test understanding, analysis, and application of the material.

Guidelines:
- Create questions that are clear and specific
- Vary the difficulty level
- Focus on key concepts and practical applications
- Avoid yes/no questions
- Make questions thought-provoking`;

const DEFAULT_ANSWER_PROMPT = `You are a knowledgeable assistant providing accurate and helpful answers.
Answer the question based on the provided context clearly and concisely.

Guidelines:
- Be accurate and factual
- Provide context when necessary
- Keep responses focused and relevant
- Use examples when helpful
- Maintain a professional tone`;

const Configuration = () => {
  const { toast } = useToast();
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [answerPrompt, setAnswerPrompt] = useState("");
  const [questionCount, setQuestionCount] = useState("5");
  const [autoSave, setAutoSave] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Load saved settings
    const savedQuestionPrompt = localStorage.getItem("questionSystemPrompt");
    const savedAnswerPrompt = localStorage.getItem("answerSystemPrompt");
    const savedQuestionCount = localStorage.getItem("questionCount");
    const savedAutoSave = localStorage.getItem("autoSave");
    const savedDarkMode = localStorage.getItem("darkMode");

    setQuestionPrompt(savedQuestionPrompt || DEFAULT_QUESTION_PROMPT);
    setAnswerPrompt(savedAnswerPrompt || DEFAULT_ANSWER_PROMPT);
    setQuestionCount(savedQuestionCount || "5");
    setAutoSave(savedAutoSave !== "false");
    setDarkMode(savedDarkMode !== "false");
  }, []);

  const handleSavePrompts = () => {
    localStorage.setItem("questionSystemPrompt", questionPrompt);
    localStorage.setItem("answerSystemPrompt", answerPrompt);
    toast({
      title: "Prompts saved",
      description: "Your system prompts have been updated successfully.",
    });
  };

  const handleResetQuestionPrompt = () => {
    setQuestionPrompt(DEFAULT_QUESTION_PROMPT);
    toast({
      title: "Prompt reset",
      description: "Question generation prompt has been reset to default.",
    });
  };

  const handleResetAnswerPrompt = () => {
    setAnswerPrompt(DEFAULT_ANSWER_PROMPT);
    toast({
      title: "Prompt reset",
      description: "Answer generation prompt has been reset to default.",
    });
  };

  const handleSaveGeneral = () => {
    localStorage.setItem("questionCount", questionCount);
    localStorage.setItem("autoSave", autoSave.toString());
    localStorage.setItem("darkMode", darkMode.toString());
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Manage system prompts, preferences, and application settings
          </p>
        </div>

        <Tabs defaultValue="prompts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="prompts" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              System Prompts
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <Zap className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Generation Prompt</CardTitle>
                <CardDescription>
                  Customize how questions are generated from your playbook content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question-prompt">System Prompt</Label>
                  <Textarea
                    id="question-prompt"
                    value={questionPrompt}
                    onChange={(e) => setQuestionPrompt(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    placeholder="Enter your custom system prompt for question generation..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSavePrompts}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Prompt
                  </Button>
                  <Button variant="outline" onClick={handleResetQuestionPrompt}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Answer Generation Prompt</CardTitle>
                <CardDescription>
                  Customize how answers are generated for evaluation questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="answer-prompt">System Prompt</Label>
                  <Textarea
                    id="answer-prompt"
                    value={answerPrompt}
                    onChange={(e) => setAnswerPrompt(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    placeholder="Enter your custom system prompt for answer generation..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSavePrompts}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Prompt
                  </Button>
                  <Button variant="outline" onClick={handleResetAnswerPrompt}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure your application preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="question-count">Default Question Count</Label>
                  <Select value={questionCount} onValueChange={setQuestionCount}>
                    <SelectTrigger id="question-count">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 questions</SelectItem>
                      <SelectItem value="5">5 questions</SelectItem>
                      <SelectItem value="10">10 questions</SelectItem>
                      <SelectItem value="15">15 questions</SelectItem>
                      <SelectItem value="20">20 questions</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Number of questions to generate by default
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save">Auto-save</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save changes as you type
                    </p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use dark theme throughout the application
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>

                <Button onClick={handleSaveGeneral}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Configure advanced features and integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">Custom API Endpoint</Label>
                  <Input
                    id="api-endpoint"
                    placeholder="https://api.example.com"
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    Configure a custom endpoint for API calls (Coming soon)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model-selection">AI Model</Label>
                  <Select defaultValue="gemini-flash" disabled>
                    <SelectTrigger id="model-selection">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-flash">Gemini Flash</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Select the AI model for generation (Coming soon)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Data Export</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled>
                      Export All Data
                    </Button>
                    <Button variant="outline" disabled>
                      Import Data
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Export or import your playbooks and configurations (Coming soon)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions - proceed with caution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Clear All Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Delete all playbooks, questions, and settings
                    </p>
                  </div>
                  <Button variant="destructive" disabled>
                    Clear All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Configuration;
