'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 6 } }
  }
};

export function StatusDoughnut({ data }) {
  if (!data) return null;
  const chartData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [{
      data: [data.completedTasks || 0, data.pendingTasks || 0, data.overdueTasks || 0],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };
  return <div className="h-64"><Doughnut data={chartData} options={{...commonOptions, cutout: '75%'}} /></div>;
}

export function CategoryBar({ data }) {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>;
  const chartData = {
    labels: data.map(d => d._id || 'Uncategorized'),
    datasets: [
      {
        label: 'Completed',
        data: data.map(d => d.completed),
        backgroundColor: '#10b981',
        borderRadius: 4
      },
      {
        label: 'Total',
        data: data.map(d => d.total),
        backgroundColor: '#e5e7eb',
        borderRadius: 4
      }
    ]
  };
  return (
    <div className="h-64">
      <Bar 
        data={chartData} 
        options={{
          ...commonOptions,
          indexAxis: 'y',
          scales: {
            x: { stacked: false, grid: { display: false } },
            y: { stacked: false, grid: { display: false } }
          }
        }} 
      />
    </div>
  );
}

export function PriorityPie({ data }) {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>;
  const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  const chartData = {
    labels: data.map(d => d._id?.charAt(0).toUpperCase() + d._id?.slice(1)),
    datasets: [{
      data: data.map(d => d.total),
      backgroundColor: data.map(d => priorityColors[d._id] || '#9ca3af'),
      borderWidth: 0
    }]
  };
  return <div className="h-64"><Pie data={chartData} options={commonOptions} /></div>;
}

export function DailyTrendLine({ data }) {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>;
  const chartData = {
    labels: data.map(d => {
      const date = new Date(d._id);
      return `${date.getMonth()+1}/${date.getDate()}`;
    }),
    datasets: [
      {
        label: 'Completed Tasks',
        data: data.map(d => d.completed),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3
      }
    ]
  };
  return (
    <div className="h-64">
      <Line 
        data={chartData} 
        options={{
          ...commonOptions,
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#f3f4f6' }, beginAtZero: true, ticks: { precision: 0 } }
          }
        }} 
      />
    </div>
  );
}
