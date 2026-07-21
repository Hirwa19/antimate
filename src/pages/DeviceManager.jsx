import React, { useEffect, useState } from "react";
import axios from "axios";
import QRScanner from "../components/QRScanner";


const API =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";


export default function DeviceManager() {


const token = localStorage.getItem("token");


const headers = {
  Authorization:`Bearer ${token}`,
};



// ================= STATES =================

const [devices,setDevices] = useState([]);

const [mode,setMode] = useState("QR");

const [showScanner,setShowScanner] = useState(false);

const [deviceId,setDeviceId] = useState("");

const [qrToken,setQrToken] = useState("");

const [deviceKey,setDeviceKey] = useState("");

const [loading,setLoading] = useState(false);




// ================= LOAD DEVICES =================

const loadDevices = async()=>{

try{


const res = await axios.get(
`${API}/api/devices/my-devices`,
{
headers
}
);


setDevices(
Array.isArray(res.data)
?
res.data
:
[]
);



}catch(err){

console.log(
"LOAD DEVICE ERROR",
err.response?.data || err.message
);

}


};



useEffect(()=>{

loadDevices();

},[]);




// ================= QR RESULT =================


const handleQRScan=(data)=>{


console.log(
"QR DATA:",
data
);


setDeviceId(
data.deviceId
);


setQrToken(
data.qrToken
);


setShowScanner(false);


};




// ================= CLAIM DEVICE =================


const claimDevice = async()=>{


try{


setLoading(true);


// STEP 1 VERIFY
await axios.post(

`${API}/api/devices/verify`,

{

deviceId,

qrToken

},

{
headers
}

);



await axios.post(

`${API}/api/devices/claim`,

{

deviceId

},

{
headers
}

);


alert(
"Device connected successfully ✅"
);



setDeviceId("");

setQrToken("");

setDeviceKey("");



loadDevices();



}catch(err){


console.log(err);


alert(

err.response?.data?.message ||
"Device linking failed"

);


}

finally{

setLoading(false);

}



};




// ================= RELEASE =================


const releaseDevice = async(device)=>{


const key =
prompt(
"Enter device key"
);


if(!key)return;



try{


await axios.post(

`${API}/api/devices/${device.deviceId}/release`,

{
deviceKey:key
},

{
headers
}

);



alert(
"Device released"
);


loadDevices();



}catch(err){

alert(
err.response?.data?.message ||
"Release failed"
);

}


};





return (

<div className="
min-h-screen
p-4
md:p-8
bg-slate-100
">


<div className="
max-w-5xl
mx-auto
space-y-8
">


<h1 className="
text-3xl
font-bold
text-slate-800
">

My Devices

</h1>




{/* ADD DEVICE */}


<div className="
bg-white
rounded-2xl
shadow
p-6
">


<h2 className="
text-xl
font-semibold
mb-5
">

Connect New Device

</h2>



<div className="
flex
gap-3
mb-5
">


<button

onClick={()=>setMode("QR")}

className={

mode==="QR"

?
"bg-blue-600 text-white px-5 py-2 rounded-xl"
:
"bg-slate-200 px-5 py-2 rounded-xl"

}

>

📷 Scan QR

</button>




<button

onClick={()=>setMode("KEY")}

className={

mode==="KEY"

?
"bg-blue-600 text-white px-5 py-2 rounded-xl"
:
"bg-slate-200 px-5 py-2 rounded-xl"

}

>

🔑 Device Key

</button>



</div>





{
mode==="QR" &&

<div>


<button
onClick={()=>setShowScanner(true)}
>
Scan QR Code
</button>



{
showScanner &&

<div>

<QRScanner

onScan={(data)=>{


try{


const qr =
JSON.parse(data);


setQrToken(
qr.qrToken
);


setDeviceId(
qr.deviceId
);



setMode("QR");


setShowScanner(false);



}catch(err){


alert(
"Invalid QR"
);


}


}}

/>

</div>

}



</div>

}






{
mode==="KEY" &&

<div className="space-y-3">


<input

className="
w-full
border
rounded-xl
p-3
"

placeholder="Device ID"

value={deviceId}

onChange={
e=>setDeviceId(e.target.value)
}

/>



<input

className="
w-full
border
rounded-xl
p-3
"

placeholder="Device Key"

value={deviceKey}

onChange={
e=>setDeviceKey(e.target.value)
}

/>



</div>

}




{
deviceId &&

<div className="
mt-5
bg-slate-50
p-4
rounded-xl
">


<p>
<b>Device:</b> {deviceId}
</p>


{
qrToken &&

<p className="text-sm">
QR detected ✅
</p>

}


</div>

}




<button

disabled={loading || !deviceId}

onClick={claimDevice}

className="
mt-5
w-full
bg-blue-600
text-white
p-3
rounded-xl
disabled:bg-gray-400
"

>

{
loading
?
"Connecting..."
:
"Connect Device"
}


</button>



</div>







{/* DEVICES LIST */}


<div className="
grid
grid-cols-1
md:grid-cols-2
gap-5
">


{
devices.map(device=>(


<div

key={device._id}

className="
bg-white
rounded-2xl
shadow
p-5
"

>


<h3 className="
font-bold
text-lg
">

{device.deviceId}

</h3>




<p className="mt-2">

Status:

<span className="ml-2 font-semibold">

{device.activationStatus}

</span>

</p>




<p className="text-sm text-gray-500">

Last seen:

{
device.lastSeen
?
new Date(device.lastSeen).toLocaleString()
:
"N/A"
}

</p>





<button

onClick={()=>releaseDevice(device)}

className="
mt-4
bg-red-600
text-white
px-4
py-2
rounded-xl
"

>

Release

</button>



</div>


))

}



</div>



</div>

</div>


);


}