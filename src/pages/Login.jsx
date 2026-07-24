import { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";


export default function Login() {

  const navigate = useNavigate();
  const { login } = useAuth();


  const [showModal, setShowModal] = useState(false);
  const [authType, setAuthType] = useState("login");


  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [name,setName] = useState("");



  const openModal=(type)=>{

    setAuthType(type);
    setShowModal(true);

  }



  const handleSubmit = async(e)=>{

    e.preventDefault();


    try{


      if(authType==="login"){

        const res = await api.post("/auth/login",{
          email,
          password
        });


        login(res.data);

        navigate("/");


      }
      else{

        await api.post("/auth/register",{
          name,
          email,
          password
        });


        alert("Account created successfully");

        setAuthType("login");

      }


    }
    catch(error){

      console.log(error);
      alert("Something went wrong");

    }


  }



return (

<div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">


{/* NAVBAR */}

<header className="flex justify-between items-center px-8 py-5 bg-white shadow">


<div className="text-2xl font-bold text-green-700">

ANTIMATE

<span className="text-blue-600">
 Smart Brooder
</span>

</div>



<div className="flex gap-4">


<button
onClick={()=>openModal("login")}
className="border border-green-600 text-green-700 px-5 py-2 rounded-lg"
>

Login

</button>


<button
onClick={()=>openModal("signup")}
className="bg-green-600 text-white px-5 py-2 rounded-lg"
>

Signup

</button>


</div>


</header>





{/* HERO */}

<section className="grid md:grid-cols-2 gap-10 items-center px-10 py-20">


<div>


<h1 className="text-5xl font-bold text-gray-800">

Smart Poultry Farming
with

<span className="text-green-600">
 AI & IoT
</span>

</h1>



<p className="mt-6 text-gray-600 text-lg">

ANTIMATE Smart Brooder is an intelligent
system that helps farmers monitor,
control and improve poultry production
using connected IoT technology.

</p>



<button

onClick={()=>openModal("signup")}

className="mt-8 bg-green-600 text-white px-8 py-3 rounded-xl"

>

Start Smart Farming

</button>


</div>





{/* 3D PLACEHOLDER */}

<div className="h-96 rounded-3xl bg-gradient-to-br from-green-200 to-blue-200 flex items-center justify-center">


<h2 className="text-3xl font-bold text-gray-700">

3D Smart Brooder Animation

</h2>


</div>



</section>







{/* VISION */}

<section className="py-16 px-10 bg-white">


<h2 className="text-3xl font-bold text-center">

Our Vision

</h2>



<p className="max-w-3xl mx-auto text-center mt-5 text-gray-600">


To transform poultry farming through
accessible Artificial Intelligence and
IoT technology, creating smarter,
healthier and more productive farms.

</p>


</section>








{/* MISSION */}

<section className="py-16 px-10">


<h2 className="text-3xl font-bold text-center">

Our Mission

</h2>



<p className="max-w-3xl mx-auto text-center mt-5 text-gray-600">


To provide farmers with intelligent tools
for monitoring, automation and decision
making using real-time data.

</p>


</section>









{/* SERVICES */}


<section className="py-16 px-10 bg-white">


<h2 className="text-3xl font-bold text-center mb-10">

Our Services

</h2>



<div className="grid md:grid-cols-3 gap-8">


<Service
title="Smart Monitoring"
text="Real-time temperature and humidity monitoring"
/>



<Service
title="AI Analysis"
text="Artificial intelligence insights for better farming"
/>



<Service
title="Automation"
text="Automatic climate control using IoT devices"
/>



</div>


</section>









{/* CTA */}


<section className="py-20 text-center">


<h2 className="text-4xl font-bold">

Build the Future of Farming

</h2>



<p className="mt-4 text-gray-600">

Join ANTIMATE Smart Brooder today.

</p>



<button

onClick={()=>openModal("signup")}

className="mt-8 bg-green-600 text-white px-10 py-3 rounded-xl"

>

Create Account

</button>


</section>








<footer className="bg-gray-900 text-white text-center py-6">


ANTIMATE Inc © {new Date().getFullYear()}


</footer>









{/* AUTH POPUP */}



{

showModal &&

<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">


<div className="bg-white rounded-2xl p-8 w-full max-w-md relative">


<button

onClick={()=>setShowModal(false)}

className="absolute right-4 top-4"

>

<X/>

</button>




<h2 className="text-2xl font-bold mb-6">


{
authType==="login"
?
"Login"
:
"Create Account"
}


</h2>





<form onSubmit={handleSubmit}>


{

authType==="signup" &&

<input

className="w-full border p-3 rounded-lg mb-4"

placeholder="Full Name"

value={name}

onChange={(e)=>setName(e.target.value)}

/>

}





<input

className="w-full border p-3 rounded-lg mb-4"

placeholder="Email"

type="email"

value={email}

onChange={(e)=>setEmail(e.target.value)}

/>






<input

className="w-full border p-3 rounded-lg mb-6"

placeholder="Password"

type="password"

value={password}

onChange={(e)=>setPassword(e.target.value)}

/>






<button

className="w-full bg-green-600 text-white py-3 rounded-lg"

>

{
authType==="login"
?
"Login"
:
"Signup"
}

</button>



</form>



</div>


</div>

}


</div>


)

}





function Service({title,text}){


return (

<div className="p-8 rounded-xl shadow bg-gray-50">


<h3 className="text-xl font-bold text-green-700">

{title}

</h3>


<p className="mt-3 text-gray-600">

{text}

</p>


</div>

)


}