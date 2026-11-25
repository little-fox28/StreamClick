/**
 * Homepage content data.
 */

export const getHeroSlides = (t) => [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=2000",
    title: t("hero.title.professional.line1") + " " + t("hero.title.professional.line2"), // In component we use <br/> but here we store strings
    desc: t("hero.desc.professional"),
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=2000",
    title: t("hero.title.passion.line1") + " " + t("hero.title.passion.line2"),
    desc: t("hero.desc.passion"),
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1510051640316-543e96729e2d?auto=format&fit=crop&q=80&w=2000",
    title: t("hero.title.pride.line1") + " " + t("hero.title.pride.line2"),
    desc: t("hero.desc.pride"),
  },
];

export const getFeaturedCategories = (t) => [
  {
    id: "club-kits",
    name: t("categories_list.clubKits"),
    description: t("categories_list.clubKitsDesc"),
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d6dbb?auto=format&fit=crop&q=80&w=800",
    size: "large",
  },
  {
    id: "national-kits",
    name: t("categories_list.nationalKits"),
    description: t("categories_list.nationalKitsDesc"),
    image: "https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?auto=format&fit=crop&q=80&w=800",
    size: "medium",
  },
  {
    id: "accessories",
    name: t("accessories"),
    description: t("categories_list.accessoriesDesc"),
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=600",
    size: "small",
  },
  {
    id: "protective-gear",
    name: t("categories_list.protectiveGear"),
    description: t("categories_list.protectiveGearDesc"),
    image: "https://plus.unsplash.com/premium_photo-1664303848783-0498ebc31a76?auto=format&fit=crop&q=80&w=600",
    size: "small",
  },
];

export const getTopLeagues = (t) => [
  {
    name: t("header.leagues.premierLeague"),
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg",
  },
  {
    name: t("header.leagues.laLiga"),
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/LaLiga_logo_2023.svg/1200px-LaLiga_logo_2023.svg.png",
  },
  {
    name: t("header.leagues.bundesliga"),
    logo: "https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg",
  },
  {
    name: t("header.leagues.serieA"),
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Serie_A_logo_2019.svg",
  },
  {
    name: t("header.leagues.ligue1"),
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/49/Ligue1_Uber_Eats_logo.png",
  },
];

export const getFeaturedLeaguesList = (t) => [
  ...getTopLeagues(t),
  {
    name: t("header.leagues.vleague"),
    logo: "https://upload.wikimedia.org/wikipedia/vi/a/a1/Logo_V.League_1_2024.svg",
  },
  {
    name: t("header.leagues.championsLeague"),
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f3/UEFA_Champions_League_logo_2.svg",
  },
  {
    name: t("header.leagues.europaLeague"),
    logo: "https://upload.wikimedia.org/wikipedia/en/0/03/Europa_League.svg",
  },
];

export const getFeatures = (t, Truck, ShieldCheck, RefreshCw, Headphones) => [
  {
    icon: Truck,
    title: t("fastShipping"),
    desc: t("fastShippingDesc"),
  },
  {
    icon: ShieldCheck,
    title: t("authentic"),
    desc: t("authenticDesc"),
  },
  {
    icon: RefreshCw,
    title: t("easyReturns"),
    desc: t("easyReturnsDesc"),
  },
  {
    icon: Headphones,
    title: t("support"),
    desc: t("supportDesc"),
  },
];
