import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import {
  trendingProduct,
  getDetailProduct,
  getRelatedProducts,
} from "@/services/productService";
import { useLanguage } from "@/context/LanguageContext";
const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentLang } = useLanguage();  
  const fetchtrendingProduct = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const localData = localStorage.getItem("products");
      if (localData && !forceRefresh) {
        setProducts(JSON.parse(localData));
        setLoading(false);
      }

      const data = await trendingProduct();

      if (data && data.length > 0) {
        setProducts(data);
        localStorage.setItem("products", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Lỗi hệ thống quản lý sản phẩm", error);
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchProductBySlug = useCallback(async (slug) => {
    if (!slug) return null;
    try {
      const data = await getDetailProduct(slug);


      return data;
    } catch (error) {
      console.error("Lỗi lấy chi tiết sản phẩm", error);
      return null;
    }
  }, []);
  const fetchRelatedProducts = useCallback(
    async (productId) => {
      if (!productId) return [];
      try {
        const data = await getRelatedProducts(
          productId,
          currentLang.toLowerCase()
        );
        return data;
      } catch (error) {
        console.error("Lỗi lấy sản phẩm liên quan", error);
        return [];
      }
    },
    [currentLang]
  );
  useEffect(() => {
    fetchtrendingProduct();
  }, [fetchtrendingProduct]);

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        refresh: () => fetchtrendingProduct(true),
        fetchProductBySlug,
        fetchRelatedProducts
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};
