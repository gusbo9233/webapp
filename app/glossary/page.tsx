"use client";
import { useState, useEffect } from 'react';
import UkrainianKeyboard from '../components/UkrainianKeyboard';

interface WordPair {
  word: string;
  translation: string;
}

interface Quiz {
  name: string;
  words: WordPair[];
  wordLanguage: string;
  translationLanguage: string;
  wordLangCode: string;
  translationLangCode: string;
}

export default function Glossary() {
  const [mode, setMode] = useState<'create' | 'practice'>('create');
  const [practiceType, setPracticeType] = useState<'typing' | 'multiple' | 'sound'>('typing');
  const [numChoices, setNumChoices] = useState(4);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [newWord, setNewWord] = useState<WordPair>({ word: '', translation: '' });
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [typingFeedback, setTypingFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [multipleFeedback, setMultipleFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [soundFeedback, setSoundFeedback] = useState<'correct' | null>(null);
  const [newQuizName, setNewQuizName] = useState('');
  const [wordLanguage, setWordLanguage] = useState('');
  const [translationLanguage, setTranslationLanguage] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [choices, setChoices] = useState<string[]>([]);
  const [soundPairs, setSoundPairs] = useState<Array<{index: number, word: string, translation: string}>>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [isReversed, setIsReversed] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [isSequential, setIsSequential] = useState(false);
  const [lastPlayedSound, setLastPlayedSound] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [incorrectMatch, setIncorrectMatch] = useState<string | null>(null);

  const languageOptions = [
    { name: 'English', code: 'en-US' },
    { name: 'Ukrainian', code: 'uk-UA' },
    { name: 'Spanish', code: 'es-ES' },
    { name: 'French', code: 'fr-FR' },
    { name: 'German', code: 'de-DE' },
    { name: 'Italian', code: 'it-IT' },
    { name: 'Japanese', code: 'ja-JP' },
    { name: 'Korean', code: 'ko-KR' },
    { name: 'Chinese', code: 'zh-CN' },
    { name: 'Russian', code: 'ru-RU' },
    { name: 'Portuguese', code: 'pt-PT' },
    { name: 'Dutch', code: 'nl-NL' },
    { name: 'Estonian', code: 'et-EE' },
  ];

  // Load quizzes from localStorage on mount
  useEffect(() => {
    const savedQuizzes = localStorage.getItem('wordQuizzes');
    if (savedQuizzes) {
      setQuizzes(JSON.parse(savedQuizzes));
    }
  }, []);

  // Save quizzes to localStorage when updated
  useEffect(() => {
    localStorage.setItem('wordQuizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  const handleAddWord = () => {
    if (!newWord.word || !newWord.translation || !selectedQuiz) return;

    const updatedQuizzes = quizzes.map(quiz => 
      quiz.name === selectedQuiz.name
        ? { ...quiz, words: [...quiz.words, newWord] }
        : quiz
    );

    setQuizzes(updatedQuizzes);
    setSelectedQuiz(prev => prev ? { ...prev, words: [...prev.words, newWord] } : null);
    setNewWord({ word: '', translation: '' });
  };

  const handleBulkAdd = () => {
    if (!selectedQuiz) return;

    const pairs = bulkInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.includes('-'))
      .map(line => {
        const [word, translation] = line.split('-').map(part => part.trim());
        return { word, translation };
      })
      .filter(pair => pair.word && pair.translation);

    if (pairs.length === 0) return;

    const updatedQuizzes = quizzes.map(quiz =>
      quiz.name === selectedQuiz.name
        ? { ...quiz, words: [...quiz.words, ...pairs] }
        : quiz
    );

    setQuizzes(updatedQuizzes);
    setSelectedQuiz(prev => prev ? { ...prev, words: [...prev.words, ...pairs] } : null);
    setBulkInput('');
  };

  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizName || quizzes.some(q => q.name === newQuizName)) {
      alert('Please enter a unique quiz name');
      return;
    }
    if (!wordLanguage || !translationLanguage) {
      alert('Please specify both languages');
      return;
    }

    const wordLang = languageOptions.find(l => l.name === wordLanguage);
    const translationLang = languageOptions.find(l => l.name === translationLanguage);

    if (!wordLang || !translationLang) {
      alert('Please select valid languages from the list');
      return;
    }

    const newQuiz = { 
      name: newQuizName, 
      words: [],
      wordLanguage: wordLang.name,
      translationLanguage: translationLang.name,
      wordLangCode: wordLang.code,
      translationLangCode: translationLang.code
    };
    setQuizzes([...quizzes, newQuiz]);
    setSelectedQuiz(newQuiz);
    setNewQuizName('');
    setWordLanguage('');
    setTranslationLanguage('');
  };

  const getCurrentWord = () => {
    if (!selectedQuiz) return '';
    const pair = selectedQuiz.words[currentWordIndex];
    return isReversed ? pair.translation : pair.word;
  };

  const getCurrentTranslation = () => {
    if (!selectedQuiz) return '';
    const pair = selectedQuiz.words[currentWordIndex];
    return isReversed ? pair.word : pair.translation;
  };

  const getCurrentLangCode = () => {
    if (!selectedQuiz) return '';
    return isReversed ? selectedQuiz.translationLangCode : selectedQuiz.wordLangCode;
  };

  const getCurrentTranslationLangCode = () => {
    if (!selectedQuiz) return '';
    return isReversed ? selectedQuiz.wordLangCode : selectedQuiz.translationLangCode;
  };

  const generateChoices = () => {
    if (!selectedQuiz) return;
    
    // Get the correct answer for the current word
    const correctAnswer = getCurrentTranslation();
    
    // Get all possible translations as choices, excluding the current word's translation
    const otherWords = selectedQuiz.words
      .filter((_, idx) => idx !== currentWordIndex)
      .map(w => isReversed ? w.word : w.translation);
    
    // Shuffle and take n-1 wrong answers
    const wrongAnswers = otherWords
      .sort(() => Math.random() - 0.5)
      .slice(0, numChoices - 1);
    
    // Make sure the correct answer is included in the choices
    const allChoices = [...wrongAnswers];
    const randomPosition = Math.floor(Math.random() * numChoices);
    allChoices.splice(randomPosition, 0, correctAnswer);
    
    // If we don't have enough wrong answers, trim the array to match numChoices
    while (allChoices.length > numChoices) {
      const indexToRemove = allChoices.findIndex(choice => choice !== correctAnswer);
      if (indexToRemove !== -1) {
        allChoices.splice(indexToRemove, 1);
      }
    }
    
    setChoices(allChoices);
  };

  const generateSoundPairs = () => {
    if (!selectedQuiz || selectedQuiz.words.length === 0) return;
    
    // Get up to 6 random words from the quiz
    const numPairs = Math.min(6, selectedQuiz.words.length);
    const indices = Array.from({ length: selectedQuiz.words.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, numPairs);
    
    // Create pairs with original indices
    const pairs = indices.map(index => ({
      index,
      word: isReversed ? selectedQuiz.words[index].translation : selectedQuiz.words[index].word,
      translation: isReversed ? selectedQuiz.words[index].word : selectedQuiz.words[index].translation
    }));
    
    setSoundPairs(pairs);
    
    // Create shuffled choices while maintaining the mapping
    const shuffledChoices = [...pairs]
      .sort(() => Math.random() - 0.5)
      .map(pair => pair.translation);
    setChoices(shuffledChoices);
  };

  const handleSoundPlay = (index: number) => {
    const pair = soundPairs[index];
    if (pair) {
      speak(pair.word, getCurrentLangCode());
      setLastPlayedSound(index);
      setSelectedWord(null);
      setIncorrectMatch(null);
    }
  };

  const handleSoundMatchSelect = (choice: string, translationIndex: number) => {
    if (!selectedQuiz) return;
    setSelectedWord(choice);
    
    if (lastPlayedSound === null) return;
    const matchingPair = soundPairs.find(pair => pair.index === translationIndex);
    if (!matchingPair || lastPlayedSound !== soundPairs.findIndex(p => p.index === translationIndex)) {
      // Show error feedback for 1 second
      setIncorrectMatch(choice);
      setTimeout(() => {
        setIncorrectMatch(null);
      }, 1000);
      return;
    }
    
    const isCorrect = choice === matchingPair.translation;
    if (isCorrect) {
      const newMatched = new Set(matchedPairs);
      newMatched.add(translationIndex);
      setMatchedPairs(newMatched);
      
      if (newMatched.size === soundPairs.length) {
        setTimeout(() => {
          startNewSoundSet();
        }, 1000);
      }
    }
    setLastPlayedSound(null);
  };

  const startNewSoundSet = () => {
    generateSoundPairs();
    setMatchedPairs(new Set());
    setSoundFeedback(null);
    setLastPlayedSound(null);
    setSelectedWord(null);
    setIncorrectMatch(null);
  };

  useEffect(() => {
    if (mode === 'practice') {
      if (practiceType === 'multiple') {
        generateChoices();
      } else if (practiceType === 'sound') {
        startNewSoundSet();
      }
    }
  }, [selectedQuiz, mode, practiceType]);

  const handleNextWord = () => {
    if (!selectedQuiz) return;
    setUserAnswer('');
    setTypingFeedback(null);
    setMultipleFeedback(null);
    
    if (isSequential) {
      // In sequential mode, just go to the next word
      setCurrentWordIndex((prev) => 
        prev < selectedQuiz.words.length - 1 ? prev + 1 : 0
      );
    } else {
      // In random mode, pick a random word
      const nextIndex = Math.floor(Math.random() * selectedQuiz.words.length);
      setCurrentWordIndex(nextIndex);
    }
    
    if (practiceType === 'multiple') {
      generateChoices();
    }
  };

  // Add new useEffect to handle currentWordIndex changes
  useEffect(() => {
    if (mode === 'practice' && practiceType === 'multiple') {
      generateChoices();
    }
  }, [currentWordIndex, isReversed]);

  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz) return;

    const correctAnswer = getCurrentTranslation();
    const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    setTypingFeedback(isCorrect ? 'correct' : 'incorrect');
  };

  const handleMultipleChoiceSelect = (choice: string) => {
    if (!selectedQuiz || multipleFeedback) return;
    const correctAnswer = getCurrentTranslation();
    const isCorrect = choice === correctAnswer;
    setUserAnswer(choice);
    setMultipleFeedback(isCorrect ? 'correct' : 'incorrect');
  };

  const handleDeleteQuiz = (quizName: string) => {
    setQuizzes(quizzes.filter(q => q.name !== quizName));
    if (selectedQuiz?.name === quizName) {
      setSelectedQuiz(null);
    }
  };

  const handleKeyPress = (key: string) => {
    if (mode === 'create') {
      const newTranslation = newWord.translation + key;
      setNewWord({ ...newWord, translation: newTranslation });
    } else {
      const newAnswer = userAnswer + key;
      setUserAnswer(newAnswer);
    }
  };

  const speak = async (text: string, langCode: string) => {
    // Use Tartu NLP API for Estonian
    if (langCode === 'et-EE') {
      try {
        const response = await fetch('https://api.tartunlp.ai/text-to-speech/v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            speaker: "mari", // Using mari as default Estonian voice
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get audio from Tartu NLP API');
        }

        const blob = await response.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play();
      } catch (error) {
        console.error('Error using Tartu NLP TTS:', error);
        // Fallback to browser TTS if API fails
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        window.speechSynthesis.speak(utterance);
      }
    } else {
      // Use browser TTS for other languages
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;

      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find a voice for the specific language code first
      let voice = voices.find(v => v.lang === langCode);
      
      // If no exact match, try to find a voice that starts with the language code
      if (!voice) {
        voice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
      }
      
      if (voice) {
        utterance.voice = voice;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  // Initialize voices (needed for some browsers)
  useEffect(() => {
    const initVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = initVoices;
    }
    
    initVoices();
  }, []);

  // Update the practice type change handler
  const handlePracticeTypeChange = (newType: 'typing' | 'multiple' | 'sound') => {
    setPracticeType(newType);
    setUserAnswer('');
    setTypingFeedback(null);
    setMultipleFeedback(null);
    setSoundFeedback(null);
    setMatchedPairs(new Set());
    if (newType === 'multiple') {
      generateChoices();
    } else if (newType === 'sound') {
      startNewSoundSet();
    }
  };

  // Update the language direction toggle
  const handleLanguageToggle = () => {
    setIsReversed(!isReversed);
    setUserAnswer('');
    setTypingFeedback(null);
    setMultipleFeedback(null);
    setSoundFeedback(null);
    setMatchedPairs(new Set());
    if (practiceType === 'multiple') {
      generateChoices();
    } else if (practiceType === 'sound') {
      startNewSoundSet();
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">Word Quiz</h1>
          <div className="space-x-4">
            <button
              onClick={() => {
                setMode('create');
                setTypingFeedback(null);
                setMultipleFeedback(null);
                setSoundFeedback(null);
                setUserAnswer('');
                setSelectedQuiz(null);
              }}
              className={`px-4 py-2 rounded font-bold ${
                mode === 'create' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-black text-white'
              }`}
            >
              Create
            </button>
            <button
              onClick={() => {
                setMode('practice');
                setTypingFeedback(null);
                setMultipleFeedback(null);
                setSoundFeedback(null);
                setUserAnswer('');
                setCurrentWordIndex(0);
                setSelectedQuiz(null);
              }}
              className={`px-4 py-2 rounded font-bold ${
                mode === 'practice' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-black text-white'
              }`}
            >
              Practice
            </button>
          </div>
        </div>

        {mode === 'create' ? (
          <div className="bg-blue-50 rounded-lg shadow-lg p-6 border-2 border-blue-200">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-black">Quizzes</h2>
            </div>

            {!selectedQuiz ? (
              <>
                {quizzes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {quizzes.map((quiz) => (
                      <div 
                        key={quiz.name}
                        className="p-4 bg-white rounded-lg border-2 border-blue-200"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-black">{quiz.name}</h3>
                            <p className="text-sm text-gray-600">
                              {quiz.wordLanguage} → {quiz.translationLanguage}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuiz(quiz.name);
                            }}
                            className="text-red-600 hover:text-red-700 font-bold px-2"
                          >
                            ×
                          </button>
                        </div>
                        <div className="text-gray-600 mb-3">
                          {quiz.words.length} words
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedQuiz(quiz)}
                            className="flex-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setMode('practice');
                              setSelectedQuiz(quiz);
                              setCurrentWordIndex(0);
                            }}
                            className="flex-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-bold"
                          >
                            Practice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No quizzes yet. Create your first quiz!
                  </div>
                )}

                <form onSubmit={handleCreateQuiz} className="mt-6 p-4 border-2 border-dashed border-blue-200 rounded-lg">
                  <h3 className="text-lg font-bold mb-4 text-black">Create New Quiz</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newQuizName}
                      onChange={(e) => setNewQuizName(e.target.value)}
                      placeholder="Enter quiz name"
                      className="w-full p-2 border-2 border-blue-200 rounded font-semibold text-lg bg-white text-black"
                    />
                    <div className="flex gap-2">
                      <select
                        value={wordLanguage}
                        onChange={(e) => setWordLanguage(e.target.value)}
                        className="flex-1 p-2 border-2 border-blue-200 rounded font-semibold text-lg bg-white text-black"
                      >
                        <option value="">Select word language</option>
                        {languageOptions.map(lang => (
                          <option key={lang.code} value={lang.name}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={translationLanguage}
                        onChange={(e) => setTranslationLanguage(e.target.value)}
                        className="flex-1 p-2 border-2 border-blue-200 rounded font-semibold text-lg bg-white text-black"
                      >
                        <option value="">Select translation language</option>
                        {languageOptions.map(lang => (
                          <option key={lang.code} value={lang.name}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-black">Quiz: {selectedQuiz.name}</h2>
                    <p className="text-sm text-gray-600">
                      {selectedQuiz.wordLanguage} → {selectedQuiz.translationLanguage}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedQuiz(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-bold"
                  >
                    Back to Quizzes
                  </button>
                </div>

                <div className="flex gap-2 mb-4">
                  <div className="flex-grow space-y-2">
                    <input
                      type="text"
                      name="word"
                      value={newWord.word}
                      onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                      placeholder="Word"
                      className="w-full p-2 border-2 border-blue-200 rounded font-semibold text-lg bg-white text-black"
                    />
                    <input
                      type="text"
                      name="translation"
                      value={newWord.translation}
                      onChange={(e) => setNewWord({ ...newWord, translation: e.target.value })}
                      placeholder="Translation"
                      className="w-full p-2 border-2 border-blue-200 rounded font-semibold text-lg bg-white text-black"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleAddWord}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
                    >
                      Add Word
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowKeyboard(!showKeyboard)}
                      className="px-4 py-2 bg-black text-white rounded font-bold"
                    >
                      {showKeyboard ? 'Hide' : 'Show'} Keyboard
                    </button>
                  </div>
                </div>
                {showKeyboard && <UkrainianKeyboard onKeyPress={handleKeyPress} />}

                <div className="mt-6 border-t-2 border-blue-200 pt-6">
                  <h3 className="text-lg font-bold mb-2 text-black">Bulk Add Words</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter word pairs, one per line, separated by a hyphen (-).
                    <br />
                    Example:
                    <br />
                    word1-translation1
                    <br />
                    word2-translation2
                  </p>
                  <div className="flex gap-2">
                    <textarea
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      placeholder="Enter word pairs..."
                      className="flex-grow p-2 border-2 border-blue-200 rounded font-semibold text-lg bg-white text-black min-h-[150px]"
                    />
                    <button
                      onClick={handleBulkAdd}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold self-start"
                    >
                      Add All
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-xl font-bold mb-2 text-black">Words in {selectedQuiz.name}:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedQuiz.words.map((pair, index) => (
                      <div key={index} className="p-2 bg-white border-2 border-blue-200 rounded font-bold text-black">
                        {pair.word} - {pair.translation}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg shadow-lg p-6 border-2 border-blue-200">
            {!selectedQuiz ? (
              <>
                <h2 className="text-xl font-bold mb-6 text-black">Select a Quiz to Practice</h2>
                {quizzes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {quizzes.map((quiz) => (
                      <div 
                        key={quiz.name}
                        onClick={() => {
                          setMode('practice');
                          setSelectedQuiz(quiz);
                          setCurrentWordIndex(0);
                          setIsSequential(false);
                        }}
                        className="p-4 bg-white rounded-lg border-2 border-blue-200 hover:border-blue-400 cursor-pointer"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-black">{quiz.name}</h3>
                            <p className="text-sm text-gray-600">
                              {quiz.wordLanguage} → {quiz.translationLanguage}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuiz(quiz.name);
                            }}
                            className="text-red-600 hover:text-red-700 font-bold px-2"
                          >
                            ×
                          </button>
                        </div>
                        <div className="text-gray-600">
                          {quiz.words.length} words
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No quizzes available. Create a quiz first!
                  </div>
                )}
              </>
            ) : selectedQuiz.words.length > 0 ? (
              <div className="text-center">
                <div className="mb-4 flex flex-col items-center gap-4">
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handlePracticeTypeChange('typing')}
                      className={`px-4 py-2 rounded font-bold ${
                        practiceType === 'typing' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-black text-white'
                      }`}
                    >
                      Typing
                    </button>
                    <button
                      onClick={() => handlePracticeTypeChange('multiple')}
                      className={`px-4 py-2 rounded font-bold ${
                        practiceType === 'multiple' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-black text-white'
                      }`}
                    >
                      Multiple Choice
                    </button>
                    <button
                      onClick={() => handlePracticeTypeChange('sound')}
                      className={`px-4 py-2 rounded font-bold ${
                        practiceType === 'sound' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-black text-white'
                      }`}
                    >
                      Sound Matching
                    </button>
                  </div>

                  <button
                    onClick={handleLanguageToggle}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold flex items-center gap-2"
                  >
                    <span>{isReversed ? selectedQuiz.translationLanguage : selectedQuiz.wordLanguage}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{isReversed ? selectedQuiz.wordLanguage : selectedQuiz.translationLanguage}</span>
                  </button>

                  <button
                    onClick={() => setIsSequential(!isSequential)}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-bold flex items-center gap-2"
                  >
                    <span>{isSequential ? "Sequential" : "Random"} Order</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      {isSequential ? (
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      )}
                    </svg>
                  </button>
                </div>

                <div className="mb-8">
                  {practiceType === 'sound' ? (
                    <div className="text-center">
                      <div className="mb-8">
                        <div className="grid grid-cols-2 gap-6 mb-6">
                          {/* Left column: Sound buttons */}
                          <div className="space-y-4">
                            {soundPairs.map((pair, idx) => (
                              <div key={`sound-${idx}`} className="flex items-center justify-center">
                                <button
                                  onClick={() => handleSoundPlay(idx)}
                                  className={`p-3 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg w-full transition-colors ${
                                    matchedPairs.has(pair.index) ? 'bg-green-100' : ''
                                  } ${lastPlayedSound === idx ? 'ring-2 ring-blue-500 bg-blue-200' : ''}`}
                                  title={`Listen to word ${idx + 1}`}
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    </svg>
                                    <span>Word {idx + 1}</span>
                                  </div>
                                </button>
                              </div>
                            ))}
                          </div>
                          
                          {/* Right column: Word choices */}
                          <div className="space-y-4">
                            {choices.map((choice, idx) => {
                              const matchingPair = soundPairs.find(pair => pair.translation === choice);
                              if (!matchingPair) return null;
                              
                              return (
                                <button
                                  key={`choice-${idx}`}
                                  onClick={() => handleSoundMatchSelect(choice, matchingPair.index)}
                                  disabled={matchedPairs.has(matchingPair.index)}
                                  className={`p-3 w-full text-lg font-bold rounded-lg transition-colors ${
                                    matchedPairs.has(matchingPair.index)
                                      ? 'bg-green-500 text-white'
                                      : incorrectMatch === choice
                                        ? 'bg-red-200 text-black'
                                        : selectedWord === choice
                                          ? 'bg-blue-200 text-black'
                                          : 'bg-white text-black hover:bg-blue-100'
                                  }`}
                                >
                                  {choice}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4">Match each sound with its corresponding word</p>
                        
                        {soundFeedback === 'correct' && (
                          <div className="mt-4">
                            <p className="text-xl font-bold text-green-600 mb-4">
                              Great job! Loading next set...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <button
                          onClick={() => speak(
                            getCurrentWord(),
                            getCurrentLangCode()
                          )}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full"
                          title={`Listen in ${isReversed ? selectedQuiz.translationLanguage : selectedQuiz.wordLanguage}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        </button>
                        <h2 className="text-3xl font-bold text-black">
                          {getCurrentWord()}
                        </h2>
                      </div>

                      {typingFeedback && (
                        <div className={`mt-4 text-xl font-bold ${
                          typingFeedback === 'correct' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {typingFeedback === 'correct' ? (
                            'Correct!'
                          ) : (
                            <>
                              Incorrect. The correct answer is:{' '}
                              <span className="text-blue-600">
                                {getCurrentTranslation()}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {practiceType === 'typing' ? (
                        <form onSubmit={handleCheckAnswer} className="space-y-4">
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={userAnswer}
                              onChange={(e) => setUserAnswer(e.target.value)}
                              placeholder="Type the translation..."
                              className="w-full p-3 border-2 border-blue-200 rounded text-xl font-bold bg-white text-black"
                              autoFocus
                            />
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => setShowKeyboard(!showKeyboard)}
                                className="px-4 py-2 bg-black text-white rounded font-bold"
                              >
                                {showKeyboard ? 'Hide' : 'Show'} Keyboard
                              </button>
                            </div>
                          </div>
                          {showKeyboard && <UkrainianKeyboard onKeyPress={handleKeyPress} />}
                          <button
                            type="submit"
                            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-bold text-lg"
                          >
                            Check Answer
                          </button>
                        </form>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {choices.map((choice, index) => (
                            <button
                              key={index}
                              onClick={() => handleMultipleChoiceSelect(choice)}
                              disabled={multipleFeedback !== null}
                              className={`p-4 text-lg font-bold rounded-lg transition-colors ${
                                multipleFeedback !== null
                                  ? choice === selectedQuiz.words[currentWordIndex].translation
                                    ? 'bg-green-500 text-white'
                                    : choice === userAnswer
                                      ? 'bg-red-500 text-white'
                                      : 'bg-gray-200 text-black'
                                  : 'bg-white text-black hover:bg-blue-100'
                              }`}
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      )}

                      {multipleFeedback && (
                        <div className={`mt-4 text-xl font-bold ${
                          multipleFeedback === 'correct' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {multipleFeedback === 'correct' ? (
                            'Correct!'
                          ) : (
                            <>
                              Incorrect. The correct answer is:{' '}
                              <span className="text-blue-600">
                                {getCurrentTranslation()}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleNextWord}
                        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold text-lg"
                      >
                        Next Word
                      </button>
                      <div className="mt-4 font-bold text-black">
                        Word {currentWordIndex + 1} of {selectedQuiz.words.length}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-black text-xl font-bold">
                Select a quiz to practice or create a new one.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
