const StatisticCards = ({ data, variant = "dark" }) => {
  const isDark = variant === "dark";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      {data.map((stat, index) => (
        <div
          key={index}
          className={`p-5 rounded-2xl border-l-4 ${stat.color} ${
            isDark
              ? "bg-slate-800/60 border border-slate-700/60 shadow-lg shadow-black/20"
              : "bg-white shadow-sm border border-slate-100"
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {stat.title}
              </p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                {stat.value}
              </p>
            </div>
            <div className="text-3xl opacity-80">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatisticCards;
