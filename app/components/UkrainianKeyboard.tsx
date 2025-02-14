"use client";

interface KeyboardProps {
  onKeyPress: (key: string) => void;
}

export default function UkrainianKeyboard({ onKeyPress }: KeyboardProps) {
  const rows = [
    ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ї'],
    ['ф', 'і', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'є'],
    ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', 'ґ'],
  ];

  return (
    <div className="bg-white border-2 border-blue-200 rounded p-2">
      {rows.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 mb-1">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className="w-8 h-8 bg-white border-2 border-blue-200 rounded font-bold text-black hover:bg-blue-50"
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
} 