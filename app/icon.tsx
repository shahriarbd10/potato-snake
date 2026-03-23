import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 22%, rgba(68, 104, 168, 0.35), transparent 34%), linear-gradient(180deg, #0b0f16 0%, #05070b 100%)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 6,
            borderRadius: 16,
            border: "2px solid rgba(111, 130, 159, 0.45)",
            background: "linear-gradient(180deg, rgba(25, 33, 47, 0.96), rgba(12, 16, 24, 0.98))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)"
          }}
        />

        <div
          style={{
            width: 40,
            height: 46,
            borderRadius: 9,
            background: "linear-gradient(180deg, #314050 0%, #1a2330 100%)",
            border: "2px solid #53647d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "0 8px 16px rgba(0,0,0,0.35)"
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 4,
              width: 12,
              height: 2,
              borderRadius: 999,
              background: "#101722"
            }}
          />

          <div
            style={{
              width: 29,
              height: 29,
              borderRadius: 4,
              border: "2px solid #111820",
              background:
                "linear-gradient(180deg, #b0c495 0%, #90a978 100%)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 5,
                height: 5,
                background: "linear-gradient(180deg, #557048 0%, #2b3b23 100%)",
                left: 8,
                top: 12,
                boxShadow:
                  "6px 0 0 #34472b, 12px 0 0 #34472b, 18px 0 0 #34472b, 18px -6px 0 #34472b, 18px -12px 0 #4c6641"
              }}
            />

            <div
              style={{
                position: "absolute",
                right: 4,
                bottom: 4,
                width: 6,
                height: 6,
                borderRadius: "36% 40% 34% 38%",
                background:
                  "linear-gradient(180deg, #9b7443 0%, #6f4f2b 55%, #4d3518 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,241,212,0.24)"
              }}
            />
          </div>
        </div>
      </div>
    ),
    size
  );
}
