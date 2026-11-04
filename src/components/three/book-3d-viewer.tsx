"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { BookMesh } from "./book-mesh";

/** มุมมองเล่มเดี่ยว — ลากหมุนได้รอบทิศ */
export function Book3DViewer({
  title,
  coverUrl,
  backCoverUrl,
  pages,
  className,
}: {
  title: string;
  coverUrl: string | null;
  backCoverUrl?: string | null;
  pages?: number | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 4, 34], fov: 40 }} shadows>
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 25, 35]} intensity={1.6} />
        <directionalLight position={[-25, 10, 20]} intensity={0.5} />
        <BookMesh
          title={title}
          coverUrl={coverUrl}
          backCoverUrl={backCoverUrl}
          pages={pages}
          orientation="coverOut"
        />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={1.2}
          minPolarAngle={0.5}
          maxPolarAngle={2.2}
        />
      </Canvas>
    </div>
  );
}
