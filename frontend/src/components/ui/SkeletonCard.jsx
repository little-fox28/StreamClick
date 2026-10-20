const SkeletonCard = () => {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="relative aspect-[3/4] bg-gray-200 rounded-lg mb-4" />

      <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />

      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />

      <div className="flex justify-between items-center">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
};

export default SkeletonCard;
