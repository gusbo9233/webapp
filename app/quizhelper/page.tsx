"use client"
import React, { useState, useEffect } from 'react';

interface Answer {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  code: string[] | null;
  answers: Answer[];
}

interface Progress {
  current_question: number;
  total_questions: number;
  correct_answers: number;
}

const QuizHelper = () => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const startQuiz = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/quiz/start', {
        method: 'POST'
      });
      const data = await response.json();
      setProgress(data.progress);
      fetchCurrentQuestion();
    } catch (error) {
      console.error('Error starting quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentQuestion = async () => {
    try {
      const response = await fetch('http://localhost:8000/quiz/current');
      const data = await response.json();
      
      if (data.message === 'Quiz completed') {
        setCurrentQuestion(null);
      } else {
        setCurrentQuestion(data.question);
        setProgress(data.progress);
      }
    } catch (error) {
      console.error('Error fetching question:', error);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer) return;

    try {
      const response = await fetch('http://localhost:8000/quiz/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer: selectedAnswer }),
      });
      
      const data = await response.json();
      setProgress(data.progress);
      
      if (data.correct) {
        if (data.next_question) {
          setCurrentQuestion(data.next_question);
        } else {
          setCurrentQuestion(null);
        }
        setSelectedAnswer('');
        // Add success message
        setMessages(prev => [...prev, {
          text: "Correct!",
          isUser: false
        }]);
      } else {
        // Add incorrect message and help message
        setMessages(prev => [
          ...prev,
          { text: "Incorrect, try again.", isUser: false },
          { text: data.help_message, isUser: false }
        ]);
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  useEffect(() => {
    startQuiz();
  }, []);

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    setMessages([...messages, { text: currentMessage, isUser: true }]);
    setCurrentMessage('');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 p-4 gap-4">
      {/* Question Panel */}
      <div className="w-1/2 bg-white rounded-lg shadow-lg p-6 flex flex-col">
        <div className="flex-grow">
          {currentQuestion ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-black">Question {progress?.current_question}</h2>
                <span className="text-gray-500">ID: {currentQuestion.id}</span>
              </div>

              <div className="mb-4 text-gray-600">
                Progress: {progress?.correct_answers} / {progress?.total_questions} correct
              </div>

              <p className="text-gray-700 mb-6">{currentQuestion.text}</p>

              {currentQuestion.code && (
                <pre className="bg-gray-100 p-4 rounded-lg mb-6 overflow-x-auto">
                  <code className="text-sm">
                    {currentQuestion.code.join('\n')}
                  </code>
                </pre>
              )}

              <div className="space-y-4">
                {currentQuestion.answers.map((answer) => (
                  <div key={answer.id} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id={`answer-${answer.id}`}
                      name="answer"
                      checked={selectedAnswer === answer.id}
                      onChange={() => setSelectedAnswer(answer.id)}
                      className="w-4 h-4"
                    />
                    <label 
                      htmlFor={`answer-${answer.id}`}
                      className="text-gray-700"
                    >
                      {answer.id.toUpperCase()}. {answer.text}
                    </label>
                  </div>
                ))}
              </div>

              <button
                onClick={submitAnswer}
                disabled={!selectedAnswer}
                className="w-full mt-6 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                Submit Answer
              </button>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-black mb-4">Quiz Completed!</h2>
              <p className="text-gray-700">
                You got {progress?.correct_answers} out of {progress?.total_questions} questions correct.
              </p>
              <button
                onClick={startQuiz}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Start New Quiz
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="w-1/2 bg-white rounded-lg shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-black">Chat Assistant</h2>
        </div>

        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-[80%] ${
                message.isUser
                  ? 'bg-blue-500 text-white ml-auto'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleMessageSubmit} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Ask a question..."
              className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizHelper;
