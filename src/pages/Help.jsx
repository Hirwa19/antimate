import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import { useAppSettings } from "../context/AppSettingsContext";

function Help() {
  const { isDark, text } = useAppSettings();

  const commonProblems = [
    {
      question: "How to buy a plan?",
      answer: "Go to Profile → Plan, choose your package, then click Pay.",
    },
    {
      question: "How to edit my profile?",
      answer: "Go to Profile → Settings → Edit Profile.",
    },
    {
      question: "How to get brooder info via SMS?",
      answer: "SMS support is available on Bronze and Silver plans.",
    },
    {
      question: "How to recover my system password?",
      answer: "Contact support using WhatsApp or Live Chat.",
    },
    {
      question: "How to add a new system?",
      answer: "Go to Systems page, enter name and serial number, then click Add System.",
    },
  ];

  const openWhatsApp = () => {
    window.open(
      "https://wa.me/250798698431?text=Hello%20Smart%20Brooder%20Support",
      "_blank"
    );
  };

  const openLiveChat = () => {
    alert("Live chat feature is coming soon.");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: isDark ? "#0f172a" : "#f8fafc",
      color: isDark ? "white" : "#0f172a",
      padding: "20px",
      paddingBottom: "100px",
      fontFamily: "Arial",
    }}>
      <AppHeader title={text.help} />

      <div style={cardStyle(isDark)}>
        <h2>{text.commonProblems}</h2>
        <p style={{ color: "#94a3b8" }}>
          Find quick answers to common Smart Brooder problems.
        </p>

        {commonProblems.map((item, index) => (
          <div key={index} style={{
            background: isDark ? "#0f172a" : "#f1f5f9",
            borderRadius: "15px",
            padding: "15px",
            marginTop: "12px",
          }}>
            <h3 style={{ marginTop: 0 }}>
              {index + 1}. {item.question}
            </h3>
            <p style={{ color: isDark ? "#cbd5e1" : "#334155" }}>
              {item.answer}
            </p>
          </div>
        ))}
      </div>

      <div style={cardStyle(isDark)}>
        <h2>Need more help?</h2>
        <p style={{ color: "#94a3b8" }}>
          Talk to support or join live farmer discussions.
        </p>

        <button onClick={openWhatsApp} style={whatsappButton}>
          🟢 {text.whatsappSupport}
        </button>

        <button onClick={openLiveChat} style={chatButton}>
          💬 Live Chat Community
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

const cardStyle = (isDark) => ({
  background: isDark ? "#1e293b" : "white",
  borderRadius: "20px",
  padding: "20px",
  marginBottom: "20px",
  boxShadow: isDark ? "none" : "0 10px 30px rgba(0,0,0,0.08)",
});

const whatsappButton = {
  width: "100%",
  padding: "14px",
  borderRadius: "14px",
  border: "none",
  background: "#25D366",
  color: "white",
  fontWeight: "bold",
  fontSize: "16px",
  marginTop: "15px",
  cursor: "pointer",
};

const chatButton = {
  width: "100%",
  padding: "14px",
  borderRadius: "14px",
  border: "none",
  background: "#38bdf8",
  color: "#0f172a",
  fontWeight: "bold",
  fontSize: "16px",
  marginTop: "12px",
  cursor: "pointer",
};

export default Help;