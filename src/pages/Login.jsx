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
} from "lucide-react";

import "./Login.css";


function Login(){

const navigate = useNavigate();


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

<div className="login-page">



{/* ================= IoT BACKGROUND ================= */}


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





{/* ================= LOGIN CARD ================= */}


<div className="login-card">



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





<p className="signup">

Don't have an account?


<Link to="/signup">

Create Account

</Link>


</p>





<div className="footer">

ANTIMATE EDGE AI

</div>



</div>




</div>


);

}



export default Login;