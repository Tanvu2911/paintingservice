export default function LoadingSpinner({ text = "Đang tải dữ liệu..." }) {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <span className="ml-3 text-slate-500 font-medium">{text}</span>
    </div>
  );
}