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

  const isKinyarwanda = t.home === "Ahabanza";

  const bgMain = isDark ? "#0b1220" : "#f7f9fc";
  const bgCard = isDark ? "#172033" : "#ffffff";
  const textPrimary = isDark ? "#f8fafc" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";
  const borderColor = isDark ? "#263449" : "#e5eaf0";

  const accent = "#00c896";
  const accentDark = "#00a982";

  const content = {
    greeting:
      t.homeGreeting ||
      (isKinyarwanda ? "Murakaza neza" : "Welcome"),

    greetingText:
      t.homeGreetingText ||
      (isKinyarwanda
        ? "Menya amakuru mashya, inyigisho n'uburyo bwagufasha guteza imbere ubworozi bwawe."
        : "Discover useful news, tips and ideas to help you improve your farm."),

    featured:
      t.featured ||
      (isKinyarwanda ? "IBY'INGENZI" : "FEATURED"),

    heroTitle:
      t.heroTitle ||
      (isKinyarwanda
        ? "Ikoranabuhanga rihindura ubworozi bw'inkoko"
        : "Technology transforming modern poultry farming"),

    heroDescription:
      t.heroDescription ||
      (isKinyarwanda
        ? "Menya uburyo ikoranabuhanga, amakuru y'igihe nyacyo n'ubwenge bukorano bishobora gufasha umworozi gufata ibyemezo byiza no kongera umusaruro."
        : "Discover how intelligent technology, real-time information and AI can help farmers make better decisions and improve productivity."),

    readMore:
      t.readMore ||
      (isKinyarwanda ? "Soma birambuye" : "Read more"),

    poultryTips:
      t.poultryTips ||
      (isKinyarwanda
        ? "🐥 Inyigisho ku Bworozi bw'Inkoko"
        : "🐥 Poultry Farming Tips"),

    agricultureNews:
      t.agricultureNews ||
      (isKinyarwanda
        ? "🌱 Amakuru y'Ubuhinzi n'Ikoranabuhanga"
        : "🌱 Agriculture & Technology News"),

    videos:
      t.educationVideos ||
      (isKinyarwanda
        ? "🎥 Amashusho y'Inyigisho"
        : "🎥 Educational Videos"),

    watchYoutube:
      t.watchYoutube ||
      (isKinyarwanda
        ? "Reba kuri YouTube ↗"
        : "Watch on YouTube ↗"),

    aiTitle:
      t.aiTitle ||
      (isKinyarwanda
        ? "Vugana na ANTIMATE AI"
        : "Talk to ANTIMATE AI"),

    aiDescription:
      t.aiDescription ||
      (isKinyarwanda
        ? "Ufite ikibazo ku bworozi? ANTIMATE AI iragufasha kubona inama mu buryo bworoshye."
        : "Have a question about your farm? ANTIMATE AI can help you with useful guidance."),

    aiButton:
      t.aiButton ||
      (isKinyarwanda ? "Tangira kuganira" : "Start conversation"),
  };

  const tips = isKinyarwanda
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

  const news = isKinyarwanda
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

  const videos = isKinyarwanda
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
        {/* GREETING */}
        <section>
          <h1 style={styles.greeting}>
            {content.greeting},{" "}
            {user?.name || (isKinyarwanda ? "Mworozi" : "Farmer")} 👋
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
            PROFESSIONAL ANTIMATE AI CARD
        ================================================= */}
        <section
          className="antimate-ai-card"
          style={{
            ...styles.aiCard,
            border: `1px solid ${
              isDark
                ? "rgba(0,200,150,0.28)"
                : "rgba(0,180,135,0.20)"
            }`,
            boxShadow: isDark
              ? "0 18px 45px rgba(0,0,0,0.28)"
              : "0 18px 45px rgba(0,120,90,0.10)",
          }}
        >
          {/* Decorative background */}
          <div style={styles.aiOrbOne} />
          <div style={styles.aiOrbTwo} />

          {/* Top row */}
          <div style={styles.aiTopRow}>
            <div style={styles.aiBrand}>
              <div style={styles.aiIconWrapper}>
                <div style={styles.aiIcon}>
                  <span style={styles.aiRobot}>✦</span>
                </div>

                <span style={styles.onlineDot} />
              </div>

              <div style={styles.aiBrandText}>
                <div style={styles.aiLabel}>
                  ANTIMATE AI
                </div>

                <div
                  style={{
                    ...styles.aiStatus,
                    color: isDark ? "#a7f3d0" : "#047857",
                  }}
                >
                  <span style={styles.statusDot} />
                  {isKinyarwanda
                    ? "AI irahari"
                    : "AI is online"}
                </div>
              </div>
            </div>

            <div
              style={{
                ...styles.aiBadge,
                background: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(255,255,255,0.72)",
                border: `1px solid ${
                  isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)"
                }`,
              }}
            >
              <span style={styles.sparkle}>✦</span>
              AI
            </div>
          </div>

          {/* Main content */}
          <div style={styles.aiMainContent}>
            <h2
              style={{
                ...styles.aiTitle,
                color: textPrimary,
              }}
            >
              {content.aiTitle}
            </h2>

            <p
              style={{
                ...styles.aiDescription,
                color: textSecondary,
              }}
            >
              {content.aiDescription}
            </p>
          </div>

          {/* Action */}
          <Link
            to="/antimate-ai"
            className="antimate-ai-button"
            style={styles.aiButton}
            aria-label={content.aiButton}
          >
            <span style={styles.aiButtonLeft}>
              <span style={styles.aiButtonIcon}>✦</span>

              <span>{content.aiButton}</span>
            </span>

            <span style={styles.aiArrow}>→</span>
          </Link>

          <div
            style={{
              ...styles.aiHint,
              color: isDark ? "#64748b" : "#94a3b8",
            }}
          >
            {isKinyarwanda
              ? "Inama z'ubworozi • Ibibazo • AI"
              : "Farming advice • Questions • AI"}
          </div>
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

      {/* =================================================
          AI BUTTON INTERACTION
      ================================================= */}
      <style>{`
        .antimate-ai-card {
          transition:
            transform 220ms ease,
            box-shadow 220ms ease,
            border-color 220ms ease;
        }

        .antimate-ai-card:hover {
          transform: translateY(-2px);
        }

        .antimate-ai-button {
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            filter 160ms ease;
        }

        .antimate-ai-button:hover {
          transform: translateY(-1px);
          filter: brightness(1.03);
          box-shadow: 0 14px 30px rgba(0, 180, 140, 0.28) !important;
        }

        .antimate-ai-button:active {
          transform: translateY(1px) scale(0.99);
        }

        .antimate-ai-button:focus-visible {
          outline: 3px solid rgba(0, 200, 150, 0.30);
          outline-offset: 3px;
        }
      `}</style>
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
     PROFESSIONAL ANTIMATE AI
  ===================================================== */

  aiCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "24px",
    padding: "18px",
    background:
      "linear-gradient(135deg, rgba(0,200,150,0.12) 0%, rgba(8,145,178,0.08) 48%, rgba(99,102,241,0.07) 100%)",
  },

  aiOrbOne: {
    position: "absolute",
    width: "190px",
    height: "190px",
    borderRadius: "50%",
    background: "rgba(0,200,150,0.12)",
    filter: "blur(65px)",
    top: "-110px",
    right: "-70px",
    pointerEvents: "none",
  },

  aiOrbTwo: {
    position: "absolute",
    width: "130px",
    height: "130px",
    borderRadius: "50%",
    background: "rgba(59,130,246,0.08)",
    filter: "blur(55px)",
    bottom: "-90px",
    left: "-50px",
    pointerEvents: "none",
  },

  aiTopRow: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  aiBrand: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  aiIconWrapper: {
    position: "relative",
    width: "50px",
    height: "50px",
    flexShrink: 0,
  },

  aiIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #00c896 0%, #0891b2 55%, #2563eb 100%)",
    boxShadow:
      "0 10px 26px rgba(0,160,130,0.25)",
  },

  aiRobot: {
    color: "#ffffff",
    fontSize: "25px",
    fontWeight: 900,
    lineHeight: 1,
  },

  onlineDot: {
    position: "absolute",
    width: "11px",
    height: "11px",
    right: "-2px",
    bottom: "-2px",
    borderRadius: "50%",
    background: "#22c55e",
    border: "3px solid #ffffff",
    boxSizing: "content-box",
  },

  aiBrandText: {
    minWidth: 0,
  },

  aiLabel: {
    color: "#00a982",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1.3px",
    lineHeight: 1.2,
  },

  aiStatus: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginTop: "5px",
    fontSize: "10px",
    fontWeight: 700,
  },

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 0 3px rgba(34,197,94,0.10)",
  },

  aiBadge: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "6px 9px",
    borderRadius: "999px",
    color: "#64748b",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "0.5px",
    flexShrink: 0,
  },

  sparkle: {
    color: "#00b486",
    fontSize: "12px",
  },

  aiMainContent: {
    position: "relative",
    zIndex: 2,
    padding: "18px 2px 16px",
  },

  aiTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 850,
    lineHeight: 1.3,
    letterSpacing: "-0.25px",
  },

  aiDescription: {
    margin: "7px 0 0",
    maxWidth: "600px",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  aiButton: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    textDecoration: "none",
    padding: "13px 15px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #00c896 0%, #00b889 45%, #0891b2 100%)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 850,
    boxShadow:
      "0 10px 24px rgba(0,160,130,0.20)",
  },

  aiButtonLeft: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  aiButtonIcon: {
    width: "25px",
    height: "25px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.16)",
    fontSize: "12px",
  },

  aiArrow: {
    fontSize: "19px",
    fontWeight: 400,
    lineHeight: 1,
  },

  aiHint: {
    position: "relative",
    zIndex: 2,
    marginTop: "9px",
    textAlign: "center",
    fontSize: "9px",
    fontWeight: 600,
    letterSpacing: "0.15px",
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