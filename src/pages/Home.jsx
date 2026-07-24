import React, { useState } from "react";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import { useAppSettings } from "../context/AppSettingsContext";

// Data z'amakuru, tips n'ikoranabuhanga
const HERO_ARTICLE = {
  id: "hero-1",
  category: "FEATURED",
  title: "Ikoranabuhanga rya AI n'Ubuhinzi n'Ubworozi bugezweho muri ANTIMATE",
  description:
    "Uko ibyuma bya IoT n'ubwenge bukorano (AI) biri guhindura imyoretse y'inkoko n'ubuhinzi bugezweho ku borozi n'abahinzi mu Rwanda n'Afrika.",
  image:
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
  author: "ANTIMATE Team",
  date: "July 24, 2026",
};

const AGRI_NEWS = [
  {
    id: "news-1",
    category: "Technology",
    title: "Gukoresha Drones n'Ibyuma bya IoT mu kuhatira imyaka",
    description: "Ibyuma bihenze bishobora gupima ubuhehere bwo mu ubutaka no kuhira neza ahakenewe gusa bila kwangiza amazi.",
    image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80",
    author: "Jean Paul N.",
    date: "July 22, 2026",
  },
  {
    id: "news-2",
    category: "Poultry",
    title: "Uko wagabanya impfu z'iminyawanwa (imishwi) mu cyumweru cya mbere",
    description: "Gucunga ubushyuhe, umwuka mwiza, n'amazi meza biragufasha kurinda imishwi yawe gupfa ku kigero cya 90%.",
    image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80",
    author: "Dr. Alice M.",
    date: "July 20, 2026",
  },
  {
    id: "news-3",
    category: "AI & IoT",
    title: "Smart Brooder: AI yakorewe korora inkoko neza",
    description: "Kumenya ibipimo by'ubushyuhe n'umwuka muri poultry shed yawe ugakoresha terefone gusa.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    author: "ANTIMATE Devs",
    date: "July 18, 2026",
  }
];

const POULTRY_TIPS = [
  {
    id: "pt-1",
    title: "Ubushyuhe Bwiza muri Brooder",
    description: "Tangirira ku gipimo cy'ubushyuhe buhagije mu cyumweru cya mbere ugenda ugabanya gake gake.",
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "pt-2",
    title: "Isuku n'Amazi Meza",
    description: "Sukura ibikoresho by'amazi buri munsi kugira ngo urinde indwara nka Coccidiosis.",
    image: "https://images.unsplash.com/photo-1533318087102-b3ad366ed041?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "pt-3",
    title: "Guhindura Umwuka (Ventilation)",
    description: "Leka umwuka mwiza winjire kuko bituma inkoko zitabura oxygen ntiwipfutse cyane.",
    image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80",
  }
];

const YOUTUBE_VIDEOS = [
  {
    id: "yt-1",
    embedId: "Qp48s2U2B04",
    title: "Inyigisho ku kumenya korora no kurinda impfu z'imishwi",
    description: "Ikurikirane uburyo bwiza bwo gutunganya ikiraro n'isuku y'inkoko.",
    youtubeUrl: "https://www.youtube.com/watch?v=Qp48s2U2B04",
  },
  {
    id: "yt-2",
    embedId: "d13B090aT5U",
    title: "Smart Agriculture & AI Integration Showcase",
    description: "Uko ikoranabuhanga riri guhindura ubuhinzi mu bihugu biterimbere.",
    youtubeUrl: "https://www.youtube.com/watch?v=d13B090aT5U",
  }
];

function Home() {
  const user = JSON.parse(localStorage.getItem("user"));
  const { isDark, text } = useAppSettings();
  const [hoveredCard, setHoveredCard] = useState(null);

  // Mappings y'amabara
  const bgMain = isDark ? "#0f172a" : "#f8fafc";
  const bgCard = isDark ? "#1e293b" : "#ffffff";
  const textPrimary = isDark ? "#ffffff" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";
  const accentGreen = "#00ff99";
  const borderColor = isDark ? "#334155" : "#e2e8f0";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: bgMain,
        color: textPrimary,
        paddingBottom: "100px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <AppHeader title={text?.home || "Home"} />

      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Mwaramutse / Muraho User */}
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "bold" }}>
            {text?.home || "Home"}, {user?.name || "User"} 👋
          </h1>
          <p style={{ color: textSecondary, fontSize: "14px" }}>
            Soma amakuru mashya y'ubuhinzi, inkoko, n'ikoranabuhanga rya ANTIMATE.
          </p>
        </div>

        {/* HERO ARTICLE */}
        <div
          style={{
            backgroundColor: bgCard,
            borderRadius: "20px",
            border: `1px solid ${borderColor}`,
            overflow: "hidden",
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
          }}
        >
          <img
            src={HERO_ARTICLE.image}
            alt="Hero"
            style={{ width: "100%", height: "200px", objectFit: "cover" }}
          />
          <div style={{ padding: "16px" }}>
            <span style={{ backgroundColor: accentGreen, color: "#0f172a", fontSize: "11px", fontWeight: "bold", padding: "4px 8px", borderRadius: "10px" }}>
              {HERO_ARTICLE.category}
            </span>
            <h2 style={{ fontSize: "18px", marginTop: "10px", color: textPrimary }}>{HERO_ARTICLE.title}</h2>
            <p style={{ fontSize: "13px", color: textSecondary, margin: "8px 0" }}>{HERO_ARTICLE.description}</p>
            <button
              style={{
                background: accentGreen,
                border: "none",
                padding: "8px 16px",
                borderRadius: "10px",
                fontWeight: "bold",
                color: "#0f172a",
                cursor: "pointer",
                marginTop: "6px"
              }}
            >
              Soma birambuye →
            </button>
          </div>
        </div>

        {/* POULTRY TIPS (HORIZONTAL SCROLL) */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>🐥 Inyigisho ku Bworozi bwa Inkoko</h2>
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
            {POULTRY_TIPS.map((tip) => (
              <div
                key={tip.id}
                style={{
                  minWidth: "200px",
                  backgroundColor: bgCard,
                  borderRadius: "16px",
                  border: `1px solid ${borderColor}`,
                  padding: "12px",
                  flexShrink: 0,
                }}
              >
                <img src={tip.image} alt={tip.title} style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "10px" }} />
                <h4 style={{ fontSize: "14px", marginTop: "8px", color: textPrimary }}>{tip.title}</h4>
                <p style={{ fontSize: "11px", color: textSecondary, marginTop: "4px" }}>{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AGRICULTURE NEWS */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>🌱 Amakuru Mashya y'Ubuhinzi & AI</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {AGRI_NEWS.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: bgCard,
                  borderRadius: "16px",
                  border: `1px solid ${borderColor}`,
                  padding: "12px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center"
                }}
              >
                <img src={item.image} alt={item.title} style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "12px" }} />
                <div>
                  <span style={{ color: accentGreen, fontSize: "10px", fontWeight: "bold" }}>{item.category}</span>
                  <h3 style={{ fontSize: "14px", color: textPrimary, margin: "4px 0" }}>{item.title}</h3>
                  <p style={{ fontSize: "11px", color: textSecondary }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* YOUTUBE VIDEOS */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>🎥 Amashusho y'Inyigisho</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {YOUTUBE_VIDEOS.map((vid) => (
              <div key={vid.id} style={{ backgroundColor: bgCard, borderRadius: "16px", border: `1px solid ${borderColor}`, overflow: "hidden" }}>
                <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${vid.embedId}`}
                    title={vid.title}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                    allowFullScreen
                  />
                </div>
                <div style={{ padding: "12px" }}>
                  <h3 style={{ fontSize: "14px", color: textPrimary }}>{vid.title}</h3>
                  <p style={{ fontSize: "12px", color: textSecondary, marginTop: "4px" }}>{vid.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}

export default Home;