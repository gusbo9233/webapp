"use client";
import { useState, useEffect } from 'react';

interface Content {
  [key: string]: string;
}

interface DeclensionRow {
  case: string;
  masculine: string;
  feminine: string;
  neuter: string;
  plural: string;
}

interface Example {
  sentence: string;
  translation: string;
  note?: string;
}

interface Subsection {
  title: string;
  content: Content | DeclensionRow[];
}

interface Section {
  title: string;
  description?: string;
  subsections?: Subsection[];
  examples?: Example[];
}

interface WordData {
  title: string;
  sections: Section[];
}

export default function WordLearner() {
  const [data, setData] = useState<WordData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/ukrainian-explainations/index.json');
        const data = await response.json();
        setData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">No data found</div>
      </div>
    );
  }

  const renderContent = (content: Content | DeclensionRow[]) => {
    if (Array.isArray(content)) {
      // Render declension table
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Case</th>
                <th className="px-4 py-2 text-left">Masculine</th>
                <th className="px-4 py-2 text-left">Feminine</th>
                <th className="px-4 py-2 text-left">Neuter</th>
                <th className="px-4 py-2 text-left">Plural</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {content.map((row, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 font-medium">{row.case}</td>
                  <td className="px-4 py-2">{row.masculine}</td>
                  <td className="px-4 py-2">{row.feminine}</td>
                  <td className="px-4 py-2">{row.neuter}</td>
                  <td className="px-4 py-2">{row.plural}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      // Render gender forms
      return (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(content).map(([key, value]) => (
            <div key={key} className="bg-gray-50 p-3 rounded">
              <span className="font-medium capitalize">{key}:</span>{' '}
              <span className="text-blue-600">{value}</span>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">{data.title}</h1>
        
        {data.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              {section.title}
            </h2>
            
            {section.description && (
              <p className="text-gray-600 mb-6">{section.description}</p>
            )}

            {section.subsections?.map((subsection, subIndex) => (
              <div key={subIndex} className="mb-6">
                <h3 className="text-xl font-medium mb-4 text-gray-700">
                  {subsection.title}
                </h3>
                {renderContent(subsection.content)}
              </div>
            ))}

            {section.examples && (
              <div className="space-y-4">
                {section.examples.map((example, exIndex) => (
                  <div key={exIndex} className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-lg text-blue-600 mb-1">{example.sentence}</p>
                    <p className="text-gray-600">{example.translation}</p>
                    {example.note && (
                      <p className="text-sm text-gray-500 mt-1">Note: {example.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
