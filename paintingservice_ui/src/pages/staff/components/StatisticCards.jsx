// staff/components/StatisticCards.jsx

const StatisticCards = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {data.map((stat, index) => (
        <div key={index} className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 ${stat.color}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{stat.value}</p>
            </div>
            <div className="text-3xl opacity-80">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatisticCards;