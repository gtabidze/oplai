import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";

interface StorageProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: string;
}

const storageProviders: StorageProvider[] = [
  {
    id: "dropbox",
    name: "Dropbox",
    logo: "https://images.unsplash.com/photo-1606236236107-3a9ed2c6f0e2?w=100&h=100&fit=crop",
    description: "Cloud storage and file synchronization",
    category: "Cloud Storage"
  },
  {
    id: "google-drive",
    name: "Google Drive",
    logo: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&h=100&fit=crop",
    description: "Google's cloud storage service",
    category: "Cloud Storage"
  },
  {
    id: "onedrive",
    name: "OneDrive",
    logo: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=100&h=100&fit=crop",
    description: "Microsoft's cloud storage platform",
    category: "Cloud Storage"
  },
  {
    id: "box",
    name: "Box",
    logo: "https://images.unsplash.com/photo-1618044733300-9472054094ee?w=100&h=100&fit=crop",
    description: "Enterprise cloud content management",
    category: "Cloud Storage"
  },
  {
    id: "aws-s3",
    name: "Amazon S3",
    logo: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=100&h=100&fit=crop",
    description: "Amazon's object storage service",
    category: "Cloud Storage"
  },
  {
    id: "icloud",
    name: "iCloud Drive",
    logo: "https://images.unsplash.com/photo-1611532736570-ebfb82cad513?w=100&h=100&fit=crop",
    description: "Apple's cloud storage service",
    category: "Cloud Storage"
  },
  {
    id: "notion",
    name: "Notion",
    logo: "https://images.unsplash.com/photo-1618044733300-9472054094ee?w=100&h=100&fit=crop",
    description: "All-in-one workspace and documentation",
    category: "Documentation"
  },
  {
    id: "confluence",
    name: "Confluence",
    logo: "https://images.unsplash.com/photo-1606236236107-3a9ed2c6f0e2?w=100&h=100&fit=crop",
    description: "Team collaboration and documentation",
    category: "Documentation"
  },
  {
    id: "sharepoint",
    name: "SharePoint",
    logo: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=100&h=100&fit=crop",
    description: "Microsoft's collaboration platform",
    category: "Documentation"
  },
  {
    id: "github",
    name: "GitHub",
    logo: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=100&h=100&fit=crop",
    description: "Code hosting and version control",
    category: "Development"
  },
  {
    id: "evernote",
    name: "Evernote",
    logo: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=100&h=100&fit=crop",
    description: "Note-taking and organization",
    category: "Documentation"
  }
];

export default function Datasets() {
  const [selectedProvider, setSelectedProvider] = useState<StorageProvider | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleProviderClick = (provider: StorageProvider) => {
    setSelectedProvider(provider);
    setIsDialogOpen(true);
  };

  const groupedProviders = storageProviders.reduce((acc, provider) => {
    if (!acc[provider.category]) {
      acc[provider.category] = [];
    }
    acc[provider.category].push(provider);
    return acc;
  }, {} as Record<string, StorageProvider[]>);

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Datasets</h1>
          <p className="text-muted-foreground mt-2">
            Connect and sync your data from cloud storage providers and collaboration tools
          </p>
        </div>

        {/* Introduction Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Cloud className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="text-xl font-semibold">Connect Your Data Sources</h2>
                <p className="text-sm text-muted-foreground">
                  Sync your documents and data from popular cloud storage providers and collaboration tools. 
                  Select a provider below to get started.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Providers by Category */}
        {Object.entries(groupedProviders).map(([category, providers]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{category}</h3>
              <Badge variant="secondary" className="text-xs">
                {providers.length}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 group"
                  onClick={() => handleProviderClick(provider)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                        <img
                          src={provider.logo}
                          alt={`${provider.name} logo`}
                          className="h-12 w-12 object-cover rounded-md"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold">{provider.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {provider.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Cloud className="h-5 w-5 text-primary" />
              </div>
              {selectedProvider?.name} Integration
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-3">
              <p className="text-base">
                Integration with <span className="font-semibold text-foreground">{selectedProvider?.name}</span> is coming soon!
              </p>
              <p className="text-sm">
                We're working on bringing you seamless data synchronization from {selectedProvider?.name}. 
                Stay tuned for updates.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={() => setIsDialogOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
