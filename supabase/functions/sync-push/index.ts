import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types
type SyncOperation = 'insert' | 'update' | 'delete';
type SyncEntity = 'contacts' | 'groups' | 'phone_numbers' | 'email_addresses' | 'custom_fields' | 'contact_groups';

interface SyncItem {
  entity: SyncEntity;
  op: SyncOperation;
  payload: Record<string, unknown>;
  entityId: string;
}

interface SyncResult {
  status: 'applied' | 'error' | 'conflict';
  error?: string;
  data?: unknown;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process a single sync item
async function processSyncItem(
  supabase: any,
  user: any,
  item: SyncItem,
  clientTime: string
): Promise<SyncResult> {
  const { entity, op, payload, entityId } = item;
  console.log(`Processing ${op} on ${entity} ${entityId}`, { clientTime });
  
  try {
    // Verify user owns this entity for non-delete operations
    if (op !== 'delete' && payload && typeof payload === 'object') {
      if ('user_id' in payload && payload.user_id !== user.id) {
        console.warn(`User ${user.id} attempted to modify ${entity} ${entityId} owned by ${payload.user_id}`);
        return { status: 'error', error: 'Unauthorized: User does not own this resource' };
      }
      
      // Ensure user_id is set for insert operations
      if (op === 'insert') {
        payload.user_id = user.id;
      }
    }
    
    // Process based on operation type
    const now = new Date().toISOString();
    
    switch (op) {
      case 'insert':
      case 'update': {
        // Add timestamps for insert/update
        const record = {
          ...payload,
          updated_at: now,
          ...(op === 'insert' && { created_at: now })
        };
        
        console.log(`Upserting ${entity}:`, { id: entityId });
        const { data, error } = await supabase
          .from(entity)
          .upsert(record, { onConflict: 'id' })
          .select()
          .single();
          
        if (error) {
          console.error(`Error upserting ${entity} ${entityId}:`, error);
          throw error;
        }
        
        console.log(`Successfully upserted ${entity} ${entityId}`);
        return { status: 'applied', data };
      }
      
      case 'delete': {
        console.log(`Deleting ${entity} ${entityId}`);
        
        // For delete operations, verify the record exists and user owns it
        const { data: existing, error: fetchError } = await supabase
          .from(entity)
          .select('id, user_id')
          .eq('id', entityId)
          .single();
          
        // If not found, consider it successfully deleted
        if (fetchError?.code === 'PGRST116') {
          console.log(`${entity} ${entityId} not found, considering delete successful`);
          return { status: 'applied' };
        }
        
        if (fetchError) {
          console.error(`Error fetching ${entity} ${entityId} for delete:`, fetchError);
          throw fetchError;
        }
        
        if (existing && existing.user_id !== user.id) {
          console.warn(`User ${user.id} attempted to delete ${entity} ${entityId} owned by ${existing.user_id}`);
          return { status: 'error', error: 'Unauthorized: Cannot delete this resource' };
        }
        
        const { error: deleteError } = await supabase
          .from(entity)
          .delete()
          .eq('id', entityId);
          
        if (deleteError) {
          console.error(`Error deleting ${entity} ${entityId}:`, deleteError);
          throw deleteError;
        }
        
        console.log(`Successfully deleted ${entity} ${entityId}`);
        return { status: 'applied' };
      }
      
      default:
        console.error(`Unsupported operation: ${op} for ${entity}`);
        return { status: 'error', error: `Unsupported operation: ${op}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error processing ${entity} ${op} ${entityId}:`, error);
    return { status: 'error', error: errorMessage };
  }
}

// Main request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
    
    console.log(`Processing sync request for user ${user.id} (${user.email})`);
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      if (!requestBody || !Array.isArray(requestBody.items) || !requestBody.clientTime) {
        throw new Error('Invalid request format');
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { items, clientTime } = requestBody;
    console.log(`Processing ${items.length} sync items`);
    
    // Process all items in parallel
    const results = await Promise.all(
      items.map((item: SyncItem) => processSyncItem(supabaseAdmin, user, item, clientTime))
    );
    
    // Calculate summary
    const appliedCount = results.filter(r => r.status === 'applied').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const conflictCount = results.filter(r => r.status === 'conflict').length;
    
    console.log(`Sync completed: ${appliedCount} applied, ${errorCount} errors, ${conflictCount} conflicts`);
    
    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total: items.length,
          applied: appliedCount,
          errors: errorCount,
          conflicts: conflictCount
        }
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.stack : String(error)) : undefined
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
})