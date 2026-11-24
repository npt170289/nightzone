export default async function handler(req,res){
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  // --- KHOA ADMIN (2026-11-24) ---
  // Chi admin moi duoc go ket (cancel payment). Verify accessToken qua Pi /v2/me,
  // UID phai == ADMIN_UID. Khong co token -> 401; UID khong phai admin -> 403.
  // Admin UID: thuongsheva trong app NightZone (lay qua uid.html 2026-11-25; trung UID dau tien trong DEFAULT_5UIDS cua pay5uid.js).
  const ADMIN_UID = process.env.ADMIN_UID || 'b38efa68-4778-4f60-b62e-f76793d64668';
  const _accessToken = (req.body || {}).accessToken;
  if (!_accessToken) {
    return res.status(401).json({ success: false, error: 'Thieu accessToken — dang nhap Pi truoc khi go ket.' });
  }
  try {
    const _meRes = await fetch('https://api.minepi.com/v2/me', { headers: { Authorization: `Bearer ${_accessToken}` } });
    const _meData = await _meRes.json().catch(() => ({}));
    if (!_meRes.ok || !_meData.uid) {
      return res.status(401).json({ success: false, error: 'accessToken khong hop le.' });
    }
    if (_meData.uid !== ADMIN_UID) {
      return res.status(403).json({ success: false, error: '403 Forbidden — Chi chinh chu (admin) moi duoc go ket.' });
    }
  } catch (e) {
    return res.status(401).json({ success: false, error: 'accessToken khong hop le.' });
  }

  const PI_API_KEY = process.env.PI_API_KEY;
  const r = await fetch("https://api.minepi.com/v2/payments/incomplete",{
    headers:{ Authorization:`Key ${PI_API_KEY}` }
  });
  const data = await r.json();
  const list = data?.incomplete_payments || [];
  let cleared = 0;
  for(const p of list){
    await fetch(`https://api.minepi.com/v2/payments/${p.identifier}/cancel`,{
      method:"POST",
      headers:{ Authorization:`Key ${PI_API_KEY}`, "Content-Type":"application/json" }
    });
    cleared++;
  }
  return res.json({ success:true, found:list.length, cleared, list });
}
