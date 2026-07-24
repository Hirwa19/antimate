import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";

import {
  Cpu,
  Wifi,
  Radio,
  Activity,
  Database,
  ShieldCheck,
  X,
} from "lucide-react";

import "./Login.css";


function Login(){

const navigate = useNavigate();


const [showLogin,setShowLogin] = useState(false);


const [identifier,setIdentifier]=useState("");
const [password,setPassword]=useState("");

const [showPassword,setShowPassword]=useState(false);

const [loading,setLoading]=useState(false);

const [message,setMessage]=useState("");





async function handleLogin(e){

e.preventDefault();


try{

setLoading(true);

setMessage("");



const res =
await loginUser({

identifier,

password

});



localStorage.setItem(
"token",
res.data.token
);


localStorage.setItem(
"user",
JSON.stringify(res.data.user)
);



navigate("/home");



}

catch(err){

setMessage(
err.response?.data?.message ||
"Login failed"
);

}


finally{

setLoading(false);

}


}






return (

<div className="landing-page">





{/* NAVBAR */}

<header className="navbar">


<div className="brand">


<div className="brand-icon">

<Cpu size={30}/>

</div>


<h1>
ANTIMATE
</h1>


</div>




<nav>

<a href="#vision">
Vision
</a>

<a href="#mission">
Mission
</a>

<a href="#services">
Services
</a>


</nav>




<div className="nav-buttons">


<button
onClick={()=>setShowLogin(true)}
className="login-btn"
>
Login
</button>



<Link
to="/signup"
className="signup-btn"
>
Signup
</Link>


</div>


</header>









{/* HERO SECTION */}


<section className="hero">



<div className="hero-content">


<h1>

Smart Farming
Powered by

<span>
AI + IoT
</span>

</h1>



<p>

ANTIMATE Smart Brooder is an intelligent
poultry management platform that combines
IoT devices, cloud technology and Artificial
Intelligence to improve farming productivity.

</p>



<button

onClick={()=>setShowLogin(true)}

className="primary-btn"

>

Access Platform

</button>


</div>





{/* IoT Animation Area */}


<div className="iot-circle">


<div className="iot-node node1">
<Cpu/>
</div>


<div className="iot-node node2">
<Wifi/>
</div>


<div className="iot-node node3">
<Radio/>
</div>


<div className="iot-node node4">
<Activity/>
</div>


<div className="iot-node node5">
<Database/>
</div>


<div className="iot-node node6">
<ShieldCheck/>
</div>


</div>



</section>









{/* VISION */}

<section id="vision" className="info-section">


<h2>
Our Vision
</h2>


<p>

To transform agriculture through intelligent
technology where farmers can access
real-time information, automation and AI
solutions for better production.

</p>


</section>









{/* MISSION */}

<section id="mission" className="info-section">


<h2>
Our Mission
</h2>


<p>

To provide affordable AI-powered IoT systems
that help farmers monitor, manage and improve
animal production.

</p>


</section>









{/* SERVICES */}

<section id="services" className="services">


<h2>
Our Services
</h2>



<div className="service-grid">


<div className="service-card">

<Cpu/>

<h3>
Smart Monitoring
</h3>

<p>
Temperature, humidity and farm environment tracking.
</p>

</div>





<div className="service-card">

<Activity/>

<h3>
AI Analysis
</h3>

<p>
Data analysis and smart recommendations.
</p>

</div>





<div className="service-card">

<Wifi/>

<h3>
IoT Connectivity
</h3>

<p>
Wireless communication between devices and cloud.
</p>

</div>




</div>


</section>









<footer>

ANTIMATE EDGE AI © 2026

</footer>









{/* LOGIN POPUP */}


{

showLogin &&


<div className="modal-overlay">


<div className="login-card">


<button

className="close-modal"

onClick={()=>setShowLogin(false)}

>

<X/>

</button>





<div className="brand">


<div className="brand-icon">

<Cpu size={34}/>

</div>


<h1>
ANTIMATE
</h1>


</div>





<h2>
Welcome Back
</h2>


<p className="subtitle">
IoT Management Platform
</p>







<form onSubmit={handleLogin}>


<input

className="login-input"

placeholder="Email / Username / Phone"

value={identifier}

onChange={
e=>setIdentifier(e.target.value)
}

/>






<div className="password-box">


<input

className="login-input"

type={
showPassword
?
"text"
:
"password"
}

placeholder="Password"

value={password}

onChange={
e=>setPassword(e.target.value)
}

/>



<button

type="button"

className="show-password"

onClick={()=>
setShowPassword(!showPassword)
}

>

{
showPassword
?
"Hide"
:
"Show"
}

</button>


</div>







{
message &&

<p className="error">

{message}

</p>

}





<button

className="login-button"

disabled={loading}

>


{

loading
?
"Connecting..."
:
"Sign In"

}


</button>



</form>






<Link
className="forgot"
to="/forgot-password"
>

Forgot Password?

</Link>



</div>


</div>


}



</div>


);


}



export default Login;