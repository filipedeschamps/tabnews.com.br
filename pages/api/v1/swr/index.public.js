export default function handler(req, res) {
  res.status(200).json({ timestamp: Date.now() });
}
