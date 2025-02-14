"use client";
import { useState, useCallback } from 'react';
import SectionOne from './components/SectionOne';
import SectionTwo from './components/SectionTwo';
import SectionThree from './components/SectionThree';
import SectionFour from './components/SectionFour';
import SectionFive from './components/SectionFive';
import SectionSix from './components/SectionSix';

interface TimeSeriesData {
  date: string;
  value: number;
}

interface VariableData {
  displayName: string;
  indicatorCode: string;
  timeSeriesData: TimeSeriesData[];
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

export default function Home() {
  const [countryCode, setCountryCode] = useState('');
  const [regressionResults, setRegressionResults] = useState<RegressionResults | null>(null);
  const [variableMap, setVariableMap] = useState<{[name: string]: VariableData}>({});

  const handleVariableAdd = useCallback((name: string, data: VariableData) => {
    setVariableMap(prev => ({...prev, [name]: data}));
  }, []);

  return (
    <main className="container mx-auto p-4 space-y-4">
      <SectionOne onCountrySelect={setCountryCode} />
      <div className="grid md:grid-cols-2 gap-4">
        <SectionTwo 
          countryCode={countryCode}
        />
        <SectionThree 
          countryCode={countryCode}
          onRegressionResults={(results, mapping) => {
            setRegressionResults(results);
            if (mapping) {
              setVariableMap(mapping);
            }
          }}
          variableMap={variableMap}
        />
      </div>
      <SectionSix />
      <SectionFour />
      <SectionFive 
        results={regressionResults}
        variableMap={variableMap}
      />
    </main>
  );
}
