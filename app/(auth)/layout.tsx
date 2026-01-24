import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-claude-cream to-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-claude-orange rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-claude-dark">Claude Onboarding</h1>
          <p className="text-gray-600 mt-2">Personalize your Claude experience</p>
        </div>
        {children}
      </div>
    </div>
  );
}
