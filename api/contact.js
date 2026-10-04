const {parseBody,cleanText,validEmail,isSameOrigin,setCommonHeaders,insertRow}=require('./_supabase');
const TOPICS=new Set(['General question','Volunteer','Institute collaboration','Partnership','Media']);

module.exports=async function handler(req,res){
  setCommonHeaders(res);
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,message:'Method not allowed.'});}
  if(!isSameOrigin(req)) return res.status(403).json({ok:false,message:'Request origin is not allowed.'});

  try{
    const body=parseBody(req);
    if(cleanText(body.website,200)) return res.status(200).json({ok:true,message:'Message received.'});

    const name=cleanText(body.name,100);
    const email=cleanText(body.email,254).toLowerCase();
    const topic=cleanText(body.topic,80);
    const message=cleanText(body.message,3000);
    const sourcePath=cleanText(body.sourcePath,300);

    if(name.length<2) return res.status(400).json({ok:false,message:'Please enter your name.'});
    if(!validEmail(email)) return res.status(400).json({ok:false,message:'Please enter a valid email address.'});
    if(!TOPICS.has(topic)) return res.status(400).json({ok:false,message:'Please choose a valid topic.'});
    if(message.length<10) return res.status(400).json({ok:false,message:'Please write a little more about your message.'});

    await insertRow('contact_submissions',{name,email,topic,message,source_path:sourcePath||null});
    return res.status(201).json({ok:true,message:'Thanks. Your message has been received.'});
  }catch(error){
    console.error('Contact submission error:',error);
    return res.status(error.statusCode||500).json({
      ok:false,
      message:error.statusCode===503
        ? 'The contact form is being configured. Please try again later.'
        : 'We could not send your message right now. Please try again.'
    });
  }
};
