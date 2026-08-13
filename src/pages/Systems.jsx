import React,{useEffect,useState} from "react";

const API_URL=import.meta.env.VITE_API_URL||"http://localhost:3000/api";

const translations={
  en:{
    title:"BR System",
    subtitle:"Configure your brooding system",
    birthDate:"Chicks Birth Date",
    selectDate:"Select birth date",
    chicksType:"Chicks Type",
    selectType:"Select chicks type",
    sasso:"SASSO",
    broiler:"BROILER",
    number:"Number of Chickens",
    numberPlaceholder:"Enter number of chickens",
    area:"Brooding Room Area",
    areaPlaceholder:"Enter room area",
    save:"Save Configuration",
    saving:"Saving...",
    current:"Current Configuration",
    age:"Chicks Age",
    days:"days",
    chickens:"chickens",
    success:"Configuration saved successfully.",
    error:"Failed to save configuration.",
    required:"Please complete all fields.",
    invalidNumber:"Number of chickens must be greater than 0.",
    invalidArea:"Room area must be greater than 0.",
    close:"Close",
    chooseType:"Choose Chicks Type",
    noConfig:"No configuration saved yet.",
    loading:"Loading..."
  },
  rw:{
    title:"BR System",
    subtitle:"Shyiraho configuration ya brooding system yawe",
    birthDate:"Itariki imishwi yavukiyeho",
    selectDate:"Hitamo itariki yavukiyeho",
    chicksType:"Ubwoko bw'imishwi",
    selectType:"Hitamo ubwoko bw'imishwi",
    sasso:"SASSO",
    broiler:"BROILER",
    number:"Umubare w'imishwi",
    numberPlaceholder:"Andika umubare w'imishwi",
    area:"Ubuso bw'icyumba cya brooding",
    areaPlaceholder:"Andika ubuso bw'icyumba",
    save:"Bika Configuration",
    saving:"Birabikwa...",
    current:"Configuration iriho",
    age:"Imyaka y'imishwi",
    days:"iminsi",
    chickens:"imishwi",
    success:"Configuration yabitswe neza.",
    error:"Kubika configuration byanze.",
    required:"Uzuza amakuru yose.",
    invalidNumber:"Umubare w'imishwi ugomba kurenza 0.",
    invalidArea:"Ubuso bw'icyumba bugomba kurenza 0.",
    close:"Funga",
    chooseType:"Hitamo ubwoko bw'imishwi",
    noConfig:"Nta configuration irabikwa.",
    loading:"Birimo gufunguka..."
  }
};

export default function Systems(){

  const getLanguage=()=>{
    const value=
      localStorage.getItem("language")||
      localStorage.getItem("lang")||
      "en";

    return value.toLowerCase().startsWith("rw")?"rw":"en";
  };

  const [language,setLanguage]=useState(getLanguage());

  const [form,setForm]=useState({
    chicksBirthDate:"",
    chicksType:"",
    numberOfChickens:"",
    broodingRoomArea:""
  });

  const [configuration,setConfiguration]=useState(null);
  const [typePopup,setTypePopup]=useState(false);
  const [loading,setLoading]=useState(false);
  const [loadingConfig,setLoadingConfig]=useState(true);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  const text=translations[language];

  useEffect(()=>{
    loadConfiguration();

    const handleLanguageChange=()=>{
      setLanguage(getLanguage());
    };

    window.addEventListener(
      "languageChanged",
      handleLanguageChange
    );

    window.addEventListener(
      "storage",
      handleLanguageChange
    );

    return()=>{
      window.removeEventListener(
        "languageChanged",
        handleLanguageChange
      );

      window.removeEventListener(
        "storage",
        handleLanguageChange
      );
    };
  },[]);

  const loadConfiguration=async()=>{
    try{
      setLoadingConfig(true);

      const token=localStorage.getItem("token");

      const response=await fetch(
        `${API_URL}/systems/configuration`,
        {
          method:"GET",
          headers:{
            "Content-Type":"application/json",
            ...(token
              ?{Authorization:`Bearer ${token}`}
              :{})
          }
        }
      );

      if(!response.ok){
        throw new Error("Failed to load configuration");
      }

      const data=await response.json();

      if(data.configuration){
        const saved=data.configuration;

        setConfiguration(saved);

        setForm({
          chicksBirthDate:saved.chicksBirthDate
            ?new Date(saved.chicksBirthDate)
              .toISOString()
              .split("T")[0]
            :"",

          chicksType:saved.chicksType||"",

          numberOfChickens:
            saved.numberOfChickens||"",

          broodingRoomArea:
            saved.broodingRoomArea||""
        });
      }

    }catch(err){
      console.error(
        "LOAD SYSTEM CONFIG ERROR:",
        err
      );
    }finally{
      setLoadingConfig(false);
    }
  };

  const selectType=(type)=>{
    setForm(prev=>({
      ...prev,
      chicksType:type
    }));

    setTypePopup(false);
    setMessage("");
    setError("");
  };

  const handleChange=(event)=>{
    const {name,value}=event.target;

    setForm(prev=>({
      ...prev,
      [name]:value
    }));

    setMessage("");
    setError("");
  };

  const handleSave=async(event)=>{
    event.preventDefault();

    setMessage("");
    setError("");

    if(
      !form.chicksBirthDate||
      !form.chicksType||
      !form.numberOfChickens||
      !form.broodingRoomArea
    ){
      setError(text.required);
      return;
    }

    if(Number(form.numberOfChickens)<=0){
      setError(text.invalidNumber);
      return;
    }

    if(Number(form.broodingRoomArea)<=0){
      setError(text.invalidArea);
      return;
    }

    try{
      setLoading(true);

      const token=localStorage.getItem("token");

      const response=await fetch(
        `${API_URL}/systems/configuration`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            ...(token
              ?{Authorization:`Bearer ${token}`}
              :{})
          },
          body:JSON.stringify({
            chicksBirthDate:
              form.chicksBirthDate,

            chicksType:
              form.chicksType,

            numberOfChickens:
              Number(form.numberOfChickens),

            broodingRoomArea:
              Number(form.broodingRoomArea)
          })
        }
      );

      const data=await response.json();

      if(!response.ok){
        throw new Error(
          data.message||text.error
        );
      }

      setConfiguration(data.configuration);

      setMessage(
        data.message||text.success
      );

      window.dispatchEvent(
        new CustomEvent(
          "br-system-config-updated",
          {
            detail:data.configuration
          }
        )
      );

    }catch(err){
      console.error(
        "SAVE SYSTEM CONFIG ERROR:",
        err
      );

      setError(
        err.message||text.error
      );
    }finally{
      setLoading(false);
    }
  };

  const formatDate=(date)=>{
    if(!date)return"-";

    return new Date(date).toLocaleDateString(
      language==="rw"
        ?"rw-RW"
        :"en-US",
      {
        year:"numeric",
        month:"short",
        day:"numeric"
      }
    );
  };

  return(
    <>
      <style>{`

        .systems-page{
          min-height:100vh;
          width:100%;
          padding:32px;
          box-sizing:border-box;
          background:
            var(--background-color,
            var(--bg-primary,#050b14));
          color:
            var(--text-color,
            var(--text-primary,#ffffff));
          font-family:
            var(--font-family,
            Inter,system-ui,-apple-system,
            BlinkMacSystemFont,"Segoe UI",sans-serif);
        }

        .systems-container{
          width:100%;
          max-width:1100px;
          margin:0 auto;
        }

        .systems-header{
          margin-bottom:28px;
        }

        .systems-title{
          margin:0;
          font-size:30px;
          font-weight:700;
          letter-spacing:-.5px;
          color:
            var(--text-primary,#ffffff);
        }

        .systems-subtitle{
          margin:7px 0 0;
          color:
            var(--text-secondary,#8b96a8);
          font-size:14px;
        }

        .systems-layout{
          display:grid;
          grid-template-columns:
            minmax(0,1.5fr)
            minmax(280px,.8fr);
          gap:22px;
          align-items:start;
        }

        .systems-card{
          background:
            var(--card-background,
            rgba(10,18,32,.88));
          border:
            1px solid
            var(--border-color,
            rgba(255,255,255,.08));
          border-radius:18px;
          padding:24px;
          box-sizing:border-box;
          box-shadow:
            0 12px 40px rgba(0,0,0,.12);
        }

        .systems-form{
          display:flex;
          flex-direction:column;
          gap:20px;
        }

        .systems-field{
          display:flex;
          flex-direction:column;
          gap:8px;
        }

        .systems-label{
          font-size:13px;
          font-weight:600;
          color:
            var(--text-secondary,#aeb7c5);
        }

        .systems-input,
        .systems-select-button{
          width:100%;
          height:48px;
          box-sizing:border-box;
          border-radius:11px;
          border:
            1px solid
            var(--input-border,
            rgba(255,255,255,.1));
          background:
            var(--input-background,
            rgba(0,0,0,.18));
          color:
            var(--text-primary,#fff);
          outline:none;
          font-size:14px;
          transition:.2s ease;
        }

        .systems-input{
          padding:0 14px;
        }

        .systems-input:focus,
        .systems-select-button:focus{
          border-color:
            var(--primary-color,#00c2ff);
          box-shadow:
            0 0 0 3px
            rgba(0,194,255,.08);
        }

        .systems-input::placeholder{
          color:#687386;
        }

        .systems-input[type="date"]{
          color-scheme:dark;
          cursor:pointer;
        }

        .systems-select-button{
          padding:0 14px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          cursor:pointer;
          text-align:left;
        }

        .systems-select-value{
          color:#fff;
        }

        .systems-select-placeholder{
          color:#687386;
        }

        .systems-chevron{
          color:#7c8798;
          font-size:18px;
        }

        .systems-save{
          width:100%;
          height:48px;
          border:0;
          border-radius:11px;
          background:
            var(--primary-color,#00c2ff);
          color:
            var(--primary-text,#031018);
          font-size:14px;
          font-weight:700;
          cursor:pointer;
          transition:.2s ease;
          margin-top:3px;
        }

        .systems-save:hover{
          filter:brightness(1.08);
          transform:translateY(-1px);
        }

        .systems-save:disabled{
          opacity:.55;
          cursor:not-allowed;
          transform:none;
        }

        .systems-message{
          padding:12px 14px;
          border-radius:10px;
          font-size:13px;
        }

        .systems-success{
          background:rgba(34,197,94,.1);
          border:1px solid rgba(34,197,94,.2);
          color:#4ade80;
        }

        .systems-error{
          background:rgba(239,68,68,.1);
          border:1px solid rgba(239,68,68,.2);
          color:#f87171;
        }

        .systems-current-title{
          margin:0 0 18px;
          font-size:16px;
          font-weight:650;
        }

        .systems-config-list{
          display:flex;
          flex-direction:column;
          gap:10px;
        }

        .systems-config-item{
          padding:14px;
          border-radius:12px;
          background:
            var(--item-background,
            rgba(255,255,255,.035));
          border:
            1px solid
            rgba(255,255,255,.045);
        }

        .systems-config-label{
          display:block;
          font-size:11px;
          color:#707b8d;
          margin-bottom:5px;
        }

        .systems-config-value{
          font-size:14px;
          font-weight:600;
          color:#fff;
        }

        .systems-type-badge{
          display:inline-flex;
          align-items:center;
          padding:5px 9px;
          border-radius:7px;
          background:rgba(0,194,255,.1);
          border:1px solid rgba(0,194,255,.16);
          color:#38d5ff;
          font-size:12px;
        }

        .systems-empty{
          color:#697588;
          font-size:13px;
          line-height:1.6;
        }

        .systems-loading{
          display:flex;
          align-items:center;
          justify-content:center;
          min-height:120px;
          color:#718096;
          font-size:13px;
        }

        .systems-modal-overlay{
          position:fixed;
          inset:0;
          z-index:9999;
          background:rgba(0,0,0,.58);
          backdrop-filter:blur(5px);
          display:flex;
          align-items:center;
          justify-content:center;
          padding:20px;
          box-sizing:border-box;
        }

        .systems-modal{
          width:100%;
          max-width:390px;
          background:
            var(--card-background,
            #0a1220);
          border:
            1px solid
            var(--border-color,
            rgba(255,255,255,.1));
          border-radius:18px;
          padding:20px;
          box-sizing:border-box;
          box-shadow:0 25px 80px rgba(0,0,0,.35);
        }

        .systems-modal-header{
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:18px;
        }

        .systems-modal-title{
          margin:0;
          font-size:17px;
          font-weight:650;
        }

        .systems-modal-close{
          width:34px;
          height:34px;
          border:0;
          border-radius:8px;
          background:rgba(255,255,255,.05);
          color:#9aa5b5;
          cursor:pointer;
          font-size:18px;
        }

        .systems-type-options{
          display:flex;
          flex-direction:column;
          gap:10px;
        }

        .systems-type-option{
          width:100%;
          min-height:58px;
          border-radius:12px;
          border:1px solid rgba(255,255,255,.08);
          background:rgba(255,255,255,.035);
          color:#fff;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 16px;
          box-sizing:border-box;
          transition:.2s ease;
          text-align:left;
        }

        .systems-type-option:hover{
          border-color:var(--primary-color,#00c2ff);
          background:rgba(0,194,255,.07);
        }

        .systems-type-option-number{
          width:28px;
          height:28px;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          background:rgba(255,255,255,.06);
          color:#9ba7b8;
          font-size:12px;
          margin-right:10px;
        }

        .systems-type-option-left{
          display:flex;
          align-items:center;
          font-size:14px;
          font-weight:600;
        }

        .systems-type-option-arrow{
          color:#647184;
          font-size:18px;
        }

        @media(max-width:800px){
          .systems-page{
            padding:22px 16px;
          }

          .systems-layout{
            grid-template-columns:1fr;
          }

          .systems-title{
            font-size:25px;
          }
        }

        @media(max-width:480px){
          .systems-page{
            padding:18px 12px;
          }

          .systems-card{
            padding:18px;
            border-radius:15px;
          }

          .systems-title{
            font-size:23px;
          }
        }

      `}</style>

      <main className="systems-page">
        <div className="systems-container">

          <header className="systems-header">
            <h1 className="systems-title">
              {text.title}
            </h1>

            <p className="systems-subtitle">
              {text.subtitle}
            </p>
          </header>

          <div className="systems-layout">

            <section className="systems-card">

              <form
                className="systems-form"
                onSubmit={handleSave}
              >

                <div className="systems-field">

                  <label className="systems-label">
                    {text.birthDate}
                  </label>

                  <input
                    className="systems-input"
                    type="date"
                    name="chicksBirthDate"
                    value={form.chicksBirthDate}
                    onChange={handleChange}
                    max={
                      new Date()
                        .toISOString()
                        .split("T")[0]
                    }
                  />

                </div>

                <div className="systems-field">

                  <label className="systems-label">
                    {text.chicksType}
                  </label>

                  <button
                    type="button"
                    className="systems-select-button"
                    onClick={()=>setTypePopup(true)}
                  >
                    <span
                      className={
                        form.chicksType
                          ?"systems-select-value"
                          :"systems-select-placeholder"
                      }
                    >
                      {form.chicksType
                        ?form.chicksType
                        :text.selectType}
                    </span>

                    <span className="systems-chevron">
                      ›
                    </span>
                  </button>

                </div>

                <div className="systems-field">

                  <label className="systems-label">
                    {text.number}
                  </label>

                  <input
                    className="systems-input"
                    type="number"
                    name="numberOfChickens"
                    min="1"
                    step="1"
                    value={form.numberOfChickens}
                    onChange={handleChange}
                    placeholder={text.numberPlaceholder}
                  />

                </div>

                <div className="systems-field">

                  <label className="systems-label">
                    {text.area}
                  </label>

                  <input
                    className="systems-input"
                    type="number"
                    name="broodingRoomArea"
                    min="0.1"
                    step="0.1"
                    value={form.broodingRoomArea}
                    onChange={handleChange}
                    placeholder={text.areaPlaceholder}
                  />

                </div>

                {message&&(
                  <div className="systems-message systems-success">
                    {message}
                  </div>
                )}

                {error&&(
                  <div className="systems-message systems-error">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="systems-save"
                  disabled={loading}
                >
                  {loading
                    ?text.saving
                    :text.save}
                </button>

              </form>

            </section>

            <aside className="systems-card">

              <h2 className="systems-current-title">
                {text.current}
              </h2>

              {loadingConfig?(
                <div className="systems-loading">
                  {text.loading}
                </div>
              ):configuration?(
                <div className="systems-config-list">

                  <div className="systems-config-item">
                    <span className="systems-config-label">
                      {text.birthDate}
                    </span>

                    <span className="systems-config-value">
                      {formatDate(
                        configuration.chicksBirthDate
                      )}
                    </span>
                  </div>

                  <div className="systems-config-item">
                    <span className="systems-config-label">
                      {text.chicksType}
                    </span>

                    <span className="systems-type-badge">
                      {configuration.chicksType}
                    </span>
                  </div>

                  <div className="systems-config-item">
                    <span className="systems-config-label">
                      {text.number}
                    </span>

                    <span className="systems-config-value">
                      {configuration.numberOfChickens}{" "}
                      {text.chickens}
                    </span>
                  </div>

                  <div className="systems-config-item">
                    <span className="systems-config-label">
                      {text.age}
                    </span>

                    <span className="systems-config-value">
                      {configuration.chicksAge}{" "}
                      {text.days}
                    </span>
                  </div>

                  <div className="systems-config-item">
                    <span className="systems-config-label">
                      {text.area}
                    </span>

                    <span className="systems-config-value">
                      {configuration.broodingRoomArea} m²
                    </span>
                  </div>

                </div>
              ):(
                <p className="systems-empty">
                  {text.noConfig}
                </p>
              )}

            </aside>

          </div>
        </div>
      </main>

      {typePopup&&(
        <div
          className="systems-modal-overlay"
          onClick={()=>setTypePopup(false)}
        >

          <div
            className="systems-modal"
            onClick={e=>e.stopPropagation()}
          >

            <div className="systems-modal-header">

              <h3 className="systems-modal-title">
                {text.chooseType}
              </h3>

              <button
                type="button"
                className="systems-modal-close"
                onClick={()=>setTypePopup(false)}
              >
                ×
              </button>

            </div>

            <div className="systems-type-options">

              <button
                type="button"
                className="systems-type-option"
                onClick={()=>selectType("SASSO")}
              >
                <span className="systems-type-option-left">
                  <span className="systems-type-option-number">
                    1
                  </span>

                  {text.sasso}
                </span>

                <span className="systems-type-option-arrow">
                  ›
                </span>
              </button>

              <button
                type="button"
                className="systems-type-option"
                onClick={()=>selectType("BROILER")}
              >
                <span className="systems-type-option-left">
                  <span className="systems-type-option-number">
                    2
                  </span>

                  {text.broiler}
                </span>

                <span className="systems-type-option-arrow">
                  ›
                </span>
              </button>

            </div>

          </div>

        </div>
      )}

    </>
  );
}