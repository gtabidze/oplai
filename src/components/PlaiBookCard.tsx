import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plaibook } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { FileText, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface PlaiBookCardProps {
  plaibook: Plaibook;
  onDelete?: (id: string) => void;
}

export const PlaiBookCard = ({ plaibook, onDelete }: PlaiBookCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/doc/${plaibook.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(plaibook.id);
    }
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
      className="cursor-pointer transition-colors hover:bg-accent/5 border-border bg-card"
      onClick={handleClick}
    >
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-muted">
            <FileText className="h-4 w-4 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium mb-1 truncate">
              {plaibook.title}
            </CardTitle>
            <CardDescription className="text-xs truncate">
              {plaibook.content 
                ? `${plaibook.content.substring(0, 60)}${plaibook.content.length > 60 ? '...' : ''}`
                : 'No content yet'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(plaibook.updatedAt)}
            </p>
            {onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
