const {parseBody,cleanText,validEmail,isSameOrigin,setCommonHeaders,insertRow}=require('./_supabase');
const AREAS=new Set(['Project activities','Institute outreach','Creative / media','Research / education','Events / coordination']);

module.exports=async function handler(req,res){
  setCommonHeaders(res);
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,message:'Method not allowed.'});}
  if(!isSameOrigin(req)) return res.status(403).json({ok:false,message:'Request origin is not allowed.'});

  try{
    const body=parseBody(req);
    if(cleanText(body.website,200)) return res.status(200).json({ok:true,message:'Application received.'});

    const name=cleanText(body.name,100);
    const email=cleanText(body.email,254).toLowerCase();
    const area=cleanText(body.areaOfInterest,80);
    const about=cleanText(body.about,3000);
    const sourcePath=cleanText(body.sourcePath,300);

    if(name.length<2) return res.status(400).json({ok:false,message:'Please enter your name.'});
    if(!validEmail(email)) return res.status(400).json({ok:false,message:'Please enter a valid email address.'});
    if(!AREAS.has(area)) return res.status(400).json({ok:false,message:'Please choose a valid area of interest.'});

    await insertRow('volunteer_applications',{
      name,email,area_of_interest:area,about:about||null,source_path:sourcePath||null
    });
    return res.status(201).json({ok:true,message:'Thanks. Your volunteer interest has been received.'});
  }catch(error){
    console.error('Volunteer submission error:',error);
    return res.status(error.statusCode||500).json({
      ok:false,
      message:error.statusCode===503
        ? 'The volunteer form is being configured. Please try again later.'
        : 'We could not send your application right now. Please try again.'
    });
  }
};
