const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cgpvrmcqpmznmnrsqyay.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncHZybWNxcG16bm1ucnNxeWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzU5MDMsImV4cCI6MjA5Mjc1MTkwM30.T9Urw9hZ07mljLK547f70LyztNV0FwNdG4DHMiHcR2k');

async function test() {
    try {
        const res = await supabase.from('programs').select('*');
        console.log("Result:", res);
    } catch (e) {
        console.log("Exception:", e);
    }
}
test();
