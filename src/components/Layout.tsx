import Header from './Header';

export interface LayoutProps {
  userId: string;
  showBack?: boolean;
  backTo?: string;
  maxWidth?: string;
  title?: React.ReactNode;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}

export default function Layout({ userId, showBack, backTo, maxWidth, title, rightAction, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header userId={userId} showBack={showBack} backTo={backTo} maxWidth={maxWidth} />
      {(title || rightAction) && (
        <div className={`${maxWidth || 'max-w-3xl'} mx-auto px-4 pt-6 pb-0 flex items-center justify-between`}>
          {title && <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h1>}
          {rightAction && <div>{rightAction}</div>}
        </div>
      )}
      <div className={`${maxWidth || 'max-w-3xl'} mx-auto px-4 py-6`}>{children}</div>
    </div>
  );
}
