import React from 'react';
import { useFontSize } from '../context/FontSizeContext';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Placeholder data for charts
const placeholderData = [
  { name: 'US', value: 400 },
  { name: 'EU', value: 300 },
];

const sponsorData = [
  { name: 'Sponsor A', trials: 120 },
  { name: 'Sponsor B', trials: 100 },
  { name: 'Sponsor C', trials: 80 },
  { name: 'Sponsor D', trials: 60 },
  { name: 'Sponsor E', trials: 40 },
];

const conditionData = [
  { name: 'Cancer', value: 200 },
  { name: 'Cardiology', value: 150 },
  { name: 'Neurology', value: 100 },
  { name: 'Other', value: 50 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Charts: React.FC = () => {
  const { fontSize } = useFontSize();

  const getFontSizeClasses = () => {
    if (fontSize === 'large') {
      return {
        title: 'text-3xl',
        subtitle: 'text-xl',
        chartTitle: 'text-lg',
      };
    }
    return {
      title: 'text-2xl',
      subtitle: 'text-lg',
      chartTitle: 'text-base',
    };
  };

  const { title, subtitle, chartTitle } = getFontSizeClasses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className={`${title} font-bold text-gray-900 mb-4 text-center`}>
          Clinical Trials Chart Catalog
        </h1>
        <p className={`${subtitle} text-gray-600 mb-12 text-center`}>
          Explore various charts representing clinical trials data
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Chart 1: Total Trials US vs EU */}
          <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl">
            <h3 className={`${chartTitle} font-semibold mb-4`}>Total Trials: US vs EU</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={placeholderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                  {placeholderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Trials by Condition */}
          <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl">
            <h3 className={`${chartTitle} font-semibold mb-4`}>Trials by Condition</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={conditionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#82ca9d">
                  {conditionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Trials by Sponsor */}
          <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl">
            <h3 className={`${chartTitle} font-semibold mb-4`}>Trials by Sponsor</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sponsorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="trials" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4: Top 10 Sponsors */}
          <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl">
            <h3 className={`${chartTitle} font-semibold mb-4`}>Top 10 Sponsors</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sponsorData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="trials" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 5: Enrollment by Region */}
          <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl">
            <h3 className={`${chartTitle} font-semibold mb-4`}>Enrollment by Region</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={placeholderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#ff7300">
                  {placeholderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 6: Placeholder Chart */}
          <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl">
            <h3 className={`${chartTitle} font-semibold mb-4`}>Trial Phases</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sponsorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="trials" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 7: Placeholder Chart */}
          <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl">
            <h3 className={`${chartTitle} font-semibold mb-4`}>Trial Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={conditionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#0088FE">
                  {conditionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 8: Placeholder Chart */}
          <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl">
            <h3 className={`${chartTitle} font-semibold mb-4`}>Trial Duration</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sponsorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="trials" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 9: Placeholder Chart */}
          <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl">
            <h3 className={`${chartTitle} font-semibold mb-4`}>Funding Sources</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={placeholderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#FFBB28">
                  {placeholderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 10: Placeholder Chart */}
          <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl">
            <h3 className={`${chartTitle} font-semibold mb-4`}>Trial Locations</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sponsorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="trials" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;