import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  invitationId: string;
  inviterName: string;
  gameName: string;
  inviteeEmail: string;
  csrfToken?: string;
}

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Sanitize text input
const sanitizeText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  let sanitized = text.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized.replace(/[<>"'&]/g, '');
};

// Validate email format
const validateEmail = (email: string): boolean => {
  if (!email || email.length > 254) return false;
  return EMAIL_REGEX.test(email);
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const resend = new Resend(apiKey);
    
    const { invitationId, inviterName, gameName, inviteeEmail, csrfToken }: InvitationRequest = await req.json();

    // Input validation
    if (!invitationId || !inviterName || !gameName || !inviteeEmail) {
      throw new Error("Missing required fields");
    }

    // Validate email format
    if (!validateEmail(inviteeEmail)) {
      throw new Error("Invalid email format");
    }

    // Sanitize inputs
    const sanitizedInviterName = sanitizeText(inviterName, 50);
    const sanitizedGameName = sanitizeText(gameName, 50);

    if (!sanitizedInviterName || !sanitizedGameName) {
      throw new Error("Invalid input data");
    }

    // Verify invitation exists and is valid
    const { data: invitation, error: invitationError } = await supabase
      .from('game_invitations')
      .select('*, games!inner(name)')
      .eq('id', invitationId)
      .eq('invitee_email', inviteeEmail)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      console.error("Invalid invitation:", invitationError);
      throw new Error("Invalid or expired invitation");
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expires_at)) {
      throw new Error("Invitation has expired");
    }

    // Rate limiting check
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      _user_id: invitation.inviter_id,
      _action_type: 'email_invitation',
      _max_count: 20,
      _window_minutes: 1440 // 24 hours
    });

    if (rateLimitError || !rateLimitCheck) {
      console.error("Rate limit exceeded for user:", invitation.inviter_id);
      throw new Error("Rate limit exceeded");
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      _user_id: invitation.inviter_id,
      _action_type: 'email_sent',
      _resource_type: 'invitation',
      _resource_id: invitationId,
      _details: {
        invitee_email: inviteeEmail,
        game_name: sanitizedGameName
      }
    });

    console.log('Sending email for valid invitation:', { invitationId, sanitizedInviterName, sanitizedGameName, inviteeEmail });

    const appUrl = "https://id-preview--94aaa074-5630-4a6d-ba95-b58d291933e0.lovable.app";
    const invitationUrl = `${appUrl}/lobby?invitation=${invitationId}`;

    const emailResponse = await resend.emails.send({
      from: "Game Invitations <onboarding@resend.dev>",
      to: [inviteeEmail],
      subject: `You're invited to join "${gameName}"!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Game Invitation</h1>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #555; margin-top: 0;">You've been invited!</h2>
            <p style="font-size: 16px; line-height: 1.5;">
              <strong>${sanitizedInviterName}</strong> has invited you to join the game <strong>"${sanitizedGameName}"</strong>.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; font-size: 16px; 
                      display: inline-block;">
              Join Game
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center;">
            Or copy and paste this link in your browser:<br>
            <a href="${invitationUrl}" style="color: #007bff;">${invitationUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This invitation was sent to ${inviteeEmail}. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Check if there's an error in the response
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      throw new Error(`Email delivery failed: ${JSON.stringify(emailResponse.error)}`);
    }

    // Log the email ID for tracking
    if (emailResponse.data) {
      console.log("Email ID:", emailResponse.data.id);
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);