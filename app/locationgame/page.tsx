"use client";
import Link from 'next/link';

export default function LocationGame() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8">Location Learning Game</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/locationgame/scenes/airport" 
                className="p-6 bg-blue-50 rounded-lg shadow-lg border-2 border-blue-200 hover:border-blue-400">
            <h2 className="text-xl font-bold text-black mb-2">Airport Scene</h2>
            <p className="text-gray-600">Practice vocabulary and phrases related to airport situations.</p>
          </Link>
          
          <Link href="/locationgame/scenes/grocerystore"
                className="p-6 bg-blue-50 rounded-lg shadow-lg border-2 border-blue-200 hover:border-blue-400">
            <h2 className="text-xl font-bold text-black mb-2">Grocery Store Scene</h2>
            <p className="text-gray-600">Learn common words and expressions used in a grocery store.</p>
          </Link>
        </div>
      </div>
    </div>
  );
} 