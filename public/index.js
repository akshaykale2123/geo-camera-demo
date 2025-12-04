import { useState } from "react";

export default function HomePage() {
    const [status, setStatus] = useState("");
    const [preview, setPreview] = useState(null);

    const handleCapture = async () => {
        setStatus("Requesting permissions...");

        if (typeof window === "undefined") return;

        try {
            // 1) Get location (with permission)
            const position = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    return reject(new Error("Geolocation not supported"));
                }

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        resolve({
                            lat: pos.coords.latitude,
                            lon: pos.coords.longitude,
                            accuracy: pos.coords.accuracy
                        });
                    },
                    (err) => reject(err)
                );
            });

            setStatus("Location captured. Requesting camera access...");

            // 2) Get front camera stream (with permission)
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera not supported in this browser.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" }
            });

            // 3) Capture single frame from video stream
            const imageDataUrl = await new Promise((resolve, reject) => {
                const video = document.createElement("video");
                video.srcObject = stream;
                video.playsInline = true;

                video.onloadedmetadata = async () => {
                    await video.play();

                    const canvas = document.createElement("canvas");
                    canvas.width = 400;
                    canvas.height = 300;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const dataUrl = canvas.toDataURL("image/png");
                    // stop camera
                    stream.getTracks().forEach((track) => track.stop());
                    resolve(dataUrl);
                };

                video.onerror = (err) => {
                    stream.getTracks().forEach((track) => track.stop());
                    reject(err);
                };
            });

            setPreview(imageDataUrl);
            setStatus("Sending data to server...");

            // 4) Send to backend (Next.js API route)
            const res = await fetch("/api/capture", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    location: position,
                    image: imageDataUrl,
                    userAgent: navigator.userAgent,
                    time: new Date().toISOString()
                })
            });

            if (!res.ok) {
                throw new Error("Server responded with error");
            }

            setStatus("Done! Data sent to server logs (for demo only).");
        } catch (err) {
            console.error(err);
            setStatus("Error: " + err.message);
        }
    };

    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0f172a",
                color: "white",
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                padding: "16px"
            }}
        >
            <div
                style={{
                    maxWidth: "420px",
                    width: "100%",
                    background: "#020617",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                    border: "1px solid rgba(148, 163, 184, 0.3)"
                }}
            >
                <h1 style={{ fontSize: "22px", marginBottom: "8px" }}>
                    Security Demo – Permission Logger
                </h1>
                <p style={{ fontSize: "14px", color: "#cbd5f5", marginBottom: "12px" }}>
                    This demo asks for your <b>location</b> and <b>front camera</b>{" "}
                    permission, then sends a snapshot + coordinates to the server.
                    Use this <b>only</b> for learning and with people&apos;s{" "}
                    <b>explicit consent</b>.
                </p>

                <button
                    onClick={handleCapture}
                    style={{
                        width: "100%",
                        padding: "10px 16px",
                        borderRadius: "999px",
                        border: "none",
                        fontWeight: 600,
                        cursor: "pointer",
                        marginTop: "8px",
                        marginBottom: "12px",
                        background:
                            "linear-gradient(135deg, #22c55e 0%, #16a34a 40%, #15803d 100%)",
                        color: "white",
                        fontSize: "15px"
                    }}
                >
                    Allow & Capture (Demo)
                </button>

                {status && (
                    <p
                        style={{
                            fontSize: "13px",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            background: "rgba(15, 23, 42, 0.8)",
                            border: "1px solid rgba(148, 163, 184, 0.4)",
                            marginBottom: "10px"
                        }}
                    >
                        {status}
                    </p>
                )}

                {preview && (
                    <div
                        style={{
                            marginTop: "8px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            border: "1px solid rgba(148, 163, 184, 0.4)"
                        }}
                    >
                        <img
                            src={preview}
                            alt="Preview"
                            style={{ display: "block", width: "100%" }}
                        />
                    </div>
                )}

                <p
                    style={{
                        fontSize: "11px",
                        opacity: 0.7,
                        marginTop: "10px",
                        lineHeight: 1.4
                    }}
                >
                    Note: In this simple demo, data is only printed in the server logs on
                    Vercel. No database is used.
                </p>
            </div>
        </main>
    );
}
