import React, {useEffect} from "react";
import {Html5QrcodeScanner} from "html5-qrcode";


export default function QRScanner({onScan}){


useEffect(()=>{


const scanner =
new Html5QrcodeScanner(

"qr-reader",

{
fps:10,
qrbox:250
}

);



scanner.render(

(decodedText)=>{


console.log(
"QR RESULT:",
decodedText
);


onScan(decodedText);



scanner.clear();


},


(error)=>{


}

);



return ()=>{

try{

scanner.clear();

}catch(e){}


};



},[]);



return (

<div>

<h3 className="
text-lg
font-semibold
mb-3
">

Scan Device QR

</h3>


<div id="qr-reader"></div>


</div>

);


}