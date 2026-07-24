import { OrbitControls } from "@react-three/drei";


export default function CameraController(){

return (

<OrbitControls

enableDamping

dampingFactor={0.05}

enableZoom={true}

minDistance={2}

maxDistance={15}

/>

);

}