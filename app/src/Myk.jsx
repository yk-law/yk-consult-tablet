const MYK_URL = "https://myk.legal/home";

// segno 2-M, https://myk.legal/home. 가장자리 여백은 SVG에서 4칸.
const QR = [
  "1111111010001010101111111",
  "1000001010101000001000001",
  "1011101011100111001011101",
  "1011101000111101101011101",
  "1011101011010110101011101",
  "1000001001111000001000001",
  "1111111010101010101111111",
  "0000000000101110000000000",
  "1001111110000011110010111",
  "1001010110010111010111110",
  "1010001101111101110111001",
  "0100110000110011001111111",
  "0110111100011001101100001",
  "1010110000100011100010010",
  "1101001101011111000011111",
  "1001100000110000010101101",
  "1000101100100101111110110",
  "0000000010111000100010110",
  "1111111011010100101010001",
  "1000001011101101100010000",
  "1011101011001101111110011",
  "1011101010000010101000011",
  "1011101000101010110011111",
  "1000001001000000000110111",
  "1111111011101110110001001",
];

const QUIET = 4;

export default function Myk({ hero = false }) {
  const n = QR.length;
  const size = n + QUIET * 2;
  const cells = [];
  QR.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === "1") cells.push(<rect key={`${x}-${y}`} x={x + QUIET} y={y + QUIET} width="1" height="1" />);
    }
  });

  return (
    <aside className={hero ? "myk myk-hero" : "myk"}>
      <a className="myk-qr" href={MYK_URL} target="_blank" rel="noreferrer" aria-label="myk.legal/home">
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-hidden="true">
          <rect width={size} height={size} fill="#fff" />
          <g fill="#171C24">{cells}</g>
        </svg>
      </a>
      <div className="myk-copy">
        <p className="myk-h">법률 과정을 더 쉽게,<br />의뢰인의 곁에 더 가까이</p>
        <p className="myk-p">법무법인 YK의 상담과 사건 진행을 편리하게 확인하고 이어갈 수 있습니다.</p>
      </div>
    </aside>
  );
}
