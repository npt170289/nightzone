export default async function handler(req,res){
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
