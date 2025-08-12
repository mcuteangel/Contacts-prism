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
    const url = new URL(req.url)
    const since = url.searchParams.get('since')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get contacts changes
    let contactsQuery = supabase
      .from('contacts')
      .select('*')
      .is('_deleted_at', null)
    
    if (since) {
      contactsQuery = contactsQuery.gt('updated_at', since)
    }
    
    const { data: contacts, error: contactsError } = await contactsQuery

    // Get groups changes
    let groupsQuery = supabase
      .from('groups')
      .select('*')
      .is('deleted_at', null)
    
    if (since) {
      groupsQuery = groupsQuery.gt('updated_at', since)
    }
    
    const { data: groups, error: groupsError } = await groupsQuery

    if (contactsError || groupsError) {
      throw new Error('Database query failed')
    }

    const response = {
      serverTime: new Date().toISOString(),
      contacts: contacts || [],
      groups: groups || []
    }

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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})