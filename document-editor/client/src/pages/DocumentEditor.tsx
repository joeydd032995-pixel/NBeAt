import { useState, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import RichTextEditor from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download, Save, RotateCcw, Layers, Droplet, Printer, History, Trash2, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function DocumentEditor() {
  const [, params] = useRoute("/editor/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const documentId = params?.id ? parseInt(params.id) : null;

  // Document state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Watermark state
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkOpacity, setWatermarkOpacity] = useState(30);
  const [watermarkRotation, setWatermarkRotation] = useState(0);
  const [watermarkPosition, setWatermarkPosition] = useState("center");
  const [watermarkFontSize, setWatermarkFontSize] = useState(48);
  const [watermarkColor, setWatermarkColor] = useState("#000000");
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);

  // Layer state
  const [layers, setLayers] = useState<any[]>([]);
  const [newLayerUrl, setNewLayerUrl] = useState("");
  const [newLayerName, setNewLayerName] = useState("");

  // Color state
  const [paletteName, setPaletteName] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // Print material state
  const [materialType, setMaterialType] = useState("paper");
  const [materialName, setMaterialName] = useState("");
  const [dpi, setDpi] = useState(300);
  const [colorMode, setColorMode] = useState("RGB");

  // API calls
  const getDocQuery = trpc.documents.get.useQuery(
    { id: documentId! },
    { enabled: !!documentId }
  );

  const updateDocMutation = trpc.documents.update.useMutation({
    onSuccess: () => {
      toast.success("Document saved successfully");
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error("Failed to save document");
      setIsSaving(false);
    },
  });

  const deleteDocMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      navigate("/");
    },
    onError: () => {
      toast.error("Failed to delete document");
    },
  });

  const saveWatermarkMutation = trpc.watermarks.save.useMutation({
    onSuccess: () => {
      toast.success("Watermark saved");
    },
    onError: () => {
      toast.error("Failed to save watermark");
    },
  });

  const createLayerMutation = trpc.layers.create.useMutation({
    onSuccess: () => {
      toast.success("Layer added");
      setNewLayerUrl("");
      setNewLayerName("");
      refetchLayers();
    },
    onError: () => {
      toast.error("Failed to add layer");
    },
  });

  const getLayersQuery = trpc.layers.list.useQuery(
    { documentId: documentId! },
    { enabled: !!documentId }
  );

  const refetchLayers = () => {
    getLayersQuery.refetch();
  };

  const saveColorMutation = trpc.colors.save.useMutation({
    onSuccess: () => {
      toast.success("Color palette saved");
      setPaletteName("");
      setSelectedColors([]);
    },
    onError: () => {
      toast.error("Failed to save color palette");
    },
  });

  const createPrintMaterialMutation = trpc.printMaterials.create.useMutation({
    onSuccess: () => {
      toast.success("Print material configuration saved");
    },
    onError: () => {
      toast.error("Failed to save print material");
    },
  });

  // Load document data
  useEffect(() => {
    if (getDocQuery.data) {
      setTitle(getDocQuery.data.title);
      setContent(getDocQuery.data.content);
      setWordCount(getDocQuery.data.wordCount);
    }
  }, [getDocQuery.data]);

  // Load layers
  useEffect(() => {
    if (getLayersQuery.data) {
      setLayers(getLayersQuery.data);
    }
  }, [getLayersQuery.data]);

  const calculateWordCount = (text: string) => {
    const stripped = text.replace(/<[^>]*>/g, "");
    return stripped.trim().split(/\s+/).length;
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setWordCount(calculateWordCount(newContent));
  };

  const handleSave = useCallback(async () => {
    if (!documentId) return;
    setIsSaving(true);
    await updateDocMutation.mutateAsync({
      id: documentId,
      title,
      content,
    });
  }, [documentId, title, content, updateDocMutation]);

  const handleDelete = async () => {
    if (!documentId) return;
    await deleteDocMutation.mutateAsync({ id: documentId });
  };

  const handleSaveWatermark = async () => {
    if (!documentId) return;
    await saveWatermarkMutation.mutateAsync({
      documentId,
      text: watermarkText,
      opacity: watermarkOpacity,
      rotation: watermarkRotation,
      position: watermarkPosition as any,
      fontSize: watermarkFontSize,
      fontColor: watermarkColor,
      enabled: watermarkEnabled,
    });
  };

  const handleAddLayer = async () => {
    if (!documentId || !newLayerUrl || !newLayerName) {
      toast.error("Please fill in all layer fields");
      return;
    }
    await createLayerMutation.mutateAsync({
      documentId,
      imageUrl: newLayerUrl,
      layerName: newLayerName,
    });
  };

  const handleSaveColor = async () => {
    if (!documentId || !paletteName || selectedColors.length === 0) {
      toast.error("Please provide palette name and at least one color");
      return;
    }
    await saveColorMutation.mutateAsync({
      documentId,
      paletteName,
      colors: selectedColors,
    });
  };

  const handleSavePrintMaterial = async () => {
    if (!documentId || !materialName) {
      toast.error("Please provide material name");
      return;
    }
    await createPrintMaterialMutation.mutateAsync({
      documentId,
      materialType: materialType as any,
      materialName,
      dpi,
      colorMode: colorMode as any,
    });
  };

  const exportPDF = () => {
    const element = document.createElement("div");
    element.innerHTML = content;
    element.style.padding = "20px";
    element.style.fontFamily = "Arial, sans-serif";

    const opt = {
      margin: 10,
      filename: `${title}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
  };

  const exportMarkdown = () => {
    const markdown = content
      .replace(/<h1[^>]*>(.*?)<\/h1>/g, "# $1\n")
      .replace(/<h2[^>]*>(.*?)<\/h2>/g, "## $1\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/g, "### $1\n")
      .replace(/<p[^>]*>(.*?)<\/p>/g, "$1\n")
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, "**$1**")
      .replace(/<em[^>]*>(.*?)<\/em>/g, "*$1*")
      .replace(/<u[^>]*>(.*?)<\/u>/g, "__$1__")
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, "[$2]($1)")
      .replace(/<ul[^>]*>(.*?)<\/ul>/g, (match, content) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/g, "- $1\n");
      })
      .replace(/<ol[^>]*>(.*?)<\/ol>/g, (match: string, content: string) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/g, (m: string, c: string) => `1. ${c}\n`);
      })
      .replace(/<code[^>]*>(.*?)<\/code>/g, "`$1`")
      .replace(/<[^>]*>/g, "");

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/markdown;charset=utf-8," + encodeURIComponent(markdown));
    element.setAttribute("download", `${title}.md`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exportText = () => {
    const text = content.replace(/<[^>]*>/g, "");
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", `${title}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!documentId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Document not found</p>
          <Button onClick={() => navigate("/")} variant="outline">
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  if (getDocQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading document...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold border-0 focus-visible:ring-0 px-0"
              placeholder="Untitled Document"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{wordCount} words</span>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Editor - Main Column */}
          <div className="lg:col-span-3">
            <RichTextEditor content={content} onChange={handleContentChange} />
          </div>

          {/* Sidebar - Features */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="export" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="export">Export</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>

              {/* Export Tab */}
              <TabsContent value="export" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Export Document</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={exportPDF} variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button onClick={exportMarkdown} variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Markdown
                    </Button>
                    <Button onClick={exportText} variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Plain Text
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant="destructive"
                      className="w-full justify-start"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features" className="space-y-4">
                {/* Watermark */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Watermark
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={watermarkEnabled}
                        onCheckedChange={(checked) => setWatermarkEnabled(checked === true)}
                        id="watermark-enabled"
                      />
                      <Label htmlFor="watermark-enabled" className="text-sm">
                        Enable
                      </Label>
                    </div>

                    <Textarea
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Watermark text"
                      className="text-sm"
                      rows={2}
                    />

                    <div>
                      <Label className="text-xs">Opacity: {watermarkOpacity}%</Label>
                      <Slider
                        value={[watermarkOpacity]}
                        onValueChange={(v) => setWatermarkOpacity(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Rotation: {watermarkRotation}°</Label>
                      <Slider
                        value={[watermarkRotation]}
                        onValueChange={(v) => setWatermarkRotation(v[0])}
                        min={0}
                        max={360}
                        step={1}
                      />
                    </div>

                    <Select value={watermarkPosition} onValueChange={setWatermarkPosition}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="diagonal">Diagonal</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Font Size</Label>
                        <Input
                          type="number"
                          value={watermarkFontSize}
                          onChange={(e) => setWatermarkFontSize(parseInt(e.target.value))}
                          min={8}
                          max={200}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Color</Label>
                        <Input
                          type="color"
                          value={watermarkColor}
                          onChange={(e) => setWatermarkColor(e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveWatermark}
                      size="sm"
                      className="w-full"
                      disabled={!watermarkText}
                    >
                      Save Watermark
                    </Button>
                  </CardContent>
                </Card>

                {/* Layers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Image Layers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      value={newLayerUrl}
                      onChange={(e) => setNewLayerUrl(e.target.value)}
                      placeholder="Image URL"
                      className="text-sm"
                    />
                    <Input
                      value={newLayerName}
                      onChange={(e) => setNewLayerName(e.target.value)}
                      placeholder="Layer name"
                      className="text-sm"
                    />
                    <Button
                      onClick={handleAddLayer}
                      size="sm"
                      className="w-full"
                      disabled={!newLayerUrl || !newLayerName}
                    >
                      Add Layer
                    </Button>

                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {layers.map((layer) => (
                        <div key={layer.id} className="text-xs p-2 bg-gray-50 rounded border">
                          <p className="font-medium truncate">{layer.layerName}</p>
                          <p className="text-gray-600">Opacity: {layer.opacity}%</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Droplet className="h-4 w-4" />
                      Color Palette
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      value={paletteName}
                      onChange={(e) => setPaletteName(e.target.value)}
                      placeholder="Palette name"
                      className="text-sm"
                    />

                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="h-10 w-12 p-1 cursor-pointer"
                        onChange={(e) => {
                          if (!selectedColors.includes(e.target.value)) {
                            setSelectedColors([...selectedColors, e.target.value]);
                          }
                        }}
                      />
                      <span className="text-xs text-gray-600 flex items-center">
                        {selectedColors.length} colors
                      </span>
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {selectedColors.map((color) => (
                        <div
                          key={color}
                          className="w-8 h-8 rounded border-2 border-gray-200 cursor-pointer hover:border-gray-400"
                          style={{ backgroundColor: color }}
                          onClick={() =>
                            setSelectedColors(selectedColors.filter((c) => c !== color))
                          }
                          title="Click to remove"
                        />
                      ))}
                    </div>

                    <Button
                      onClick={handleSaveColor}
                      size="sm"
                      className="w-full"
                      disabled={!paletteName || selectedColors.length === 0}
                    >
                      Save Palette
                    </Button>
                  </CardContent>
                </Card>

                {/* Print Materials */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      Print Material
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={materialType} onValueChange={setMaterialType}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Material type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paper">Paper</SelectItem>
                        <SelectItem value="canvas">Canvas</SelectItem>
                        <SelectItem value="fabric">Fabric</SelectItem>
                        <SelectItem value="vinyl">Vinyl</SelectItem>
                        <SelectItem value="wood">Wood</SelectItem>
                        <SelectItem value="metal">Metal</SelectItem>
                        <SelectItem value="acrylic">Acrylic</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      value={materialName}
                      onChange={(e) => setMaterialName(e.target.value)}
                      placeholder="Material name"
                      className="text-sm"
                    />

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">DPI</Label>
                        <Input
                          type="number"
                          value={dpi}
                          onChange={(e) => setDpi(parseInt(e.target.value))}
                          min={72}
                          max={1200}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Color Mode</Label>
                        <Select value={colorMode} onValueChange={setColorMode}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RGB">RGB</SelectItem>
                            <SelectItem value="CMYK">CMYK</SelectItem>
                            <SelectItem value="Grayscale">Grayscale</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={handleSavePrintMaterial}
                      size="sm"
                      className="w-full"
                      disabled={!materialName}
                    >
                      Save Configuration
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
