import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plaibook } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

interface PlaiBookCardProps {
  plaibook: Plaibook;
}

export const PlaiBookCard = ({ plaibook }: PlaiBookCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/doc/${plaibook.id}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card 
      className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-glow border-border bg-card"
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{plaibook.title}</CardTitle>
            <CardDescription>
              {plaibook.content 
                ? `${plaibook.content.substring(0, 100)}${plaibook.content.length > 100 ? '...' : ''}`
                : 'No content yet'}
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-3">
              Updated {formatDate(plaibook.updatedAt)}
            </p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
