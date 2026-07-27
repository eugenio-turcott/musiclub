import React from "react";

export function LoadingOverlay({ loading, message = "Cargando..." }) {
  if (!loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div style={{ position: "relative", marginBottom: "30px" }}>
        <div
          style={{
            position: "absolute",
            top: "-20px",
            left: "-20px",
            right: "-20px",
            bottom: "-20px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(245,87,108,0.15), transparent 70%)",
            animation: "pulseGlow 1.5s ease-in-out infinite",
          }}
        />

        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          style={{
            animation: "spin 1s linear infinite",
            filter: "drop-shadow(0 0 30px rgba(245,87,108,0.3))",
          }}
        >
          <defs>
            <linearGradient
              id="loadingGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" style={{ stopColor: "#f5576c" }} />
              <stop offset="100%" style={{ stopColor: "#f093fb" }} />
            </linearGradient>
          </defs>
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="4"
          />
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="url(#loadingGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="150"
            strokeDashoffset="40"
            style={{
              animation: "dash 1.5s ease-in-out infinite",
            }}
          />
        </svg>
      </div>

      <h2
        style={{
          color: "#ffffff",
          fontSize: "1.8rem",
          fontWeight: 700,
          marginBottom: "12px",
          letterSpacing: "-0.02em",
          textShadow: "0 0 30px rgba(245,87,108,0.2)",
        }}
      >
        {message}
      </h2>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "rgba(255,255,255,0.3)",
          fontSize: "0.9rem",
        }}
      >
        <span>Preparando la máquina</span>
        <span
          style={{
            display: "inline-flex",
            gap: "4px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              background: "#f5576c",
              borderRadius: "50%",
              display: "inline-block",
              animation: "pulseDot 1.4s infinite ease-in-out both",
            }}
          />
          <span
            style={{
              width: "6px",
              height: "6px",
              background: "#f5576c",
              borderRadius: "50%",
              display: "inline-block",
              animation: "pulseDot 1.4s infinite ease-in-out both",
              animationDelay: "-0.16s",
            }}
          />
          <span
            style={{
              width: "6px",
              height: "6px",
              background: "#f5576c",
              borderRadius: "50%",
              display: "inline-block",
              animation: "pulseDot 1.4s infinite ease-in-out both",
              animationDelay: "-0.32s",
            }}
          />
        </span>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes dash {
          0% { stroke-dashoffset: 150; }
          50% { stroke-dashoffset: 30; }
          100% { stroke-dashoffset: 150; }
        }

        @keyframes pulseDot {
          0%, 80%, 100% { 
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% { 
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @keyframes pulseGlow {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.5;
          }
          50% { 
            transform: scale(1.1);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(12px);
          }
        }
      `}</style>
    </div>
  );
}
