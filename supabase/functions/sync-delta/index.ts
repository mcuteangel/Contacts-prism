import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.split(' ')[1];
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Verify token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('Authentication failed:', userError?.message || 'No user data');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing delta request for user ${user.id} (${user.email})`);
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { lastSync, clientTime } = requestBody;
    console.log(`Delta request: lastSync=${lastSync}, clientTime=${clientTime}`);

    // Get contacts changes for this user
    let contactsQuery = supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('user_id', user.id);
    
    if (lastSync && lastSync !== '1970-01-01T00:00:00Z') {
      contactsQuery = contactsQuery.gt('updated_at', lastSync);
    }
    
    const { data: contacts, error: contactsError } = await contactsQuery;

    // Get groups changes for this user
    let groupsQuery = supabaseAdmin
      .from('groups')
      .select('*')
      .eq('user_id', user.id);
    
    if (lastSync && lastSync !== '1970-01-01T00:00:00Z') {
      groupsQuery = groupsQuery.gt('updated_at', lastSync);
    }
    
    const { data: groups, error: groupsError } = await groupsQuery;

    if (contactsError) {
      console.error('Contacts query failed:', contactsError);
      throw new Error(`Contacts query failed: ${contactsError.message}`);
    }
    
    if (groupsError) {
      console.error('Groups query failed:', groupsError);
      throw new Error(`Groups query failed: ${groupsError.message}`);
    }

    const response = {
      serverTime: new Date().toISOString(),
      contacts: contacts || [],
      groups: groups || []
    };
    
    console.log(`Delta response: ${contacts?.length || 0} contacts, ${groups?.length || 0} groups`);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: Deno.env.get('NODE_ENV') === 'development' ? 
          (error instanceof Error ? error.stack : String(error)) : undefined
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})