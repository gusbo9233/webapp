"use client";
import { useState, FormEvent, useEffect } from 'react';

export default function SectionOne({ onCountrySelect }: { onCountrySelect: (code: string) => void }) {
  const [inputValue, setInputValue] = useState('SWE');
  const [searchValue, setSearchValue] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onCountrySelect(inputValue);
    fetchIndicators(inputValue);
  }, []);

  const fetchIndicators = async (countryCode: string) => {
    try {
      const response = await fetch(`http://localhost:8000/getIndicators?country_code=${encodeURIComponent(countryCode)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to connect to the server. Please ensure the backend is running.");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    if (inputValue.trim()) {
      onCountrySelect(inputValue.trim());
      await fetchIndicators(inputValue);
    }
  };

  const handleItemClick = (item: string) => {
    setSelectedItem(item);
  };

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, item: string) => {
    const dragData = {
      name: item,
      countryCode: inputValue,
      indicatorCode: item
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
  };

  const filteredItems = items.filter(item =>
    item.toLowerCase().includes(searchValue.toLowerCase())
  );

  const storeTimeSeries = async (variable: string, countryCode: string, indicatorCode: string) => {
    try {
      const response = await fetch(`/api/getTimeSeries?country_code=${countryCode}&indicator_code=${indicatorCode}&variable=${variable}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to store time series');
      }
    } catch (error) {
      console.error('Error storing time series:', error);
      // Handle error (maybe show a notification to user)
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    
    // Call the backend to store the time series
    await storeTimeSeries(
      data.variable,
      data.countryCode,
      data.indicatorCode
    );
  };

  return (
    <div className="bg-white shadow-md rounded-md p-6 mb-4 md:mb-0 flex-1" id="section1">
      <h2 className="text-xl font-semibold mb-4 text-black">Fetch Indicators</h2>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label 
            htmlFor="user_input" 
            className="block text-black mb-2"
          >
            Country Code:
          </label>
          <input 
            type="text" 
            id="user_input" 
            name="user_input" 
            required
            placeholder="Enter country code (e.g., SWE)" 
            className="w-full border border-gray-300 rounded-md p-2 text-black placeholder-black/60"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>
        <div>
          <button 
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Fetch Indicators
          </button>
        </div>
      </form>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label 
          htmlFor="search_input" 
          className="block text-black mb-2"
        >
          Search Indicators:
        </label>
        <input 
          type="text" 
          id="search_input" 
          placeholder="Search indicators..." 
          className="w-full border border-gray-300 rounded-md p-2 text-black placeholder-black/60"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredItems.map((item, index) => (
            <li 
              key={index}
              onClick={() => handleItemClick(item)}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              className={`p-3 cursor-pointer hover:bg-gray-50 text-black ${
                selectedItem === item ? 'bg-blue-50' : ''
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
      {selectedItem && (
        <p className="mt-4 text-black">
          Selected: {selectedItem}
        </p>
      )}
    </div>
  );
}
