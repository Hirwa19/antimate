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
      (t.home === "Ahabanza" ? "Murakaza neza" : "Welcome"),

    greetingText:
      t.homeGreetingText ||
      (t.home === "Ahabanza"
        ? "Menya amakuru mashya, inyigisho n'uburyo bwagufasha guteza imbere ubworozi bwawe."
        : "Discover useful news, tips and ideas to help you improve your farm."),

    featured:
      t.featured ||
      (t.home === "Ahabanza" ? "IBY'INGENZI" : "FEATURED"),

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
      (t.home === "Ahabanza" ? "Soma birambuye" : "Read more"),

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
            title: "Uko warinda inkoko indwara y'umuraramo",
            description:
              "Inyigisho igufasha kumenya uburyo bwo kurinda inkoko indwara y'umuraramo.",
          },
          {
            title: "Uko watangira ubworozi bw'inkoko",
            description:
              "Urugero rw'umworozi wateje imbere ubworozi bwe mu Rwanda.",
          },
          {
            title: "Ubworozi bw'inkoko bugezweho",
            description:
              "Menya uburyo bugezweho bushobora kongera umusaruro w'amagi n'inyama.",
          },
        ]
      : [
          {
            title: "How to protect chickens from Newcastle disease",
            description:
              "Learn practical ways to protect your poultry from Newcastle disease.",
          },
          {
            title: "How to start poultry farming",
            description:
              "Learn from a poultry farmer who developed a successful farming business.",
          },
          {
            title: "Modern poultry farming",
            description:
              "Discover modern methods that can improve egg and meat production.",
          },
        ];

  return (
    <>
      {/* =========================================================
          ANTIMATE AI FLOATING ICON ANIMATION
      ========================================================= */}
      <style>{`
        @keyframes antimateAIColorFlow {
          0% {
            transform: rotate(0deg);
          }

          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes antimateAIGlow {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(0.96);
          }

          50% {
            opacity: 0.85;
            transform: scale(1.04);
          }
        }

        @keyframes antimateAIFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        .antimate-ai-float {
          position: fixed;
          right: 20px;
          bottom: 82px;
          width: 64px;
          height: 64px;
          z-index: 9999;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          animation: antimateAIFloat 4s ease-in-out infinite;
          -webkit-tap-highlight-color: transparent;
        }

        .antimate-ai-float::before {
          content: "";
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          background:
            conic-gradient(
              from 0deg,
              #00c896,
              #00e5ff,
              #6366f1,
              #a855f7,
              #ec4899,
              #00c896
            );
          animation: antimateAIColorFlow 3.5s linear infinite;
          filter: blur(7px);
          opacity: 0.55;
          z-index: -2;
        }

        .antimate-ai-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          overflow: hidden;
          background: #0b1220;
          box-shadow:
            0 10px 28px rgba(0, 0, 0, 0.25),
            0 0 22px rgba(0, 200, 150, 0.20);
        }

        .antimate-ai-ring::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          padding: 3px;
          background:
            conic-gradient(
              from 0deg,
              #00c896,
              #00e5ff,
              #6366f1,
              #a855f7,
              #ec4899,
              #00c896
            );
          animation: antimateAIColorFlow 3.5s linear infinite;
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .antimate-ai-inner {
          position: absolute;
          inset: 7px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(
              circle at 35% 30%,
              rgba(0, 200, 150, 0.16),
              transparent 45%
            ),
            #0f172a;
        }

        .antimate-ai-text {
          position: relative;
          z-index: 3;
          color: #ffffff;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: -0.5px;
          line-height: 1;
          font-family:
            Inter,
            Arial,
            sans-serif;
          user-select: none;
        }

        .antimate-ai-float:hover {
          animation-play-state: paused;
          transform: scale(1.08);
        }

        .antimate-ai-float:hover::before {
          animation-duration: 1.8s;
          opacity: 0.85;
        }

        .antimate-ai-float:active {
          transform: scale(0.94);
        }

        .antimate-ai-float:focus-visible {
          outline: 3px solid rgba(0, 200, 150, 0.45);
          outline-offset: 4px;
        }

        @media (max-width: 600px) {
          .antimate-ai-float {
            right: 16px;
            bottom: 76px;
            width: 58px;
            height: 58px;
          }

          .antimate-ai-inner {
            inset: 6px;
          }

          .antimate-ai-text {
            font-size: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .antimate-ai-float,
          .antimate-ai-float::before,
          .antimate-ai-ring::before {
            animation: none;
          }
        }
      `}</style>

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
          {/* =====================================================
              GREETING
          ===================================================== */}
          <section>
            <h1 style={styles.greeting}>
              {content.greeting},{" "}
              {user?.name ||
                (t.home === "Ahabanza" ? "Mworozi" : "Farmer")}{" "}
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

          {/* =====================================================
              FEATURED ARTICLE
          ===================================================== */}
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

          {/* =====================================================
              POULTRY TIPS
          ===================================================== */}
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

          {/* =====================================================
              AGRICULTURE NEWS
          ===================================================== */}
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

          {/* =====================================================
              VIDEOS
          ===================================================== */}
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

        {/* =========================================================
            ANTIMATE AI FLOATING BUTTON
            Fixed bottom-right
        ========================================================= */}
        <Link
          to="/antimate-ai"
          className="antimate-ai-float"
          aria-label="Open ANTIMATE AI"
          title="ANTIMATE AI"
        >
          <div className="antimate-ai-ring">
            <div className="antimate-ai-inner">
              <span className="antimate-ai-text">
                AI
              </span>
            </div>
          </div>
        </Link>

        <BottomNav />
      </div>
    </>
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