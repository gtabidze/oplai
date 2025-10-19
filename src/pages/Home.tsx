import { Button } from "@/components/ui/button";
import { PlaiBookCard } from "@/components/PlaiBookCard";
import { useLocalStorage } from "@/lib/localStorage";
import { Plaibook } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Home = () => {
  const navigate = useNavigate();
  const [plaibooks, setPlaibooks] = useLocalStorage<Plaibook[]>('plaibooks', []);

  const handleCreateNew = () => {
    const newPlaibook: Plaibook = {
      id: crypto.randomUUID(),
      title: 'Untitled Plaibook',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setPlaibooks([...plaibooks, newPlaibook]);
    navigate(`/doc/${newPlaibook.id}`);
  };

  const handleDelete = (id: string) => {
    setPlaibooks(plaibooks.filter(pb => pb.id !== id));
  };

  const integrationSteps = [
    {
      title: "Get started with GPT 4o",
      description: "Use OpenAI models for creating AI procedures instantly",
    },
    {
      title: "Use Anthropic Claude",
      description: "Connect Claude for advanced reasoning and long context",
    },
    {
      title: "Custom Integrations",
      description: "Build your own integrations with external AI systems",
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-6">
          <h1 className="text-lg font-semibold">Procedures</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={handleCreateNew} size="sm">
              <Plus className="mr-1 h-4 w-4" />
              New Procedure
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {plaibooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md space-y-6">
              <h2 className="text-3xl font-semibold tracking-tight">
                Create your first Procedure
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Procedures contain specific instructions for an AI agent to carry out tasks. Once you create a procedure, you can manage it below. 
              </p>
              <Button onClick={handleCreateNew} size="lg" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Procedure
              </Button>
            </div>

            <div className="w-full max-w-3xl mt-20 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Connect to external systems</h3>
                <p className="text-sm text-muted-foreground">
                  Enhance your AI agent's capabilities by connecting to external AI models and services. 
                  All your data stays encrypted and secure.
                </p>
              </div>

              <div className="space-y-3">
                {integrationSteps.map((step, index) => (
                  <Card key={index} className="border-border hover:border-primary/50 transition-colors">
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className="mt-1">
                        <Lightbulb className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-medium">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <p className="text-xs text-muted-foreground text-center pt-4">
                Manage all integrations → Settings
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {plaibooks.map((plaibook) => (
              <PlaiBookCard 
                key={plaibook.id} 
                plaibook={plaibook} 
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
