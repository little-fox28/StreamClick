import { Search } from "lucide-react";

const THEME = {
  primary: "#163300",
  secondary: "#f2c86c",
};

const SearchBar = () => {
  return (
    <div className="hidden md:flex relative group">
      <input
        type="text"
        placeholder="Search..."
        className="text-white text-sm rounded-full pl-4 pr-10 py-1.5 focus:outline-none focus:ring-1 w-32 focus:w-56 transition-all duration-300 placeholder-white/60 bg-black/20"
        style={{ "--tw-ring-color": THEME.secondary }}
      />
      <Search
        className="absolute right-3 top-1.5 text-white/60"
        size={18}
      />
    </div>
  );
};

export default SearchBar;
