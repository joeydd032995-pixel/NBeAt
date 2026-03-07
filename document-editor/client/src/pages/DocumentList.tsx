import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Trash2, FileText, Calendar, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DocumentList() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDocId, setDeleteDocId] = useState<number | null>(null);

  // API calls
  const listDocsQuery = trpc.documents.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createDocMutation = trpc.documents.create.useMutation({
    onSuccess: () => {
      toast.success("Document created");
      listDocsQuery.refetch();
    },
    onError: () => {
      toast.error("Failed to create document");
    },
  });

  const deleteDocMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      setDeleteDocId(null);
      listDocsQuery.refetch();
    },
    onError: () => {
      toast.error("Failed to delete document");
    },
  });

  const searchDocsQuery = trpc.documents.search.useQuery(
    { query: searchQuery },
    { enabled: isAuthenticated && searchQuery.length > 0 }
  );

  const documents = useMemo(() => {
    if (searchQuery.length > 0 && searchDocsQuery.data) {
      return searchDocsQuery.data;
    }
    return listDocsQuery.data || [];
  }, [listDocsQuery.data, searchDocsQuery.data, searchQuery]);

  const handleCreateDocument = async () => {
    const result = await createDocMutation.mutateAsync({
      title: "Untitled Document",
      content: "",
    });
    // Refetch to get the new document ID, then navigate
    await listDocsQuery.refetch();
  };

  const handleDeleteDocument = async () => {
    if (deleteDocId) {
      await deleteDocMutation.mutateAsync({ id: deleteDocId });
    }
  };

  const handleOpenDocument = (id: number) => {
    navigate(`/editor/${id}`);
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  const formatTime = (date: Date) => {
    return format(new Date(date), "h:mm a");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Documents</h1>
              <p className="text-gray-600">Create, edit, and manage your documents</p>
            </div>
            <Button
              onClick={handleCreateDocument}
              disabled={createDocMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-5 w-5 mr-2" />
              {createDocMutation.isPending ? "Creating..." : "New Document"}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title or content..."
              className="pl-10 py-2 h-10"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {documents.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No documents yet</h2>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "No documents match your search"
                : "Create your first document to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={handleCreateDocument}
                disabled={createDocMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Document
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleOpenDocument(doc.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2 text-lg group-hover:text-blue-600 transition-colors">
                        {doc.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {doc.wordCount} words
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(doc.updatedAt)}
                          </div>
                        </div>
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDocId(doc.id);
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 line-clamp-3">
                    {doc.content
                      .replace(/<[^>]*>/g, "")
                      .substring(0, 150)
                      .trim() || "No content yet"}
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    Updated {formatTime(doc.updatedAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDocId !== null} onOpenChange={(open) => !open && setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              disabled={deleteDocMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteDocMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
