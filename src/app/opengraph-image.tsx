import { ImageResponse } from "next/og";

export const alt = "FreshChain AI — Stop food waste before it happens";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f6f7f6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#11724b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 26, height: 26, borderRadius: "2px 26px 2px 26px", background: "white" }} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: "#0c1411" }}>FreshChain AI</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -3, color: "#0c1411", lineHeight: 1 }}>Stop food waste</div>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -3, color: "#7a847f", lineHeight: 1.1 }}>before it happens.</div>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 22, color: "#45504b" }}>
          {["SEE", "UNDERSTAND", "DECIDE", "ACT", "MEASURE"].map((s, i) => (
            <div
              key={s}
              style={{
                display: "flex",
                padding: "8px 16px",
                borderRadius: 999,
                background: i === 4 ? "#11724b" : "white",
                color: i === 4 ? "white" : "#45504b",
                border: "1px solid #e6e9e7",
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
