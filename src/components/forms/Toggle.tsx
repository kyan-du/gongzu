interface ToggleProps {
  on: boolean;
  onChange: () => void;
  color?: 'green' | 'blue';
}

export default function Toggle({ on, onChange, color = 'green' }: ToggleProps) {
  const bg = on
    ? color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
    : 'bg-gray-300 dark:bg-gray-600';

  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bg}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
