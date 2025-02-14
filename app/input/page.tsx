"use client";
import { useState } from 'react';

export default function InputPage() {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle the text submission here
    console.log('Submitted text:', text);
  };

  return (
    <main className="container mx-auto p-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Text Analysis</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="text-input" 
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              Enter your text:
            </label>
            <textarea
              id="text-input"
              rows={15}
              className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type or paste your text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          
          <div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Analyze Text
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 