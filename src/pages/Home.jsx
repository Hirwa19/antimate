import React from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import { useAppSettings } from "../context/AppSettingsContext";

const HERO_ARTICLE = {
  image:
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
};

const POULTRY_TIPS = [
  {
    id: "pt-1",
    image:
      "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "pt-2",
    image:
      "https://images.unsplash.com/photo-1533318087102-b3ad366ed041?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "pt-3",
    image:
      "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80",
  },
];

const AGRI_NEWS = [
  {
    id: "news-1",
    image:
      "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "news-2",
    image:
      "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "news-3",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  },
];

const YOUTUBE_VIDEOS = [
  {
    id: "yt-1",
    embedId: "htbmHQnTdb4",
  },
  {
    id: "yt-2",
    embedId: "-qEs9hWjXy4",
  },
  {
    id: "yt-3",
    embedId: "DOk8HBq3kWU",
  },
];

/* ============================================================
   ANTIMATE AI LOGO
   ============================================================ */

function AntimateAILogo({ size = 54 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="antimateAiGradient"
          x1="10"
          y1="10"
          x2="90"
          y2="90"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#00E0A4" />
          <stop offset="0.5" stopColor="#00C896" />
          <stop offset="1" stopColor="#0891B2" />
        </linearGradient>

        <linearGradient
          id="antimateAiGlow"
          x1="20"
          y1="15"
          x2="80"
          y2="85"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* Outer AI orbit */}
      <circle
        cx="50"
        cy="50"
        r="42"
        stroke="url(#antimateAiGradient)"
        strokeWidth="5"
        strokeDasharray="8 5"
      />

      {/* Main AI Core */}
      <rect
        x="25"
        y="25"
        width="50"
        height="50"
        rx="16"
        fill="url(#antimateAiGradient)"
      />

      {/* AI face / processor */}
      <rect
        x="34"
        y="36"
        width="32"
        height="28"
        rx="9"
        fill="#07111F"
        opacity="0.96"
      />

      {/* Eyes */}
      <circle
        cx="44"
        cy="48"
        r="3.2"
        fill="url(#antimateAiGlow)"
      />

      <circle
        cx="56"
        cy="48"
        r="3.2"
        fill="url(#antimateAiGlow)"
      />

      {/* AI mouth */}
      <path
        d="M43 56C46 59 54 59 57 56"
        stroke="url(#antimateAiGlow)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* AI circuit nodes */}
      <circle
        cx="20"
        cy="50"
        r="3"
        fill="#00E0A4"
      />

      <circle
        cx="80"
        cy="50"
        r="3"
        fill="#0891B2"
      />

      <circle
        cx="50"
        cy="20"
        r="3"
        fill="#00C896"
      />

      <circle
        cx="50"
        cy="80"
        r="3"
        fill="#0891B2"
      />
    </svg>
  );
}

/* ============================================================
   FIXED ANTIMATE AI BUTTON
   ============================================================ */

function AntimateAIFloatingButton({ isDark }) {
  return (
    <Link
      to="/antimate-ai"
      aria-label="Open ANTIMATE AI"
      title="ANTIMATE AI"
      style={{
        ...styles.aiFloatingButton,
        background: isDark
          ? "rgba(15, 23, 42, 0.94)"
          : "rgba(255, 255, 255, 0.96)",
        border: isDark
          ? "1px solid rgba(0, 200, 150, 0.38)"
          : "1px solid rgba(0, 180, 135, 0.25)",
        boxShadow: isDark
          ? "0 12px 35px rgba(0,0,0,0.42), 0 0 25px rgba(0,200,150,0.10)"
          : "0 10px 30px rgba(0,80,70,0.16), 0 0 20px rgba(0,200,150,0.08)",
      }}
    >
      {/* Glow */}
      <span
        style={{
          ...styles.aiFloatingGlow,
          background: isDark
            ? "rgba(0, 200, 150, 0.16)"
            : "rgba(0, 200, 150, 0.12)",
        }}
      />

      {/* Logo */}
      <span style={styles.aiFloatingLogo}>
        <AntimateAILogo size={48} />
      </span>

      {/* Online indicator */}
      <span
        style={{
          ...styles.aiOnlineDot,
          borderColor: isDark ? "#0f172a" : "#ffffff",
        }}
      />
    </Link>
  );
}

function Home() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { isDark, text } = useAppSettings();

  const t = text || {};

  const bgMain = isDark ? "#0f172a" : "#f8fafc";
  const bgCard = isDark ? "#1e293b" : "#ffffff";
  const textPrimary = isDark ? "#ffffff" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";
  const borderColor = isDark ? "#334155" : "#e2e8f0";
  const accent = "#00c896";

  const content = {
    greeting:
      t.homeGreeting ||
      (t.home === "Ahabanza"
        ? "Murakaza neza"
        : "Welcome"),

    greetingText:
      t.homeGreetingText ||
      (t.home === "Ahabanza"
        ? "Menya amakuru mashya, inyigisho n'uburyo bwagufasha guteza imbere ubworozi bwawe."
        : "Discover useful news, tips and ideas to help you improve your farm."),

    featured:
      t.featured ||
      (t.home === "Ahabanza"
        ? "IBY'INGENZI"
        : "FEATURED"),

    heroTitle:
      t.heroTitle ||
      (t.home === "Ahabanza"
        ? "Ikoranabuhanga rihindura ubworozi bw'inkoko"
        : "Technology transforming modern poultry farming"),

    heroDescription:
      t.heroDescription ||
      (t.home === "Ahabanza"
        ? "Menya uburyo ikoranabuhanga, amakuru y'igihe nyacyo n'ubwenge bukorano bishobora gufasha umworozi gufata ibyemezo byiza no kongera umusaruro."
        : "Discover how intelligent technology, real-time information and AI can help farmers make better decisions and improve productivity."),

    readMore:
      t.readMore ||
      (t.home === "Ahabanza"
        ? "Soma birambuye"
        : "Read more"),

    poultryTips:
      t.poultryTips ||
      (t.home === "Ahabanza"
        ? "🐥 Inyigisho ku Bworozi bw'Inkoko"
        : "🐥 Poultry Farming Tips"),

    agricultureNews:
      t.agricultureNews ||
      (t.home === "Ahabanza"
        ? "🌱 Amakuru y'Ubuhinzi n'Ikoranabuhanga"
        : "🌱 Agriculture & Technology News"),

    videos:
      t.educationVideos ||
      (t.home === "Ahabanza"
        ? "🎥 Amashusho y'Inyigisho"
        : "🎥 Educational Videos"),

    watchYoutube:
      t.watchYoutube ||
      (t.home === "Ahabanza"
        ? "Reba kuri YouTube ↗"
        : "Watch on YouTube ↗"),
  };

  const tips =
    t.home === "Ahabanza"
      ? [
          {
            title: "Ubushyuhe bwiza mu cyumweru cya mbere",
            description:
              "Tangira ku bushyuhe bukwiye, hanyuma ubugabanye buhoro buhoro uko imishwi ikura.",
          },
          {
            title: "Isuku n'amazi meza",
            description:
              "Sukura ibikoresho by'amazi buri munsi kandi uhore utanga amazi meza.",
          },
          {
            title: "Umwuka mwiza",
            description:
              "Ventilation nziza ifasha inkoko kubona umwuka uhagije no gukura neza.",
          },
        ]
      : [
          {
            title: "Proper brooder temperature",
            description:
              "Start with the right temperature and gradually reduce it as chicks grow.",
          },
          {
            title: "Clean water and hygiene",
            description:
              "Clean drinking equipment regularly and always provide fresh water.",
          },
          {
            title: "Good ventilation",
            description:
              "Proper ventilation helps birds get enough fresh air and grow well.",
          },
        ];

  const news =
    t.home === "Ahabanza"
      ? [
          {
            category: "Ikoranabuhanga",
            title: "Ikoranabuhanga mu buhinzi",
            description:
              "Menya uko ibikoresho by'ikoranabuhanga bishobora gufasha gucunga amazi n'ibindi bikenerwa mu buhinzi.",
          },
          {
            category: "Ubworozi",
            title: "Kurinda imishwi mu ntangiriro",
            description:
              "Ubushyuhe bukwiye, amazi meza n'umwuka mwiza ni ingenzi cyane mu cyumweru cya mbere.",
          },
          {
            category: "AI & Smart Farming",
            title: "Ubwenge bukorano mu bworozi",
            description:
              "Koresha amakuru ava mu bikoresho byawe kugira ngo ubone ubumenyi bugufasha gufata ibyemezo.",
          },
        ]
      : [
          {
            category: "Technology",
            title: "Technology in agriculture",
            description:
              "Discover how modern technology can help farmers manage water and other farm resources.",
          },
          {
            category: "Poultry",
            title: "Protecting chicks early",
            description:
              "Proper temperature, clean water and fresh air are especially important during the first week.",
          },
          {
            category: "AI & Smart Farming",
            title: "AI in poultry farming",
            description:
              "Use information from your farm to gain insights that help you make better decisions.",
          },
        ];

  const videos =
    t.home === "Ahabanza"
      ? [
          {
            title:
              "Uko warinda inkoko indwara y'umuraramo",
            description:
              "Inyigisho igufasha kumenya uburyo bwo kurinda inkoko indwara y'umuraramo.",
          },
          {
            title:
              "Uko watangira ubworozi bw'inkoko",
            description:
              "Urugero rw'umworozi wateje imbere ubworozi bwe mu Rwanda.",
          },
          {
            title:
              "Ubworozi bw'inkoko bugezweho",
            description:
              "Menya uburyo bugezweho bushobora kongera umusaruro w'amagi n'inyama.",
          },
        ]
      : [
          {
            title:
              "How to protect chickens from Newcastle disease",
            description:
              "Learn practical ways to protect your poultry from Newcastle disease.",
          },
          {
            title:
              "How to start poultry farming",
            description:
              "Learn from a poultry farmer who developed a successful farming business.",
          },
          {
            title:
              "Modern poultry farming",
            description:
              "Discover modern methods that can improve egg and meat production.",
          },
        ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bgMain,
        color: textPrimary,
        paddingBottom: "100px",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {/* ====================================================
          FIXED ANTIMATE AI LOGO
      ==================================================== */}
      <AntimateAIFloatingButton isDark={isDark} />

      <AppHeader title={t.home || "Home"} />

      <main style={styles.main}>

        {/* GREETING */}
        <section>
          <h1 style={styles.greeting}>
            {content.greeting},{" "}
            {user?.name ||
              (t.home === "Ahabanza"
                ? "Mworozi"
                : "Farmer")}{" "}
            👋
          </h1>

          <p
            style={{
              ...styles.greetingText,
              color: textSecondary,
            }}
          >
            {content.greetingText}
          </p>
        </section>

        {/* FEATURED ARTICLE */}
        <section
          style={{
            ...styles.heroCard,
            background: bgCard,
            border: `1px solid ${borderColor}`,
            boxShadow: isDark
              ? "none"
              : "0 12px 30px rgba(0,0,0,0.06)",
          }}
        >
          <div style={styles.heroImageWrapper}>
            <img
              src={HERO_ARTICLE.image}
              alt="Smart farming"
              style={styles.heroImage}
            />

            <div style={styles.imageOverlay}>
              <span
                style={{
                  ...styles.badge,
                  background: accent,
                }}
              >
                {content.featured}
              </span>
            </div>
          </div>

          <div style={styles.heroContent}>
            <h2
              style={{
                ...styles.heroTitle,
                color: textPrimary,
              }}
            >
              {content.heroTitle}
            </h2>

            <p
              style={{
                ...styles.heroDescription,
                color: textSecondary,
              }}
            >
              {content.heroDescription}
            </p>

            <button
              style={{
                ...styles.primaryButton,
                background: accent,
              }}
            >
              {content.readMore} →
            </button>
          </div>
        </section>

        {/* POULTRY TIPS */}
        <section>
          <SectionTitle
            title={content.poultryTips}
            color={textPrimary}
          />

          <div style={styles.horizontalScroll}>
            {POULTRY_TIPS.map((tip, index) => (
              <div
                key={tip.id}
                style={{
                  ...styles.tipCard,
                  background: bgCard,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <img
                  src={tip.image}
                  alt={tips[index].title}
                  style={styles.tipImage}
                />

                <h3
                  style={{
                    ...styles.tipTitle,
                    color: textPrimary,
                  }}
                >
                  {tips[index].title}
                </h3>

                <p
                  style={{
                    ...styles.tipDescription,
                    color: textSecondary,
                  }}
                >
                  {tips[index].description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* AGRICULTURE NEWS */}
        <section>
          <SectionTitle
            title={content.agricultureNews}
            color={textPrimary}
          />

          <div style={styles.newsList}>
            {AGRI_NEWS.map((item, index) => (
              <article
                key={item.id}
                style={{
                  ...styles.newsCard,
                  background: bgCard,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <img
                  src={item.image}
                  alt={news[index].title}
                  style={styles.newsImage}
                />

                <div style={styles.newsContent}>
                  <span
                    style={{
                      color: accent,
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >
                    {news[index].category}
                  </span>

                  <h3
                    style={{
                      ...styles.newsTitle,
                      color: textPrimary,
                    }}
                  >
                    {news[index].title}
                  </h3>

                  <p
                    style={{
                      ...styles.newsDescription,
                      color: textSecondary,
                    }}
                  >
                    {news[index].description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* VIDEOS */}
        <section>
          <SectionTitle
            title={content.videos}
            color={textPrimary}
          />

          <div style={styles.videoList}>
            {YOUTUBE_VIDEOS.map((video, index) => (
              <article
                key={video.id}
                style={{
                  ...styles.videoCard,
                  background: bgCard,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <div style={styles.videoWrapper}>
                  <iframe
                    src={`https://www.youtube.com/embed/${video.embedId}`}
                    title={videos[index].title}
                    style={styles.video}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <div style={styles.videoContent}>
                  <h3
                    style={{
                      ...styles.videoTitle,
                      color: textPrimary,
                    }}
                  >
                    {videos[index].title}
                  </h3>

                  <p
                    style={{
                      ...styles.videoDescription,
                      color: textSecondary,
                    }}
                  >
                    {videos[index].description}
                  </p>

                  <a
                    href={`https://www.youtube.com/watch?v=${video.embedId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...styles.youtubeLink,
                      color: accent,
                    }}
                  >
                    {content.watchYoutube}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

/* ============================================================
   SECTION TITLE
   ============================================================ */

function SectionTitle({ title, color }) {
  return (
    <h2
      style={{
        margin: "0 0 13px",
        fontSize: "18px",
        fontWeight: 800,
        color,
      }}
    >
      {title}
    </h2>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const styles = {
  /* =====================================================
     MAIN
  ===================================================== */

  main: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    padding: "16px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "26px",
  },

  /* =====================================================
     FIXED ANTIMATE AI LOGO
  ===================================================== */

  aiFloatingButton: {
    position: "fixed",
    top: "16px",
    left: "16px",
    width: "58px",
    height: "58px",
    borderRadius: "19px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    zIndex: 9999,
    overflow: "visible",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    transition:
      "transform 0.2s ease, box-shadow 0.2s ease",
  },

  aiFloatingGlow: {
    position: "absolute",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    filter: "blur(18px)",
    pointerEvents: "none",
    zIndex: -1,
  },

  aiFloatingLogo: {
    position: "relative",
    zIndex: 2,
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  aiOnlineDot: {
    position: "absolute",
    right: "-2px",
    bottom: "-2px",
    width: "11px",
    height: "11px",
    borderRadius: "50%",
    background: "#00d084",
    border: "2px solid",
    boxSizing: "border-box",
    zIndex: 5,
    boxShadow: "0 0 8px rgba(0,208,132,0.55)",
  },

  /* =====================================================
     GREETING
  ===================================================== */

  greeting: {
    margin: 0,
    fontSize: "23px",
    fontWeight: 800,
    lineHeight: 1.3,
  },

  greetingText: {
    margin: "7px 0 0",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  /* =====================================================
     HERO
  ===================================================== */

  heroCard: {
    overflow: "hidden",
    borderRadius: "22px",
  },

  heroImageWrapper: {
    position: "relative",
    width: "100%",
    height: "220px",
    overflow: "hidden",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  imageOverlay: {
    position: "absolute",
    left: "14px",
    bottom: "14px",
  },

  badge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "999px",
    color: "#07111f",
    fontSize: "10px",
    fontWeight: 800,
  },

  heroContent: {
    padding: "17px",
  },

  heroTitle: {
    margin: 0,
    fontSize: "19px",
    lineHeight: 1.4,
    fontWeight: 800,
  },

  heroDescription: {
    margin: "9px 0 13px",
    fontSize: "13px",
    lineHeight: 1.65,
  },

  primaryButton: {
    border: "none",
    borderRadius: "11px",
    padding: "9px 14px",
    color: "#07111f",
    fontWeight: 800,
    fontSize: "12px",
    cursor: "pointer",
  },

  /* =====================================================
     TIPS
  ===================================================== */

  horizontalScroll: {
    display: "flex",
    gap: "12px",
    overflowX: "auto",
    paddingBottom: "5px",
    scrollbarWidth: "none",
  },

  tipCard: {
    minWidth: "210px",
    maxWidth: "210px",
    padding: "11px",
    borderRadius: "18px",
    flexShrink: 0,
  },

  tipImage: {
    width: "100%",
    height: "105px",
    objectFit: "cover",
    borderRadius: "12px",
    display: "block",
  },

  tipTitle: {
    margin: "9px 0 5px",
    fontSize: "14px",
    lineHeight: 1.4,
  },

  tipDescription: {
    margin: 0,
    fontSize: "11px",
    lineHeight: 1.55,
  },

  /* =====================================================
     NEWS
  ===================================================== */

  newsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  newsCard: {
    display: "flex",
    gap: "12px",
    padding: "11px",
    borderRadius: "18px",
    alignItems: "center",
  },

  newsImage: {
    width: "92px",
    height: "92px",
    objectFit: "cover",
    borderRadius: "13px",
    flexShrink: 0,
  },

  newsContent: {
    minWidth: 0,
    flex: 1,
  },

  newsTitle: {
    margin: "4px 0",
    fontSize: "14px",
    lineHeight: 1.35,
  },

  newsDescription: {
    margin: 0,
    fontSize: "11px",
    lineHeight: 1.5,
  },

  /* =====================================================
     VIDEOS
  ===================================================== */

  videoList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  videoCard: {
    overflow: "hidden",
    borderRadius: "18px",
  },

  videoWrapper: {
    position: "relative",
    width: "100%",
    paddingBottom: "56.25%",
    height: 0,
  },

  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    border: "none",
  },

  videoContent: {
    padding: "13px",
  },

  videoTitle: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.4,
  },

  videoDescription: {
    margin: "6px 0 8px",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  youtubeLink: {
    fontSize: "11px",
    fontWeight: 800,
    textDecoration: "none",
  },
};

export default Home;