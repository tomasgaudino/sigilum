import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BottleneckAnalysis } from '../types';

interface BottleneckChartProps {
  data: BottleneckAnalysis[];
  type?: 'bar' | 'pie';
}

const COLORS = [
  '#F0B90B', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#EAECEF'
];

export default function BottleneckChart({ data, type = 'bar' }: BottleneckChartProps) {
  if (type === 'pie') {
    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="avgTime"
              nameKey="phase"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label={({ phase, percentage }) => `${phase}: ${percentage.toFixed(1)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}ms`, 'Avg Time']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="phase"
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis
            label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }}
            fontSize={12}
          />
          <Tooltip
            formatter={(value, name) => [
              `${Number(value).toFixed(2)}ms`,
              name === 'avgTime' ? 'Average Time' :
              name === 'maxTime' ? 'Maximum Time' : 'Minimum Time'
            ]}
          />
          <Bar dataKey="avgTime" fill="#F0B90B" name="avgTime" />
          <Bar dataKey="maxTime" fill="#ef4444" name="maxTime" />
          <Bar dataKey="minTime" fill="#10b981" name="minTime" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}