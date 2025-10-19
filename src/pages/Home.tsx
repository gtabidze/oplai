import { Button } from "@/components/ui/button";
import { PlaiBookCard } from "@/components/PlaiBookCard";
import { useLocalStorage } from "@/lib/localStorage";
import { Plaibook } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Plaibook
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Create, test, and refine your AI agent knowledge bases
          </p>
        </header>

        <div className="mb-8">
          <Button 
            onClick={handleCreateNew}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Plaibook
          </Button>
        </div>

        {plaibooks.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-6 rounded-full bg-muted/50 mb-6">
              <BookOpen className="h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">No Plaibooks yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first Plaibook to start building your AI agent's knowledge base
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plaibooks.map((plaibook) => (
              <PlaiBookCard key={plaibook.id} plaibook={plaibook} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
