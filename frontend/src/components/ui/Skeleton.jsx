const Skeleton = ({ count = 8 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 animate-pulse">
          <div className="aspect-4/5 bg-gray-200 rounded-xl" />

          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-2 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default Skeleton;
