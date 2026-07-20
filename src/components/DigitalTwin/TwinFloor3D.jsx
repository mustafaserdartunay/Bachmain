import { Canvas } from '@react-three/fiber'
import { OrbitControls, Edges } from '@react-three/drei'
import { FACTORY_LINES, STATUS_COLORS } from '../../twin/demoState'

function LineBox({ line, index }) {
  const color = STATUS_COLORS[line.status] || '#64748b'
  const x = (index - 2) * 2.2
  return (
    <mesh position={[x, 0.4, 0]} castShadow>
      <boxGeometry args={[1.6, 0.8, 3.2]} />
      <meshStandardMaterial color={color} transparent opacity={0.85} />
      <Edges color="#0f172a" />
    </mesh>
  )
}

export default function TwinFloor3D() {
  return (
    <div className="h-56 w-full overflow-hidden rounded-xl border border-dark-500/40 bg-[#0b1220]">
      <Canvas camera={{ position: [6, 6, 8], fov: 42 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 3]} intensity={1.1} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[16, 10]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {FACTORY_LINES.map((line, i) => (
          <LineBox key={line.id} line={line} index={i} />
        ))}
        <OrbitControls enablePan makeDefault />
      </Canvas>
    </div>
  )
}
