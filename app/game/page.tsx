"use client";
import HexGrid from './components/HexGrid';

export default function GamePage() {
  return (
    <main className="min-h-screen">
      <h1 className="text-3xl font-bold p-4 absolute top-0 left-0 z-10 text-gray-800">
        Hex Game
      </h1>
      <HexGrid rows={8} cols={8} />
    </main>
  );
}
