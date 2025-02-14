"use client";
import { useState } from 'react';

interface WordPair {
  english: string;
  foreign: string;
}

interface Subsentence {
  subsentence: string;
  translation: string;
}

interface Sentence {
  sentence: string;
  translation: string;
  subsentences?: Subsentence[];
  word_pairs: [string, string][];
}

interface LessonData {
  sentences: Sentence[];
}

type LearningStage = 'words' | 'subsentences' | 'fullsentence';
type Mode = 'duolingo' | 'keyboard';
type Language = 'russian' | 'ukrainian' | 'swedish';

interface KeyMapping {
  cyrillic: string;
  latin: string;
  keyCode: string;
}

const RUSSIAN_LAYOUT: KeyMapping[][] = [
  [ // Row 1
    { cyrillic: 'й', latin: 'y', keyCode: 'KeyY' },
    { cyrillic: 'ц', latin: 'ts', keyCode: 'KeyC' },
    { cyrillic: 'у', latin: 'u', keyCode: 'KeyU' },
    { cyrillic: 'к', latin: 'k', keyCode: 'KeyK' },
    { cyrillic: 'е', latin: 'ye', keyCode: 'KeyE' },
    { cyrillic: 'н', latin: 'n', keyCode: 'KeyN' },
    { cyrillic: 'г', latin: 'g', keyCode: 'KeyG' },
    { cyrillic: 'ш', latin: 'sh', keyCode: 'KeyS' },
    { cyrillic: 'щ', latin: 'sch', keyCode: 'KeyW' },
    { cyrillic: 'з', latin: 'z', keyCode: 'KeyZ' },
    { cyrillic: 'х', latin: 'h', keyCode: 'KeyH' },
    { cyrillic: 'ъ', latin: '', keyCode: '' },
  ],
  [ // Row 2
    { cyrillic: 'ф', latin: 'f', keyCode: 'KeyF' },
    { cyrillic: 'ы', latin: 'i', keyCode: 'KeyI' },
    { cyrillic: 'в', latin: 'v', keyCode: 'KeyV' },
    { cyrillic: 'а', latin: 'a', keyCode: 'KeyA' },
    { cyrillic: 'п', latin: 'p', keyCode: 'KeyP' },
    { cyrillic: 'р', latin: 'r', keyCode: 'KeyR' },
    { cyrillic: 'о', latin: 'o', keyCode: 'KeyO' },
    { cyrillic: 'л', latin: 'l', keyCode: 'KeyL' },
    { cyrillic: 'д', latin: 'd', keyCode: 'KeyD' },
    { cyrillic: 'ж', latin: 'zh', keyCode: 'KeyJ' },
    { cyrillic: 'э', latin: 'e', keyCode: 'KeyE' },
  ],
  [ // Row 3
    { cyrillic: 'я', latin: 'ya', keyCode: 'KeyY' },
    { cyrillic: 'ч', latin: 'ch', keyCode: 'KeyX' },
    { cyrillic: 'с', latin: 's', keyCode: 'KeyS' },
    { cyrillic: 'м', latin: 'm', keyCode: 'KeyM' },
    { cyrillic: 'и', latin: 'ee', keyCode: 'KeyE' },
    { cyrillic: 'т', latin: 't', keyCode: 'KeyT' },
    { cyrillic: 'ь', latin: '', keyCode: '' },
    { cyrillic: 'б', latin: 'b', keyCode: 'KeyB' },
    { cyrillic: 'ю', latin: 'yu', keyCode: 'KeyU' },
  ],
];

const UKRAINIAN_LAYOUT: KeyMapping[][] = [
  [ // Row 1
    { cyrillic: 'й', latin: 'y', keyCode: 'KeyY' },
    { cyrillic: 'ц', latin: 'ts', keyCode: 'KeyC' },
    { cyrillic: 'у', latin: 'u', keyCode: 'KeyU' },
    { cyrillic: 'к', latin: 'k', keyCode: 'KeyK' },
    { cyrillic: 'е', latin: 'e', keyCode: 'KeyE' },
    { cyrillic: 'н', latin: 'n', keyCode: 'KeyN' },
    { cyrillic: 'г', latin: 'h', keyCode: 'KeyH' },
    { cyrillic: 'ш', latin: 'sh', keyCode: 'KeyS' },
    { cyrillic: 'щ', latin: 'sch', keyCode: 'KeyW' },
    { cyrillic: 'з', latin: 'z', keyCode: 'KeyZ' },
    { cyrillic: 'х', latin: 'kh', keyCode: 'KeyX' },
    { cyrillic: 'ї', latin: 'yi', keyCode: 'KeyI' },
  ],
  // ... continue with rest of Ukrainian layout ...
];

const SWEDISH_LAYOUT: KeyMapping[][] = [ /* ... keep existing Swedish layout ... */ ];

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function generateOptions(
  correctAnswer: string,
  allPossibleAnswers: string[],
  setOptions: React.Dispatch<React.SetStateAction<string[]>>,
  stage: LearningStage
) {
  // For words stage, only use single-word answers as options
  if (stage === 'words') {
    const singleWordAnswers = allPossibleAnswers.filter(ans => !ans.includes(' '));
    const wrongAnswers = singleWordAnswers.filter(ans => ans !== correctAnswer);
    const randomWrong = shuffleArray(wrongAnswers).slice(0, 3);
    const finalList = shuffleArray([...randomWrong, correctAnswer]);
    setOptions(finalList);
  } else {
    // For subsentences and full sentences, use the original logic
    const wrongAnswers = allPossibleAnswers.filter(ans => ans !== correctAnswer);
    const randomWrong = shuffleArray(wrongAnswers).slice(0, 3);
    const finalList = shuffleArray([...randomWrong, correctAnswer]);
    setOptions(finalList);
  }
}

const LANGUAGE_VOICES = {
  russian: 'ru-RU',
  ukrainian: 'uk-UA',
  swedish: 'sv-SE'
};

export default function LanguagesPage() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [stage, setStage] = useState<LearningStage>('words');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentSubsentenceIndex, setCurrentSubsentenceIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Keyboard mode states
  const [language, setLanguage] = useState<Language>('russian');
  const [text, setText] = useState('');
  const [shift, setShift] = useState(false);

  const currentLayout = {
    russian: RUSSIAN_LAYOUT,
    ukrainian: UKRAINIAN_LAYOUT,
    swedish: SWEDISH_LAYOUT
  }[language];

  const [options, setOptions] = useState<string[]>([]);

  const handleJsonInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const data = JSON.parse(e.target.value);
      setLessonData(data);
    } catch (error) {
      console.error('Invalid JSON');
    }
  };

  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .replace(/[.,!?]/g, ''); // Remove punctuation
  };

  const checkAnswer = (selectedOption: string) => {
    if (!lessonData) return;
    const currentSentence = lessonData.sentences[currentSentenceIndex];
    if (!currentSentence) return;

    let correctAnswer = '';

    if (stage === 'words') {
      correctAnswer = currentSentence.word_pairs[currentWordIndex][1];
    } else if (stage === 'subsentences' && currentSentence.subsentences) {
      correctAnswer = currentSentence.subsentences[currentSubsentenceIndex].translation;
    } else {
      correctAnswer = currentSentence.translation;
    }

    const normalizedUserInput = normalizeString(selectedOption);
    const normalizedCorrectAnswer = normalizeString(correctAnswer);

    console.log('User Input:', normalizedUserInput);
    console.log('Correct Answer:', normalizedCorrectAnswer);

    const correct = normalizedUserInput === normalizedCorrectAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
    setUserInput(selectedOption);
  };

  const nextItem = () => {
    setUserInput('');
    setShowFeedback(false);

    if (stage === 'words') {
      if (currentWordIndex < lessonData!.sentences[currentSentenceIndex].word_pairs.length - 1) {
        const newIndex = currentWordIndex + 1;
        setCurrentWordIndex(newIndex);

        const newCorrect = lessonData!.sentences[currentSentenceIndex].word_pairs[newIndex][1];
        const allWordTranslations = lessonData!.sentences[currentSentenceIndex].word_pairs.map(pair => pair[1]);
        generateOptions(newCorrect, allWordTranslations, setOptions, 'words');
        speak(newCorrect);

      } else {
        setStage('subsentences');
        setCurrentWordIndex(0);

        const currentSentence = lessonData?.sentences[currentSentenceIndex];
        if (currentSentence?.subsentences && currentSentence.subsentences.length > 0) {
          const correctSub = currentSentence.subsentences[0].translation;
          const allSubs = currentSentence.subsentences.map(s => s.translation);
          generateOptions(correctSub, allSubs, setOptions, 'subsentences');
          speak(correctSub);
        }
      }
    } else if (stage === 'subsentences') {
      if (
        lessonData!.sentences[currentSentenceIndex].subsentences &&
        currentSubsentenceIndex < lessonData!.sentences[currentSentenceIndex].subsentences.length - 1
      ) {
        const newIndex = currentSubsentenceIndex + 1;
        setCurrentSubsentenceIndex(newIndex);

        const correctSub = lessonData!.sentences[currentSentenceIndex].subsentences[newIndex].translation;
        const allSubs = lessonData!.sentences[currentSentenceIndex].subsentences.map(s => s.translation);
        generateOptions(correctSub, allSubs, setOptions, 'subsentences');
        speak(correctSub);

      } else {
        setStage('fullsentence');
        setCurrentSubsentenceIndex(0);

        generateOptions(lessonData!.sentences[currentSentenceIndex].translation, [lessonData!.sentences[currentSentenceIndex].translation], setOptions, 'fullsentence');
        speak(lessonData!.sentences[currentSentenceIndex].translation);
      }
    } else {
      if (currentSentenceIndex < lessonData!.sentences.length - 1) {
        const newIndex = currentSentenceIndex + 1;
        setCurrentSentenceIndex(newIndex);
        setStage('words');
        setCurrentWordIndex(0);
        setCurrentSubsentenceIndex(0);

        const newSentence = lessonData!.sentences[newIndex];
        if (newSentence.word_pairs && newSentence.word_pairs.length > 0) {
          const newWord = newSentence.word_pairs[0][1];
          const allWordTranslations = newSentence.word_pairs.map(pair => pair[1]);
          generateOptions(newWord, allWordTranslations, setOptions, 'words');
          speak(newWord);
        }
      } else {
        alert('Congratulations! You have completed the lesson!');
      }
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANGUAGE_VOICES[language];  // Use the current language
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!lessonData) {
    return (
      <div className="container mx-auto p-8 space-y-4">
        <textarea
          className="w-full h-64 p-4 border rounded-lg shadow-sm text-black"
          placeholder="Paste your lesson JSON here..."
          onChange={handleJsonInput}
        />
      </div>
    );
  }

  // Show mode selection after JSON is loaded
  if (!mode) {
    return (
      <div className="container mx-auto p-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-black mb-6 text-center">Choose Learning Mode</h2>
          <div className="space-y-4">
            <button
              onClick={() => {
                setMode('duolingo');
                const firstWord = lessonData!.sentences[0].word_pairs[0][1];
                const allTranslations = lessonData!.sentences[0].word_pairs.map(pair => pair[1]);
                generateOptions(firstWord, allTranslations, setOptions, 'words');
                speak(firstWord);
              }}
              className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Multiple Choice Mode
            </button>
            <button
              onClick={() => setMode('keyboard')}
              className="w-full p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Keyboard Mode (Type Answers)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'keyboard') {
    return (
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-black">Practice Typing</h1>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="px-4 py-2 bg-white border rounded text-black"
            >
              <option value="russian">Russian</option>
              <option value="ukrainian">Ukrainian</option>
              <option value="swedish">Swedish</option>
            </select>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-lg mb-4 text-black">
              {lessonData.sentences[currentSentenceIndex].sentence}
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-32 p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-black mb-4"
              placeholder="Type the translation..."
            />
            
            {/* Virtual Keyboard */}
            <div className="bg-gray-100 p-4 rounded-lg">
              {currentLayout.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-1 mb-1">
                  {row.map((key) => (
                    <button
                      key={key.cyrillic}
                      onClick={() => setText(prev => prev + (shift ? key.cyrillic.toUpperCase() : key.cyrillic))}
                      className="w-10 h-10 bg-white rounded shadow hover:bg-gray-50 active:bg-gray-200 flex items-center justify-center relative"
                    >
                      <span className="text-lg text-black">
                        {shift ? key.cyrillic.toUpperCase() : key.cyrillic}
                      </span>
                      {key.latin && (
                        <span className="text-xs text-gray-600 absolute bottom-0.5">
                          {key.latin}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
              
              <div className="flex justify-center mt-1">
                <button
                  onClick={() => setShift(!shift)}
                  className={`px-4 py-2 rounded text-black ${
                    shift ? 'bg-blue-500 text-white' : 'bg-white'
                  }`}
                >
                  Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Return existing Duolingo-style interface for mode === 'duolingo'
  const currentSentence = lessonData.sentences[currentSentenceIndex];

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto space-y-6 bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <div className="text-sm text-gray-500 mb-2">
            Sentence {currentSentenceIndex + 1} of {lessonData.sentences.length}
          </div>
          <div className="h-2 bg-gray-200 rounded">
            <div 
              className="h-2 bg-green-500 rounded"
              style={{ width: `${((currentSentenceIndex + 1) / lessonData.sentences.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="text-center mb-8">
          {stage === 'words' && (
            <div>
              <h2 className="text-xl mb-4">Translate this word:</h2>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold mb-4">{currentSentence.word_pairs[currentWordIndex][0]}</p>
                <button
                  onClick={() => speak(currentSentence.word_pairs[currentWordIndex][1])}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Listen"
                >
                  🔊
                </button>
              </div>
            </div>
          )}
          {stage === 'subsentences' && currentSentence.subsentences && currentSentence.subsentences.length > 0 && (
            <div>
              <h2 className="text-xl mb-4">Translate this phrase:</h2>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold mb-4">
                  {currentSentence.subsentences[currentSubsentenceIndex].subsentence}
                </p>
                <button
                  onClick={() => speak(currentSentence.subsentences![currentSubsentenceIndex].translation)}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Listen"
                >
                  🔊
                </button>
              </div>
            </div>
          )}
          {stage === 'fullsentence' && (
            <div>
              <h2 className="text-xl mb-4">Translate the full sentence:</h2>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold mb-4">{currentSentence.sentence}</p>
                <button
                  onClick={() => speak(currentSentence.translation)}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Listen"
                >
                  🔊
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {!showFeedback ? (
            <div className="grid grid-cols-1 gap-3">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => checkAnswer(option)}
                  className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 text-black"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div className={`p-4 mb-4 rounded-lg ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isCorrect ? 'Correct!' : 'Not quite. The correct answer is:'}
                {!isCorrect && (
                  <div className="font-bold mt-2">
                    {stage === 'words' 
                      ? currentSentence.word_pairs[currentWordIndex][1]
                      : stage === 'subsentences' && currentSentence.subsentences
                        ? currentSentence.subsentences[currentSubsentenceIndex].translation
                        : currentSentence.translation
                    }
                  </div>
                )}
              </div>
              <button
                onClick={nextItem}
                className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
