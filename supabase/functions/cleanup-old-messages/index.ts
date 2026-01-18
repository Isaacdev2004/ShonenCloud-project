import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Delete global chat messages older than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { error: chatError } = await supabaseClient
      .from('global_chat_messages')
      .delete()
      .lt('created_at', twoHoursAgo)

    if (chatError) {
      console.error('Error deleting old chat messages:', chatError)
    } else {
      console.log('Successfully deleted old chat messages')
    }

    // Delete arena posts older than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { error: arenaError } = await supabaseClient
      .from('arena_posts')
      .delete()
      .lt('created_at', fifteenMinutesAgo)

    if (arenaError) {
      console.error('Error deleting old arena posts:', arenaError)
    } else {
      console.log('Successfully deleted old arena posts')
    }

    // Delete battle feed entries older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { error: battleFeedError } = await supabaseClient
      .from('battle_feed')
      .delete()
      .lt('created_at', fiveMinutesAgo)

    if (battleFeedError) {
      console.error('Error deleting old battle feed entries:', battleFeedError)
    } else {
      console.log('Successfully deleted old battle feed entries')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Cleanup completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in cleanup function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})