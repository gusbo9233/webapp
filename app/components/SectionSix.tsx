"use client";
import { useState, useEffect } from 'react';

interface TimeSeriesData {
  year: string;
  value: number | null;
}

interface EditableData {
  name: string;
  indicatorCode: string;
  data: TimeSeriesData[];
}

export default function SectionSix() {
  const [editableData, setEditableData] = useState<EditableData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      const response = await fetch(`http://localhost:8000/getTimeSeriesData/${data.name}`);
      if (!response.ok) throw new Error('Failed to fetch time series data');
      
      const timeSeriesData = await response.json();
      
      setEditableData({
        name: data.name,
        indicatorCode: data.indicatorCode,
        data: timeSeriesData
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading data for editing:', error);
    }
  };

  const handleValueChange = (index: number, value: string) => {
    if (!editableData) return;

    const newValue = value === '' ? null : parseFloat(value);
    const newData = [...editableData.data];
    newData[index] = {
      ...newData[index],
      value: newValue
    };

    setEditableData({
      ...editableData,
      data: newData
    });
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!editableData || !hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      // Save each changed value
      for (const item of editableData.data) {
        const response = await fetch('http://localhost:8000/update_cell', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            variable_name: editableData.name,
            new_value: item.value === null ? null : item.value,
            year: item.year
          })
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Server response:', error);
          throw new Error(error.error || `Failed to update cell for year ${item.year}`);
        }
      }

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save some changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="bg-white shadow-md rounded-md p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-black">Edit Data</h2>
        {editableData && (
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-4 py-2 rounded ${
              hasUnsavedChanges && !isSaving
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}
          </button>
        )}
      </div>
      
      {editableData ? (
        <div>
          <h3 className="text-lg font-medium mb-3 text-black">{editableData.name}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editableData.data.map((item, index) => (
                  <tr key={item.year}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <input
                        type="number"
                        value={item.value === null ? '' : item.value}
                        onChange={(e) => handleValueChange(index, e.target.value)}
                        className="border rounded px-2 py-1 w-32 text-black"
                        placeholder="No data"
                        disabled={isSaving}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg h-[300px] flex items-center justify-center text-gray-500">
          Drop a variable here to edit its data
        </div>
      )}
    </div>
  );
} 