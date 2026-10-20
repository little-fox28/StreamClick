
import { Route, Routes } from "react-router-dom";
import { ProductProvider } from "./context/ProductContext";
import { LanguageProvider } from "./context/LanguageContext";
import MainLayout from "./components/layout/MainLayout";
import HomePage from "./pages/HomePage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import ProductsPage from "@/pages/ProductsPage";
import CartPage from "@/pages/CartPage";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Toaster richColors position="top-right" />
        <ProductProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route
                path="/product-detail/:slug"
                element={<ProductDetailPage />}
              />
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          </MainLayout>
        </ProductProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
