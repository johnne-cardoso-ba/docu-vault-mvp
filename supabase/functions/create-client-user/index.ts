import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateClientUserRequest {
  email: string;
  nome: string;
  clientId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: verifyAuthError } = await supabaseAdmin.auth.getUser(token);
    
    if (verifyAuthError || !user) {
      console.error('Auth error:', verifyAuthError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin role
    const { data: roleData, error: verifyRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (verifyRoleError || roleData?.role !== 'admin') {
      console.error('Role verification failed:', verifyRoleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, nome, clientId }: CreateClientUserRequest = await req.json();

    console.log('Admin user:', user.id, 'creating user for client:', { email, nome, clientId });

    // Default password for clients
    const defaultPassword = 'Cliente@2025';

    // Create user with Supabase Auth
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        nome: nome,
      }
    });

    if (createAuthError || !authData?.user) {
      console.error('Error creating auth user:', createAuthError);
      throw createAuthError;
    }

    console.log('Auth user created:', authData.user.id);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        nome: nome,
        email: email,
        deve_trocar_senha: true, // Mark that user must change password
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }

    console.log('Profile created for user:', authData.user.id);

    // Assign 'cliente' role
    const { error: assignRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'cliente',
      });

    if (assignRoleError) {
      console.error('Error assigning role:', assignRoleError);
      throw assignRoleError;
    }

    console.log('Role assigned to user:', authData.user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: authData.user.id,
        defaultPassword: defaultPassword
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in create-client-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
