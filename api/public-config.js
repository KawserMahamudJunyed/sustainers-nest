module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=60, s-maxage=300');
  const url=process.env.SUPABASE_URL||'';
  const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||'';
  return res.status(200).json({enabled:Boolean(url&&key),url,key});
};
