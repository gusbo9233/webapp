"use client";
import { useState, useEffect } from 'react';

interface RegressionResults {
  params: { [key: string]: number };
  pvalues: { [key: string]: number };
  rsquared: number;
  rsquared_adj: number;
  fvalue: number;
  f_pvalue: number;
  nobs: number;
  conf_int: {
    [key: string]: {
      low: number;
      high: number;
    };
  };
}

interface SectionFiveProps {
  results: RegressionResults | null;
  variableMap: {[name: string]: VariableData};
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

export default function SectionFive({ results }: SectionFiveProps) {
  if (!results) return null;

  return (
    <section className="p-6 bg-white rounded-lg shadow mt-4">
      <h2 className="text-2xl font-bold mb-4 text-black">Regression Results</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-black">Model Statistics</h4>
            <p className="text-black">R-squared: {results.rsquared.toFixed(4)}</p>
            <p className="text-black">Adjusted R-squared: {results.rsquared_adj.toFixed(4)}</p>
            <p className="text-black">F-statistic: {results.fvalue.toFixed(4)}</p>
            <p className="text-black">F p-value: {results.f_pvalue.toFixed(4)}</p>
            <p className="text-black">Observations: {results.nobs}</p>
          </div>

          <div>
            <h4 className="font-semibold text-black">Coefficients</h4>
            {Object.entries(results.params).map(([variable, coefficient]) => (
              <div key={variable} className="mb-2">
                <p className="text-black">
                  {variable}: {coefficient.toFixed(4)}
                  <br />
                  <span className="text-sm text-gray-600">
                    p-value: {results.pvalues[variable].toFixed(4)}
                    <br />
                    95% CI: [{results.conf_int[variable].low.toFixed(4)}, {results.conf_int[variable].high.toFixed(4)}]
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 