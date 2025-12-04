export default function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { location, image, userAgent, time } = req.body || {};

    console.log("===== New Capture =====");
    console.log("Time:", time);
    console.log("User Agent:", userAgent);
    console.log("Location:", location);
    console.log(
        "Image (data URL length):",
        image ? image.length : "no image received"
    );
    console.log("========================");

    // You can later extend this to save in a DB or send email, etc.
    return res.status(200).json({ ok: true });
}
