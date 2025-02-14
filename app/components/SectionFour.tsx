"use client";
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface TimeSeriesData {
  year: string;
  value: number;
}

export default function SectionFour() {
  const [chartData, setChartData] = useState<TimeSeriesData[]>([]);
  const [variableName, setVariableName] = useState<string>('');

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      setVariableName(data.name);

      const response = await fetch(`http://localhost:8000/getTimeSeriesData/${encodeURIComponent(data.name)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch time series data');
      }
      const timeSeriesData = await response.json();
      setChartData(timeSeriesData);
    } catch (error) {
      console.error('Error loading time series:', error);
    }
  };

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="bg-white shadow-md rounded-md p-6"
    >
      <h2 className="text-xl font-semibold mb-4 text-black">Time Series Graph</h2>
      {chartData.length > 0 ? (
        <LineChart width={600} height={300} data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" name={variableName} stroke="#8884d8" />
        </LineChart>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg h-[300px] flex items-center justify-center text-gray-500">
          Drop a variable here to see its time series
        </div>
      )}
    </div>
  );
}
