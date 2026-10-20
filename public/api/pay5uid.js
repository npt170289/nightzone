export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const PIONEER_UIDS = [
    "b38efa68-4778-4f60-b62e-f76793d64668",
    "b4acb64e-92a4-4807-9e21-eb089cb5f89a",
    "6b1f43f1-3220-4a92-b1cd-aac769edeca6",
    "5f1fe442-51e8-4542-87a5-5991d41992f6",
    "af95ea0c-147a-4c95-8454-f35a285785bf"
  ];

  const apiKey = process.env.PI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Thiếu PI_API_KEY trong cấu hình Vercel!" });
  }

  const results = [];

  for (const uid of PIONEER_UIDS) {
    try {
      const response = await fetch("https://api.minepi.com/v2/payments", {
        method: "POST",
        headers: {
          "Authorization": `Key ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          payment: {
            amount: 1,
            memo: "Nightzone Pioneer Reward / Testing pay5uid",
            metadata: { type: "A2U_BATCH_REWARD", target_uid: uid },
            uid: uid
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        results.push({ uid, status: "SUCCESS", paymentId: data.identifier, data });
      } else {
        results.push({ uid, status: "FAILED", error: data });
      }
    } catch (error) {
      results.push({ uid, status: "ERROR", error: error.message });
    }
  }

  return res.status(200).json({
    message: "Xử lý đợt thanh toán pay5uid hoàn tất!",
    totalProcessed: results.length,
    results
  });
}
