"use client";
import { useState, useCallback } from 'react';
import SectionFive from './SectionFive';

interface DroppedItem {
  displayName: string;
  indicatorCode: string;
}

interface RegressionResults {
  params: { [key: string]: number };
  pvalues: { [key: string]: number };
  conf_int: {
    [key: string]: {
      high: number;
      low: number;
    };
  };
  rsquared: number;
  rsquared_adj: number;
  fvalue: number;
  f_pvalue: number;
  nobs: number;
}

interface VariableData {
  displayName: string;
  indicatorCode: string;
  timeSeriesData: TimeSeriesData[];
}

interface TimeSeriesData {
  date: string;
  value: number;
}

export default function SectionThree({ 
  countryCode,
  variableMap,
  onRegressionResults
}: { 
  countryCode: string;
  variableMap: {[name: string]: VariableData};
  onRegressionResults: (results: RegressionResults, mapping?: {[name: string]: VariableData}) => void;
}) {
  const [xVariables, setXVariables] = useState<DroppedItem[]>([]);
  const [yVariable, setYVariable] = useState<DroppedItem | null>(null);
  const [isDraggingOverX, setIsDraggingOverX] = useState(false);
  const [isDraggingOverY, setIsDraggingOverY] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{item: DroppedItem, source: 'x' | 'y', index?: number} | null>(null);
  const [shouldRunRegression, setShouldRunRegression] = useState(false);
  const [regressionResults, setRegressionResults] = useState<RegressionResults | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget.dataset.dropzone;
    if (target === 'x') setIsDraggingOverX(true);
    if (target === 'y') setIsDraggingOverY(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget.dataset.dropzone;
    if (target === 'x') setIsDraggingOverX(false);
    if (target === 'y') setIsDraggingOverY(false);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>, source: 'x' | 'y', index?: number) => {
    if (!e.dataTransfer.dropEffect || e.dataTransfer.dropEffect === 'none') {
      if (source === 'x' && typeof index === 'number') {
        setXVariables(prev => prev.filter((_, i) => i !== index));
      } else if (source === 'y') {
        setYVariable(null);
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, type: 'x' | 'y') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverX(false);
    setIsDraggingOverY(false);

    try {
      let droppedItem: DroppedItem;
      const dataStr = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      const data = JSON.parse(dataStr);
      
      // Convert the incoming data to DroppedItem format
      droppedItem = {
        displayName: data.displayName || data.name,
        indicatorCode: data.indicatorCode
      };

      // Handle moving between containers
      if (draggedItem) {
        // Remove from source container
        if (draggedItem.source === 'x') {
          setXVariables(prev => prev.filter((_, i) => i !== draggedItem.index));
        } else if (draggedItem.source === 'y') {
          setYVariable(null);
        }
      }

      // Add to target container
      if (type === 'x') {
        if (!xVariables.some(item => item.indicatorCode === droppedItem.indicatorCode)) {
          setXVariables(prev => [...prev, droppedItem]);
        }
      } else if (type === 'y') {
        setYVariable(droppedItem);
      }

    } catch (err) {
      console.error('Error handling drop:', err);
    }
  }, [xVariables, draggedItem]);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, item: DroppedItem, sourceContainer: 'x' | 'y', index?: number) => {
    setDraggedItem({ item, source: sourceContainer, index });
    e.dataTransfer.setData('text/plain', JSON.stringify(item)); // Fallback for external drops
  }, []);

  const handleRegressionComplete = useCallback(() => {
    setShouldRunRegression(false);
  }, []);

  const runRegression = useCallback(async () => {
    if (!yVariable || xVariables.length === 0) return;

    try {
      const params = new URLSearchParams();
      params.append('y', yVariable.displayName);
      xVariables.forEach(x => params.append('x', x.displayName));
      
      const response = await fetch(`http://localhost:8000/run_regression?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Regression failed');
      }

      const results = await response.json();
      setRegressionResults(results);
      onRegressionResults(results);
    } catch (err) {
      console.error('Error running regression:', err);
    }
  }, [xVariables, yVariable, onRegressionResults]);

  return (
    <>
      <div className="bg-white shadow-md rounded-md p-6 text-black" id="section3">
        <h2 className="text-xl font-semibold mb-4">Regression Equation</h2>
        
        <div className="flex gap-4 mb-4">
          {/* X Variables Container */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">X Variables:</label>
            <div
              data-dropzone="x"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'x')}
              className={`min-h-[100px] border-2 ${
                isDraggingOverX ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'
              } rounded-md p-4 transition-colors`}
            >
              <div className="flex items-center flex-wrap gap-2">
                {xVariables.map((item, index) => (
                  <div 
                    key={`${item.indicatorCode}-${index}`}
                    className="flex items-center"
                    draggable
                    onDragStart={(e) => handleDragStart(e, item, 'x', index)}
                    onDragEnd={(e) => handleDragEnd(e, 'x', index)}
                  >
                    <div className="bg-white border border-gray-200 rounded-md p-2 cursor-move hover:bg-gray-50">
                      {item.displayName}
                    </div>
                    {index < xVariables.length - 1 && (
                      <span className="mx-2 text-lg font-medium">+</span>
                    )}
                  </div>
                ))}
                {xVariables.length === 0 && (
                  <p className="text-gray-500">Drop X variables here</p>
                )}
              </div>
            </div>
          </div>

          {/* Y Variable Container */}
          <div className="w-64">
            <label className="block text-sm font-medium mb-2">Y Variable:</label>
            <div
              data-dropzone="y"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'y')}
              className={`min-h-[100px] border-2 ${
                isDraggingOverY ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'
              } rounded-md p-4 transition-colors`}
            >
              {yVariable ? (
                <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, yVariable, 'y')}
                  onDragEnd={(e) => handleDragEnd(e, 'y')}
                  className="bg-white border border-gray-200 rounded-md p-2 cursor-move hover:bg-gray-50"
                >
                  {yVariable.displayName}
                </div>
              ) : (
                <p className="text-gray-500">Drop Y variable here</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={runRegression}
          disabled={!yVariable || xVariables.length === 0}
          className={`mt-4 px-4 py-2 rounded-md ${
            !yVariable || xVariables.length === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          Run Regression
        </button>
      </div>

      <SectionFive results={regressionResults} variableMap={variableMap} />
    </>
  );
}