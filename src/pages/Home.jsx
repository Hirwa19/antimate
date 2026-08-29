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
   ANTIMATE AI FLOATING ICON
   O-SHAPED INTELLIGENT WHEEL
============================================================ */

function AntimateAIFloatingButton({ isDark }) {
  return (
    <>
      <style>{`
        @keyframes antimateWheelRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes antimateWheelReverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes antimatePulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.75;
          }

          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        @keyframes antimateGlow {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.92);
          }

          50% {
            opacity: 0.7;
            transform: scale(1.08);
          }
        }

        @keyframes antimateDot {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.8);
          }

          50% {
            opacity: 1;
            transform: scale(1.25);
          }
        }

        .antimate-ai-floating {
          animation: antimatePulse 3s ease-in-out infinite;
        }

        .antimate-ai-wheel {
          animation: antimateWheelRotate 8s linear infinite;
        }

        .antimate-ai-inner-wheel {
          animation: antimateWheelReverse 5s linear infinite;
        }

        .antimate-ai-glow {
          animation: antimateGlow 3s ease-in-out infinite;
        }

        .antimate-ai-dot {
          animation: antimateDot 1.8s ease-in-out infinite;
        }

        .antimate-ai-floating:hover {
          animation-play-state: paused;
          transform: scale(1.1);
        }

        .antimate-ai-floating:active {
          transform: scale(0.94);
        }

        @media (max-width: 480px) {
          .antimate-ai-floating {
            right: 16px !important;
            bottom: 82px !important;
          }
        }
      `}</style>

      <Link
        to="/antimate-ai"
        aria-label="Open ANTIMATE AI"
        title="ANTIMATE AI"
        className="antimate-ai-floating"
        style={{
          position: "fixed",
          right: "22px",
          bottom: "88px",
          width: "64px",
          height: "64px",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          borderRadius: "50%",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* OUTER GLOW */}
        <div
          className="antimate-ai-glow"
          style={{
            position: "absolute",
            inset: "-10px",
            borderRadius: "50%",
            background:
              "conic-gradient(from 0deg, #00F5A0, #00D9FF, #7C3AED, #FF3CAC, #00F5A0)",
            filter: "blur(12px)",
            zIndex: 0,
          }}
        />

        {/* DARK / LIGHT BASE */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: isDark
              ? "rgba(10, 18, 30, 0.96)"
              : "rgba(255, 255, 255, 0.97)",
            border: isDark
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(15,23,42,0.10)",
            boxShadow: isDark
              ? "0 12px 35px rgba(0,0,0,0.50), inset 0 0 18px rgba(0,255,190,0.06)"
              : "0 12px 30px rgba(15,23,42,0.20), inset 0 0 18px rgba(0,200,150,0.05)",
            zIndex: 1,
          }}
        />

        {/* ROTATING OUTER WHEEL */}
        <svg
          className="antimate-ai-wheel"
          width="58"
          height="58"
          viewBox="0 0 58 58"
          style={{
            position: "absolute",
            zIndex: 2,
            overflow: "visible",
          }}
        >
          <defs>
            <linearGradient
              id="antimateGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#00F5A0" />
              <stop offset="25%" stopColor="#00D9FF" />
              <stop offset="50%" stopColor="#7C3AED" />
              <stop offset="75%" stopColor="#FF3CAC" />
              <stop offset="100%" stopColor="#00F5A0" />
            </linearGradient>

            <filter id="antimateWheelGlow">
              <feGaussianBlur
                stdDeviation="1.5"
                result="coloredBlur"
              />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Main O ring */}
          <circle
            cx="29"
            cy="29"
            r="22"
            fill="none"
            stroke="url(#antimateGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="28 8 12 8"
            filter="url(#antimateWheelGlow)"
          />

          {/* Secondary ring */}
          <circle
            cx="29"
            cy="29"
            r="17"
            fill="none"
            stroke="url(#antimateGradient)"
            strokeWidth="1.5"
            strokeOpacity="0.42"
            strokeDasharray="3 6"
          />

          {/* Intelligent wheel nodes */}
          <circle
            cx="29"
            cy="6"
            r="2"
            fill="#00F5A0"
          />

          <circle
            cx="51"
            cy="29"
            r="2"
            fill="#00D9FF"
          />

          <circle
            cx="29"
            cy="52"
            r="2"
            fill="#FF3CAC"
          />

          <circle
            cx="7"
            cy="29"
            r="2"
            fill="#7C3AED"
          />
        </svg>

        {/* INNER ROTATING O */}
        <svg
          className="antimate-ai-inner-wheel"
          width="42"
          height="42"
          viewBox="0 0 42 42"
          style={{
            position: "absolute",
            zIndex: 3,
          }}
        >
          <defs>
            <linearGradient
              id="antimateInnerGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#00D9FF" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#00F5A0" />
            </linearGradient>
          </defs>

          <circle
            cx="21"
            cy="21"
            r="14"
            fill="none"
            stroke="url(#antimateInnerGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="9 5"
          />
        </svg>

        {/* CENTER AI CORE */}
        <div
          style={{
            position: "absolute",
            zIndex: 4,
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isDark
              ? "radial-gradient(circle, #102a32 0%, #07131c 70%)"
              : "radial-gradient(circle, #eafff8 0%, #ffffff 70%)",
            boxShadow:
              "0 0 12px rgba(0,245,160,0.45), 0 0 24px rgba(0,217,255,0.18)",
          }}
        >
          <div
            className="antimate-ai-dot"
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #00F5A0, #00D9FF)",
              boxShadow:
                "0 0 8px rgba(0,245,160,0.9)",
            }}
          />
        </div>
      </Link>
    </>
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
      <AppHeader title={t.home || "Home"} />

      <main style={styles.main}>

        {/* =================================================
            GREETING
        ================================================= */}

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

        {/* =================================================
            FEATURED ARTICLE
        ================================================= */}

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

        {/* =================================================
            POULTRY TIPS
        ================================================= */}

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

        {/* =================================================
            AGRICULTURE NEWS
        ================================================= */}

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

        {/* =================================================
            VIDEOS
        ================================================= */}

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

      {/* =====================================================
          ANTIMATE AI FLOATING LOGO
          Fixed bottom-right
      ===================================================== */}

      <AntimateAIFloatingButton isDark={isDark} />

      {/* =====================================================
          BOTTOM NAV
      ===================================================== */}

      <BottomNav />
    </div>
  );
}

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

const styles = {
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