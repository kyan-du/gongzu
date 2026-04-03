import Header from './Header';

interface LayoutProps {
  userId: string;
  showBack?: boolean;
  maxWidth?: string;
  children: React.ReactNode;
}

export default function Layout({ userId, showBack, maxWidth, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header userId={userId} showBack={showBack} maxWidth={maxWidth} />
      <div className={`${maxWidth || 'max-w-2xl'} mx-auto px-4 py-6`}>{children}</div>
    </div>
  );
}
