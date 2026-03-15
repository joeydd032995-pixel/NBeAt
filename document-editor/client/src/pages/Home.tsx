import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { FileText, Zap, Layers, Palette, Printer, ArrowRight } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/documents");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-pink-300 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">DocEdit</span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="outline" onClick={() => navigate("/documents")}>
                  My Documents
                </Button>
                <Button
                  onClick={() => navigate("/documents")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Document
                </Button>
              </>
            ) : (
              <Button
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
                Create Beautiful Documents with Ease
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                A minimalist document editor designed for clarity and focus. Write, format, and
                enhance your documents with powerful features like watermarks, image layering, and
                multi-material printing.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Start Creating
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="font-semibold">
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
              <div>
                <p className="text-3xl font-bold text-gray-900">100%</p>
                <p className="text-sm text-gray-600">Free to Use</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">∞</p>
                <p className="text-sm text-gray-600">Documents</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">24/7</p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
            </div>
          </div>

          {/* Right Column - Decorative */}
          <div className="relative h-96 md:h-full">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Geometric shapes with Scandinavian aesthetic */}
              <div className="relative w-full h-full">
                {/* Large circle - soft blue */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100 rounded-full opacity-60 blur-3xl"></div>

                {/* Medium square - blush pink */}
                <div className="absolute bottom-10 left-10 w-32 h-32 bg-pink-100 rounded-2xl opacity-50 blur-2xl transform rotate-12"></div>

                {/* Small accent - pale blue */}
                <div className="absolute top-20 left-20 w-24 h-24 bg-blue-50 rounded-lg opacity-80 blur-xl transform -rotate-6"></div>

                {/* Document preview card */}
                <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                  <div className="space-y-4">
                    <div className="h-3 bg-gray-900 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-300 rounded w-full"></div>
                    <div className="h-2 bg-gray-300 rounded w-5/6"></div>

                    <div className="pt-6 space-y-3">
                      <div className="h-2 bg-blue-200 rounded w-1/2"></div>
                      <div className="h-2 bg-pink-200 rounded w-2/3"></div>
                      <div className="h-2 bg-blue-100 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-600">Everything you need for professional documents</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Rich Text Editing</h3>
              <p className="text-gray-600">
                Professional formatting with bold, italic, headings, lists, code blocks, and links.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Watermarks</h3>
              <p className="text-gray-600">
                Add customizable watermarks with opacity, rotation, positioning, and styling.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Layers className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Image Layering</h3>
              <p className="text-gray-600">
                Layer images with blend modes, opacity control, and precise positioning.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Palette className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Color Matching</h3>
              <p className="text-gray-600">
                Extract and manage color palettes for consistent design across documents.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Printer className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-Material Printing</h3>
              <p className="text-gray-600">
                Print on paper, canvas, fabric, vinyl, wood, metal, and acrylic materials.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Version History</h3>
              <p className="text-gray-600">
                Track changes and restore previous versions of your documents anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 md:py-32">
        <div className="bg-gradient-to-r from-blue-50 to-pink-50 rounded-3xl p-12 md:p-20 text-center border border-gray-200">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            Ready to Create?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Start creating beautiful documents today. No credit card required.
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2026 DocEdit. All rights reserved. Built with ❤️ for creators.</p>
        </div>
      </footer>
    </div>
  );
}
