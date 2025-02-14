"use client";
import { useState } from 'react';

interface Variable {
  name: string;
  countryCode: string;
  indicatorCode: string;
}

interface NameDialogProps {
  initialName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

const NameDialog = ({ initialName, onSave, onCancel }: NameDialogProps) => {
  const [name, setName] = useState(initialName);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-semibold mb-4 text-black">Enter Variable Name</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4 text-black"
          autoFocus
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100 text-black"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SectionTwo({ countryCode }: { countryCode: string }) {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [dropData, setDropData] = useState<any>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    setDropData(data);
    setShowDialog(true);
  };

  const handleSave = async (name: string) => {
    if (!dropData) return;

    const cleanIndicatorCode = dropData.indicatorCode.split(':')[0];

    try {
      const url = new URL('http://localhost:8000/getTimeSeries');
      url.searchParams.set('country_code', dropData.countryCode);
      url.searchParams.set('indicator_code', cleanIndicatorCode);
      url.searchParams.set('variable', name);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setVariables(prev => [...prev, {
        name,
        countryCode: dropData.countryCode,
        indicatorCode: dropData.indicatorCode
      }]);

      setShowDialog(false);
      setDropData(null);

    } catch (error) {
      console.error('Error storing time series:', error);
      alert('Failed to store time series. Please try again.');
    }
  };

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="bg-white shadow-md rounded-md p-6 flex-1"
    >
      <h2 className="text-xl font-semibold mb-4 text-black">Variables</h2>
      <div className="space-y-2">
        {variables.map((variable, index) => (
          <div 
            key={index} 
            className="p-2 bg-gray-50 rounded shadow"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify(variable));
            }}
          >
            <span className="text-black cursor-move">{variable.name}</span>
          </div>
        ))}
      </div>

      {showDialog && dropData && (
        <NameDialog
          initialName={dropData.name}
          onSave={handleSave}
          onCancel={() => {
            setShowDialog(false);
            setDropData(null);
          }}
        />
      )}
    </div>
  );
}