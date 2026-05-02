const supabaseUrl = 'https://cgpvrmcqpmznmnrsqyay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncHZybWNxcG16bm1ucnNxeWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzU5MDMsImV4cCI6MjA5Mjc1MTkwM30.T9Urw9hZ07mljLK547f70LyztNV0FwNdG4DHMiHcR2k';

async function check() {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const data = await res.json();
    console.log("Tables found:", Object.keys(data.definitions || data.components?.schemas || {}));
}
check();
