import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RainfallData {
  "JANUARY ACTUAL (Millimeters)": number | null;
  "FEBRUARY ACTUAL (Millimeters)": number | null;
  "MARCH ACTUAL (Millimeters)": number | null;
  "APRIL ACTUAL (Millimeters)": number | null;
  "MAY ACTUAL (Millimeters)": number | null;
  "JUNE ACTUAL (Millimeters)": number | null;
  "JULY ACTUAL (Millimeters)": number | null;
  "AUGUST ACTUAL (Millimeters)": number | null;
  "SEPTEMBER ACTUAL (Millimeters)": number | null;
  "OCTOBER ACTUAL (Millimeters)": number | null;
  "NOVEMBER ACTUAL (Millimeters)": number | null;
  "DECEMBER ACTUAL (Millimeters)": number | null;
}

interface RainfallChartProps {
  data: RainfallData | null;
}

const RainfallChart: React.FC<RainfallChartProps> = ({ data }) => {
  if (!data) {
    return <p>No rainfall data available for this selection.</p>;
  }

  const chartData = [
    { month: "Jan", rainfall: data["JANUARY ACTUAL (Millimeters)"] ?? 0 },
    { month: "Feb", rainfall: data["FEBRUARY ACTUAL (Millimeters)"] ?? 0 },
    { month: "Mar", rainfall: data["MARCH ACTUAL (Millimeters)"] ?? 0 },
    { month: "Apr", rainfall: data["APRIL ACTUAL (Millimeters)"] ?? 0 },
    { month: "May", rainfall: data["MAY ACTUAL (Millimeters)"] ?? 0 },
    { month: "Jun", rainfall: data["JUNE ACTUAL (Millimeters)"] ?? 0 },
    { month: "Jul", rainfall: data["JULY ACTUAL (Millimeters)"] ?? 0 },
    { month: "Aug", rainfall: data["AUGUST ACTUAL (Millimeters)"] ?? 0 },
    { month: "Sep", rainfall: data["SEPTEMBER ACTUAL (Millimeters)"] ?? 0 },
    { month: "Oct", rainfall: data["OCTOBER ACTUAL (Millimeters)"] ?? 0 },
    { month: "Nov", rainfall: data["NOVEMBER ACTUAL (Millimeters)"] ?? 0 },
    { month: "Dec", rainfall: data["DECEMBER ACTUAL (Millimeters)"] ?? 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="rainfall" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RainfallChart;