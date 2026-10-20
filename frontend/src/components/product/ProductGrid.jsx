const ProductGrid = ({ children }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
      {children}
    </div>
  );
};

export default ProductGrid;
