interface QuestionCardProps {
  index: number;
  children: React.ReactNode;
}

export default function QuestionCard({ index, children }: QuestionCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-start gap-2">
        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {index}
        </span>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
