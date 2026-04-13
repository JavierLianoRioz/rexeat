export default function MenuLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      <div className="h-40 bg-gray-200 rounded-lg w-full" />
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-md w-full" />
        ))}
      </div>
    </div>
  );
}
