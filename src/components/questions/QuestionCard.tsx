interface QuestionCardProps {
  index: number;
  label?: string;
  compact?: boolean;
  children: React.ReactNode;
}

export default function QuestionCard({ index, label, compact = false, children }: QuestionCardProps) {
  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm px-2.5 py-2">
        <div className="flex items-start gap-1.5">
          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
            {index}
          </span>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      {/* Header: number + label, vertically centered */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {index}
        </span>
        {label && (
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        )}
      </div>
      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
