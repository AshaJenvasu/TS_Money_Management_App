interface SakuraFlowerProps {
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  color?: string;
}

// ดอกซากุระ 5 กลีบ ใช้วาดกลุ่มดอกนิ่งๆตกแต่งฉากหลัง เป็นของตกแต่งเท่านั้น ไม่ใช่ข้อมูล
export default function SakuraFlower({
  x,
  y,
  scale = 1,
  rotation = 0,
  color = "#FFC6DA",
}: SakuraFlowerProps) {
  const petal =
    "M0 0C-4-3.5-4.2-9.5-1.3-11 0-10.2.6-10.2 1.3-11 4.2-9.5 4-3.5 0 0z";
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}
      fill={color}
    >
      <path d={petal} />
      <path d={petal} transform="rotate(72)" />
      <path d={petal} transform="rotate(144)" />
      <path d={petal} transform="rotate(216)" />
      <path d={petal} transform="rotate(288)" />
      <circle r="1.7" fill="#F0669A" />
    </g>
  );
}
