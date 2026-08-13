export default function LoadingState({ message = "Đang tải dữ liệu..." }) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-slate-500 font-medium animate-pulse">{message}</p>
    </div>
  );
}
