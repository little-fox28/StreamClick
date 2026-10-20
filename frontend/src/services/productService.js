import { getProducts, getNewArrivals } from "@/data/products";

// Helper to normalize product data for all components (ProductCard, ProductDetail, etc.)
const formatProduct = (item) => {
  if (!item) return null;

  const categoryName =
    typeof item.category === "string"
      ? item.category
      : item.categories?.[0]?.name || item.categories?.[0] || "Jersey";

  const galleryImages =
    item.gallery && item.gallery.length > 0
      ? item.gallery
      : [item.image, ...(item.images?.map((img) => (typeof img === "string" ? img : img.src)) || [])].filter(Boolean);

  return {
    id: item.id,
    sku: item.sku || `SKU-${item.id}`,
    name: item.name,
    slug: item.slug,
    image: item.image || item.images?.[0]?.src || "/placeholder.jpg",
    breakpoints: {
      s300: item.image || null,
      s600: item.image || null,
    },
    category: categoryName,
    price: Number(item.price) || 0,
    regular_price: Number(item.regular_price || item.price) || 0,
    sale_price: item.sale_price ? Number(item.sale_price) : null,
    on_sale: Boolean(item.on_sale),
    description: item.description || item.short_description || "High quality product.",
    short_description: item.short_description || "",
    gallery: galleryImages,
    variations: item.variations || [
      { id: `${item.id}-s`, attributes: { size: "S" } },
      { id: `${item.id}-m`, attributes: { size: "M" } },
      { id: `${item.id}-l`, attributes: { size: "L" } },
      { id: `${item.id}-xl`, attributes: { size: "XL" } },
    ],
    total_stock: item.total_stock ?? item.stock_quantity ?? 50,
    season: item.season || "2024/2025",
    allow_print: item.allow_print !== undefined ? item.allow_print : true,
    print_price: item.print_price !== undefined ? item.print_price : 150,
    patches: item.patches || [
      { label: "Champions League", price: 120 },
      { label: "World Cup 2026", price: 150 },
    ],
    sold: item.sold || item.total_sales || 25,
    rating: item.rating ? Number(item.rating) : Number(item.average_rating) || 5.0,
    rating_count: item.rating_count || 42,
    tag: item.tag || item.tags?.[0]?.name || null,
  };
};

// Retrieve all local mock products
const getAllLocalProducts = () => {
  const products = getProducts();
  const newArrivals = getNewArrivals();
  return [...products, ...newArrivals].map(formatProduct);
};

export const trendingProduct = async () => {
  try {
    // Local mock data
    const allProducts = getAllLocalProducts();
    return allProducts;
  } catch (error) {
    console.error("Local mock product error:", error);
    return [];
  }
};

export const getDetailProduct = async (slug) => {
  try {
    const allProducts = getAllLocalProducts();
    const cleanSlug = String(slug || "").toLowerCase().trim();

    const product = allProducts.find(
      (p) =>
        String(p.slug).toLowerCase() === cleanSlug ||
        String(p.id).toLowerCase() === cleanSlug
    );

    if (product) {
      return product;
    }

    // Fallback: return the first product if slug doesn't match
    return allProducts[0] || null;
  } catch (error) {
    console.error("Fetch Product Detail Error:", error);
    throw error;
  }
};

export const getRelatedProducts = async (productId, lang = 'en') => {
  try {
    const allProducts = getAllLocalProducts();
    return allProducts
      .filter((p) => String(p.id) !== String(productId))
      .slice(0, 4);
  } catch (error) {
    console.error("Related Products Local Error:", error);
    return [];
  }
};