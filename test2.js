import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://omjhkpbarcptdotgxeil.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tamhrcGJhcmNwdGRvdGd4ZWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNDIxNzMsImV4cCI6MjEwMjkxODE3M30.eiK2kqI_84PAzr39CsVA8aJz2mXR2foYtEtfA545E84';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data } = await supabase.from('cities').select('*');
  console.log('Cities:', data);
}

main();
