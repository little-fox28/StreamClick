/**
 * Product data structured for WooCommerce compatibility.
 * Fields match the WooCommerce REST API schema where applicable.
 */

const defaultTranslations = {
  "products.argentinaHome": "Argentina Home Jersey 2024 - Messi 10",
  "products.premierBall": "Nike Premier Match Ball 2025",
  "products.realMadridHome": "Real Madrid Home Kit 24/25",
  "products.shinGuards": "Pro Carbon Shin Guards",
  "products.italyHome": "Italy Home 2024",
  "products.pumaBoots": "Puma Future Ultimate",
  "products.bayernAway": "Bayern Munich Away 24/25",
  "products.vietnamTraining": "Vietnam Training Kit",
  "products.types.national": "National",
  "products.types.accessories": "Accessories",
  "products.types.boots": "Boots",
  "products.tags.bestSeller": "Best Seller",
  "products.tags.new": "New",
  "products.tags.hot": "Hot",
  "products.tags.limited": "Limited",
  "header.leagues.laLiga": "La Liga",
  "header.leagues.bundesliga": "Bundesliga",
};

const defaultT = (key) => defaultTranslations[key] || key;
const resolveT = (fn) => (typeof fn === "function" ? fn : defaultT);

export const getProducts = (translate) => {
  const t = resolveT(translate);
  return [
    {
      id: 1,
      sku: "JP-ARG-2024-M10",
      name: t("products.argentinaHome"),
      slug: "argentina-home-jersey-2024-messi-10",
      type: "simple",
      status: "publish",
      featured: true,
      catalog_visibility: "visible",
      description: "Authentic Argentina Home Jersey for the 2024 season, featuring Messi 10 printing.",
      short_description: "The official 2024 Argentina Home Jersey.",
      price: "1999",
      regular_price: "1999",
      sale_price: "",
      on_sale: false,
      purchasable: true,
      total_sales: 150,
      virtual: false,
      downloadable: false,
      stock_status: "instock",
      stock_quantity: 45,
      total_stock: 45,
      weight: "0.2",
      dimensions: { length: "30", width: "20", height: "2" },
      average_rating: "5.0",
      rating_count: 88,
      categories: [
        { id: 1, name: t("products.types.national"), slug: "national" }
      ],
      tags: [
        { id: 1, name: t("products.tags.bestSeller"), slug: "best-seller" }
      ],
      images: [
        {
          id: 1,
          src: "https://images.unsplash.com/photo-1511252998634-1181285db21d?auto=format&fit=crop&q=80&w=800",
          name: "Argentina Home Jersey",
          alt: t("products.argentinaHome")
        }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1511252998634-1181285db21d?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800"
      ],
      variations: [
        { id: "1-s", attributes: { size: "S" } },
        { id: "1-m", attributes: { size: "M" } },
        { id: "1-l", attributes: { size: "L" } },
        { id: "1-xl", attributes: { size: "XL" } },
        { id: "1-2xl", attributes: { size: "2XL" } }
      ],
      allow_print: true,
      print_price: 150,
      patches: [
        { label: "Copa America Champions", price: 120 },
        { label: "World Cup 2026", price: 150 }
      ],
      image: "https://images.unsplash.com/photo-1511252998634-1181285db21d?auto=format&fit=crop&q=80&w=800",
      category: t("products.types.national"),
      tag: t("products.tags.bestSeller")
    },
    {
      id: 2,
      sku: "JP-NIKE-PREM-2025",
      name: t("products.premierBall"),
      slug: "nike-premier-match-ball-2025",
      type: "simple",
      status: "publish",
      featured: false,
      description: "Nike Premier Match Ball for the 2025 season. Professional grade.",
      short_description: "Professional match ball.",
      price: "2499",
      regular_price: "2499",
      sale_price: "",
      on_sale: false,
      stock_status: "instock",
      stock_quantity: 30,
      total_stock: 30,
      average_rating: "5.0",
      rating_count: 42,
      categories: [
        { id: 2, name: t("products.types.accessories"), slug: "accessories" }
      ],
      tags: [
        { id: 2, name: t("products.tags.new"), slug: "new" }
      ],
      images: [
        {
          id: 2,
          src: "https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?auto=format&fit=crop&q=80&w=800",
          name: "Nike Premier Match Ball",
          alt: t("products.premierBall")
        }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?auto=format&fit=crop&q=80&w=800"
      ],
      variations: [
        { id: "2-size5", attributes: { size: "Size 5 (Official)" } },
        { id: "2-size4", attributes: { size: "Size 4" } }
      ],
      allow_print: false,
      print_price: 0,
      patches: [],
      image: "https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?auto=format&fit=crop&q=80&w=800",
      category: t("products.types.accessories"),
      tag: t("products.tags.new")
    },
    {
      id: 3,
      sku: "JP-RM-HOME-2425",
      name: t("products.realMadridHome"),
      slug: "real-madrid-home-kit-24-25",
      type: "simple",
      status: "publish",
      description: "Real Madrid Home Kit for the 24/25 season.",
      price: "1499",
      regular_price: "1499",
      sale_price: "",
      on_sale: false,
      stock_status: "instock",
      stock_quantity: 60,
      total_stock: 60,
      average_rating: "5.0",
      rating_count: 120,
      categories: [
        { id: 3, name: t("header.leagues.laLiga"), slug: "la-liga" }
      ],
      images: [
        {
          id: 3,
          src: "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?auto=format&fit=crop&q=80&w=800",
          name: "Real Madrid Home Kit",
          alt: t("products.realMadridHome")
        }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?auto=format&fit=crop&q=80&w=800"
      ],
      variations: [
        { id: "3-s", attributes: { size: "S" } },
        { id: "3-m", attributes: { size: "M" } },
        { id: "3-l", attributes: { size: "L" } },
        { id: "3-xl", attributes: { size: "XL" } }
      ],
      allow_print: true,
      print_price: 150,
      patches: [
        { label: "UCL 15 Badge", price: 150 },
        { label: "La Liga Champions", price: 120 }
      ],
      image: "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?auto=format&fit=crop&q=80&w=800",
      category: t("header.leagues.laLiga")
    },
    {
      id: 4,
      sku: "JP-PRO-CARB-SHIN",
      name: t("products.shinGuards"),
      slug: "pro-carbon-shin-guards",
      type: "simple",
      status: "publish",
      description: "Professional carbon fiber shin guards for maximum protection.",
      price: "699",
      regular_price: "699",
      stock_status: "instock",
      stock_quantity: 40,
      total_stock: 40,
      average_rating: "5.0",
      rating_count: 56,
      categories: [
        { id: 2, name: t("products.types.accessories"), slug: "accessories" }
      ],
      images: [
        {
          id: 4,
          src: "https://images.unsplash.com/photo-1517466787929-bc90951d6dbb?auto=format&fit=crop&q=80&w=800",
          name: "Pro Carbon Shin Guards",
          alt: t("products.shinGuards")
        }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1517466787929-bc90951d6dbb?auto=format&fit=crop&q=80&w=800"
      ],
      variations: [
        { id: "4-s", attributes: { size: "S" } },
        { id: "4-m", attributes: { size: "M" } },
        { id: "4-l", attributes: { size: "L" } }
      ],
      allow_print: false,
      print_price: 0,
      patches: [],
      image: "https://images.unsplash.com/photo-1517466787929-bc90951d6dbb?auto=format&fit=crop&q=80&w=800",
      category: t("products.types.accessories")
    }
  ];
};

export const getNewArrivals = (translate) => {
  const t = resolveT(translate);
  return [
    {
      id: 101,
      sku: "JP-ITA-HOME-2024",
      name: t("products.italyHome"),
      slug: "italy-home-2024",
      type: "simple",
      status: "publish",
      price: "1699",
      regular_price: "1699",
      stock_status: "instock",
      stock_quantity: 25,
      total_stock: 25,
      average_rating: "5.0",
      rating_count: 34,
      categories: [
        { id: 1, name: t("products.types.national"), slug: "national" }
      ],
      tags: [
        { id: 2, name: t("products.tags.new"), slug: "new" }
      ],
      images: [
        {
          id: 101,
          src: "https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&q=80&w=800",
          name: "Italy Home 2024",
          alt: t("products.italyHome")
        }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&q=80&w=800"
      ],
      variations: [
        { id: "101-s", attributes: { size: "S" } },
        { id: "101-m", attributes: { size: "M" } },
        { id: "101-l", attributes: { size: "L" } },
        { id: "101-xl", attributes: { size: "XL" } }
      ],
      allow_print: true,
      print_price: 150,
      patches: [
        { label: "Euro Champions", price: 120 }
      ],
      image: "https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&q=80&w=800",
      category: t("products.types.national"),
      tag: t("products.tags.new")
    },
    {
      id: 102,
      sku: "JP-PUMA-FUTURE-ULT",
      name: t("products.pumaBoots"),
      slug: "puma-future-ultimate",
      type: "simple",
      price: "3999",
      regular_price: "3999",
      stock_status: "instock",
      stock_quantity: 15,
      total_stock: 15,
      average_rating: "5.0",
      rating_count: 15,
      categories: [
        { id: 4, name: t("products.types.boots"), slug: "boots" }
      ],
      tags: [
        { id: 3, name: t("products.tags.hot"), slug: "hot" }
      ],
      images: [
        {
          id: 102,
          src: "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=800",
          name: "Puma Future Ultimate",
          alt: t("products.pumaBoots")
        }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=800"
      ],
      variations: [
        { id: "102-40", attributes: { size: "40" } },
        { id: "102-41", attributes: { size: "41" } },
        { id: "102-42", attributes: { size: "42" } },
        { id: "102-43", attributes: { size: "43" } }
      ],
      allow_print: false,
      print_price: 0,
      patches: [],
      image: "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=800",
      category: t("products.types.boots"),
      tag: t("products.tags.hot")
    },
    {
      id: 103,
      sku: "JP-BAY-AWAY-2425",
      name: t("products.bayernAway"),
      slug: "bayern-munich-away-24-25",
      type: "simple",
      price: "1499",
      regular_price: "1499",
      stock_status: "instock",
      stock_quantity: 35,
      total_stock: 35,
      average_rating: "5.0",
      rating_count: 22,
      categories: [
        { id: 5, name: t("header.leagues.bundesliga"), slug: "bundesliga" }
      ],
      tags: [
        { id: 2, name: t("products.tags.new"), slug: "new" }
      ],
      images: [
        {
          id: 103,
          src: "https://images.unsplash.com/photo-1615144670267-33e387c244c7?auto=format&fit=crop&q=80&w=800",
          name: "Bayern Munich Away 24/25",
          alt: t("products.bayernAway")
        }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1615144670267-33e387c244c7?auto=format&fit=crop&q=80&w=800"
      ],
      variations: [
        { id: "103-s", attributes: { size: "S" } },
        { id: "103-m", attributes: { size: "M" } },
        { id: "103-l", attributes: { size: "L" } },
        { id: "103-xl", attributes: { size: "XL" } }
      ],
      allow_print: true,
      print_price: 150,
      patches: [
        { label: "Bundesliga Meister", price: 120 },
        { label: "Champions League", price: 150 }
      ],
      image: "https://images.unsplash.com/photo-1615144670267-33e387c244c7?auto=format&fit=crop&q=80&w=800",
      category: t("header.leagues.bundesliga"),
      tag: t("products.tags.new")
    },
    {
      id: 104,
      sku: "JP-VN-TRAIN-KIT",
      name: t("products.vietnamTraining"),
      slug: "vietnam-training-kit",
      type: "simple",
      price: "699",
      regular_price: "699",
      stock_status: "instock",
      stock_quantity: 50,
      total_stock: 50,
      average_rating: "5.0",
      rating_count: 95,
      categories: [
        { id: 1, name: t("products.types.national"), slug: "national" }
      ],
      tags: [
        { id: 4, name: t("products.tags.limited"), slug: "limited" }
      ],
      images: [
        {
          id: 104,
          src: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&q=80&w=800",
          name: "Vietnam Training Kit",
          alt: t("products.vietnamTraining")
        }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&q=80&w=800"
      ],
      variations: [
        { id: "104-s", attributes: { size: "S" } },
        { id: "104-m", attributes: { size: "M" } },
        { id: "104-l", attributes: { size: "L" } },
        { id: "104-xl", attributes: { size: "XL" } }
      ],
      allow_print: true,
      print_price: 100,
      patches: [
        { label: "Golden Star", price: 80 }
      ],
      image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&q=80&w=800",
      category: t("products.types.national"),
      tag: t("products.tags.limited")
    }
  ];
};
