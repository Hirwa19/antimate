import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Sky,
  Plane,
} from "@react-three/drei";

import CameraController from "./CameraController";



function FarmEnvironment(){


return (

<>


{/* SKY */}

<Sky
sunPosition={[5,5,5]}
/>



{/* GROUND */}

<mesh
rotation={[-Math.PI/2,0,0]}
position={[0,0,0]}
>


<planeGeometry
args={[50,50]}
/>


<meshStandardMaterial
color="#6fa34d"
/>


</mesh>





{/* SIMPLE CHICKEN HOUSE PLACEHOLDER */}


<mesh
position={[0,1,-5]}
>


<boxGeometry
args={[5,2,4]}
/>


<meshStandardMaterial
color="#b45309"
/>


</mesh>





{/* HOUSE ROOF */}


<mesh
position={[0,2.5,-5]}
rotation={[0,Math.PI/4,0]}
>


<coneGeometry
args={[3.8,1,4]}
/>


<meshStandardMaterial
color="#7c2d12"
/>


</mesh>



</>

)

}




export default function SmartFarmScene(){


return (

<div

style={{

width:"100%",

height:"600px"

}}

>


<Canvas

camera={{

position:[0,3,8],

fov:45

}}

>


<ambientLight intensity={1}/>


<directionalLight

position={[5,10,5]}

intensity={2}

/>



<FarmEnvironment/>



<CameraController/>




<Environment preset="sunset"/>


</Canvas>


</div>

);


}