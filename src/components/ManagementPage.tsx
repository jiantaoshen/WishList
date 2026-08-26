import type { ReactNode } from "react";

interface ManagementPageProps {
  title: string;
  description?: string;
  onBack: () => void;
  children: ReactNode;
}

export function ManagementPage({
  title,
  description,
  onBack,
  children,
}: ManagementPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">

      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-5 py-5 sm:px-6">

          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>

        </div>
      </header>


      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-6">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {title}
          </h1>

          {description && (
            <p className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>


        {children}

      </main>

    </div>
  );
}