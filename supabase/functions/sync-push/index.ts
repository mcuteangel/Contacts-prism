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
    const { batch, clientTime } = await req.json()
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const results = []
    
    for (const item of batch) {
      try {
        const { entity, entityId, op, payload } = item
        
        if (entity === 'contacts') {
          if (op === 'insert' || op === 'update') {
            const { error } = await supabase
              .from('contacts')
              .upsert(payload)
            
            results.push({
              entity,
              entityId,
              status: error ? 'error' : 'applied'
            })
          } else if (op === 'delete') {
            const { error } = await supabase
              .from('contacts')
              .delete()
              .eq('id', entityId)
            
            results.push({
              entity,
              entityId,
              status: error ? 'error' : 'applied'
            })
          }
        } else if (entity === 'groups') {
          if (op === 'insert' || op === 'update') {
            const { error } = await supabase
              .from('groups')
              .upsert(payload)
            
            results.push({
              entity,
              entityId,
              status: error ? 'error' : 'applied'
            })
          } else if (op === 'delete') {
            const { error } = await supabase
              .from('groups')
              .delete()
              .eq('id', entityId)
            
            results.push({
              entity,
              entityId,
              status: error ? 'error' : 'applied'
            })
          }
        }
      } catch (error) {
        results.push({
          entity: item.entity,
          entityId: item.entityId,
          status: 'error'
        })
      }
    }

    return new Response(
      JSON.stringify({ results }),
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