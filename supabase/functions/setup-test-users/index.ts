import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestUser {
  email: string;
  password: string;
  nome: string;
  role: 'admin' | 'colaborador' | 'cliente';
}

const testUsers: TestUser[] = [
  {
    email: 'adm@gmail.com',
    password: 'admin',
    nome: 'Administrador',
    role: 'admin',
  },
  {
    email: 'colaborador@gmail.com',
    password: 'colaborador',
    nome: 'Colaborador',
    role: 'colaborador',
  },
  {
    email: 'cliente@gmail.com',
    password: 'cliente',
    nome: 'Cliente',
    role: 'cliente',
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const results = [];

    for (const user of testUsers) {
      console.log(`Creating user: ${user.email}`);

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(u => u.email === user.email);

      if (userExists) {
        console.log(`User ${user.email} already exists, skipping...`);
        results.push({ email: user.email, status: 'already_exists' });
        continue;
      }

      // Create user with admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          nome: user.nome,
        },
      });

      if (authError) {
        console.error(`Error creating user ${user.email}:`, authError);
        results.push({ email: user.email, status: 'error', error: authError.message });
        continue;
      }

      // Insert role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: user.role,
        });

      if (roleError) {
        console.error(`Error inserting role for ${user.email}:`, roleError);
        results.push({ email: user.email, status: 'error', error: roleError.message });
        continue;
      }

      // Insert profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          nome: user.nome,
          email: user.email,
        });

      if (profileError) {
        console.error(`Error inserting profile for ${user.email}:`, profileError);
      }

      console.log(`User ${user.email} created successfully`);
      results.push({ email: user.email, status: 'created' });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in setup-test-users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
