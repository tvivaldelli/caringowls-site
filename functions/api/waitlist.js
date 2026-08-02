export async function onRequestPost(context) {
  const { env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "https://caringowls.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const body = await context.request.json();

    const {
      caregiverFirstName,
      caregiverLastName,
      caregiverEmail,
      recipientFirstName,
      recipientLastName,
      recipientPhone,
      relationship,
      recipientUsesIphone,
      recipientTextsMessages,
      recipientJourneyStage,
      caregiverProximity,
      consentChecked,
    } = body;

    // Validate required fields
    const missing = [];
    if (!caregiverFirstName?.trim()) missing.push("caregiverFirstName");
    if (!caregiverLastName?.trim()) missing.push("caregiverLastName");
    if (!caregiverEmail?.trim()) missing.push("caregiverEmail");
    if (!recipientFirstName?.trim()) missing.push("recipientFirstName");
    if (!recipientLastName?.trim()) missing.push("recipientLastName");
    if (!recipientPhone?.trim()) missing.push("recipientPhone");
    if (!relationship?.trim()) missing.push("relationship");
    if (!recipientUsesIphone?.trim()) missing.push("recipientUsesIphone");
    if (!recipientTextsMessages?.trim()) missing.push("recipientTextsMessages");
    if (!recipientJourneyStage?.trim()) missing.push("recipientJourneyStage");
    if (!caregiverProximity?.trim()) missing.push("caregiverProximity");

    if (missing.length > 0) {
      return Response.json(
        { success: false, error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(caregiverEmail.trim())) {
      return Response.json(
        { success: false, error: "Invalid email address" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Store in D1
    await env.DB.prepare(
      `INSERT INTO waitlist (
        caregiver_first_name, caregiver_last_name, caregiver_email,
        recipient_first_name, recipient_last_name, recipient_phone,
        relationship, recipient_uses_iphone, recipient_texts_messages,
        recipient_journey_stage, caregiver_proximity, consent_checked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        caregiverFirstName.trim(),
        caregiverLastName.trim(),
        caregiverEmail.trim().toLowerCase(),
        recipientFirstName.trim(),
        recipientLastName.trim(),
        recipientPhone.trim(),
        relationship.trim(),
        recipientUsesIphone.trim(),
        recipientTextsMessages.trim(),
        recipientJourneyStage.trim(),
        caregiverProximity.trim(),
        consentChecked ? 1 : 0
      )
      .run();

    // Send confirmation email via Resend
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Caring Owls <noreply@caringowls.com>",
          reply_to: "hello@caringowls.com",
          to: [caregiverEmail.trim().toLowerCase()],
          subject: "Welcome to Caring Owls — We received your request",
          html: buildConfirmationHtml(
            caregiverFirstName.trim(),
            recipientFirstName.trim(),
            recipientPhone.trim(),
            consentChecked
          ),
          text: buildConfirmationText(
            caregiverFirstName.trim(),
            recipientFirstName.trim(),
            recipientPhone.trim(),
            consentChecked
          ),
        }),
      });
    } catch (emailErr) {
      // Log but don't fail the request — submission is already stored
      console.error("Failed to send confirmation email:", emailErr);
    }

    // Notify the operator of the new submission (includes qualification
    // answers and flags the non-iPhone case). Non-fatal on failure.
    try {
      const notifyTo = env.NOTIFY_EMAIL || "hello@caringowls.com";
      const notifyData = {
        caregiverFirstName: caregiverFirstName.trim(),
        caregiverLastName: caregiverLastName.trim(),
        caregiverEmail: caregiverEmail.trim().toLowerCase(),
        recipientFirstName: recipientFirstName.trim(),
        recipientLastName: recipientLastName.trim(),
        recipientPhone: recipientPhone.trim(),
        relationship: relationship.trim(),
        iphone: labelValue(IPHONE_LABELS, recipientUsesIphone),
        texts: labelValue(TEXTS_LABELS, recipientTextsMessages),
        journey: labelValue(JOURNEY_LABELS, recipientJourneyStage),
        proximity: labelValue(PROXIMITY_LABELS, caregiverProximity),
        iphoneNo: recipientUsesIphone.trim().toLowerCase() === "no",
      };
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Caring Owls <noreply@caringowls.com>",
          reply_to: notifyData.caregiverEmail,
          to: [notifyTo],
          subject: `${notifyData.iphoneNo ? "[NON-IPHONE] " : ""}New Request Access — ${notifyData.caregiverFirstName} ${notifyData.caregiverLastName}`,
          html: buildOperatorHtml(notifyData),
          text: buildOperatorText(notifyData),
        }),
      });
    } catch (notifyErr) {
      // Log but don't fail the request — submission is already stored
      console.error("Failed to send operator notification:", notifyErr);
    }

    return Response.json(
      { success: true, message: "Waitlist submission received" },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Waitlist submission error:", err);
    return Response.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://caringowls.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

const IPHONE_LABELS = { yes: "Yes", no: "No" };
const TEXTS_LABELS = { yes: "Yes", no: "No", sometimes: "Sometimes" };
const JOURNEY_LABELS = {
  early: "Early changes",
  moderate: "Moderate decline",
  significant: "Significant decline",
  "not-sure": "Not sure",
};
const PROXIMITY_LABELS = { local: "Local", remote: "Remote" };

function labelValue(map, raw) {
  const key = String(raw ?? "").trim().toLowerCase();
  return map[key] || String(raw ?? "").trim();
}

function buildOperatorText(d) {
  return `New Request Access submission

Caregiver: ${d.caregiverFirstName} ${d.caregiverLastName} <${d.caregiverEmail}>
Loved one: ${d.recipientFirstName} ${d.recipientLastName}
Phone: ${d.recipientPhone}
Relationship: ${d.relationship}

Qualification
- Uses an iPhone: ${d.iphone}${d.iphoneNo ? "  [FLAG: Caring Owls supports iPhone only]" : ""}
- Sends/receives texts: ${d.texts}
- Journey stage: ${d.journey}
- Caregiver proximity: ${d.proximity}

Consent: agreed`;
}

function buildOperatorHtml(d) {
  const flag = d.iphoneNo
    ? ` <span style="color: #b45309; font-weight: 600;">— Caring Owls supports iPhone only</span>`
    : "";
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #292524; line-height: 1.6; max-width: 560px; margin: 0 auto; padding: 2rem;">
  <h2 style="font-size: 1.25rem; color: #1c1917;">New Request Access submission${d.iphoneNo ? ' <span style="color: #b45309;">[NON-IPHONE]</span>' : ""}</h2>
  <p><strong>Caregiver:</strong> ${d.caregiverFirstName} ${d.caregiverLastName} &lt;<a href="mailto:${d.caregiverEmail}" style="color: #b45309;">${d.caregiverEmail}</a>&gt;<br>
  <strong>Loved one:</strong> ${d.recipientFirstName} ${d.recipientLastName}<br>
  <strong>Phone:</strong> ${d.recipientPhone}<br>
  <strong>Relationship:</strong> ${d.relationship}</p>
  <h3 style="color: #44403c; margin-top: 1.5rem;">Qualification</h3>
  <ul>
    <li><strong>Uses an iPhone:</strong> ${d.iphone}${flag}</li>
    <li><strong>Sends/receives texts:</strong> ${d.texts}</li>
    <li><strong>Journey stage:</strong> ${d.journey}</li>
    <li><strong>Caregiver proximity:</strong> ${d.proximity}</li>
  </ul>
  <p style="font-size: 0.85rem; color: #78716c;">Reply to this email to reach the caregiver directly.</p>
</body>
</html>`;
}

function buildConfirmationText(caregiverFirstName, recipientFirstName, recipientPhone, consentChecked) {
  const smsText = consentChecked
    ? `SMS Messaging: By signing up, you consented to Caring Owls sending and receiving SMS messages on behalf of ${recipientFirstName} at ${recipientPhone}. Message frequency varies. Message and data rates may apply. Reply STOP to any message to opt out.`
    : `SMS Messaging: You have not yet opted in to SMS messaging. If you'd like Caring Owls to send and receive SMS messages on behalf of ${recipientFirstName} at ${recipientPhone}, you can opt in at any time by replying to this email or contacting us at hello@caringowls.com.`;

  return `Hi ${caregiverFirstName},

Thank you for signing up for Caring Owls. We received your request to set up communication protection for ${recipientFirstName}.

Here's what happens next:
- Our team will review your submission and reach out to schedule setup.
- In the meantime, start thinking about which phone contacts should be on ${recipientFirstName}'s approved list.
- If you have questions, reply to this email or reach us at hello@caringowls.com.

What is Caring Owls?
Caring Owls filters calls and text messages for elderly individuals with cognitive decline, allowing only pre-approved contacts to reach them. As an authorized caregiver, you'll manage the approved contact list through our web dashboard.

${smsText}

Thank you for protecting your loved one.

— The Caring Owls Team
Vival Ventures LLC
caringowls.com`;
}

function buildConfirmationHtml(caregiverFirstName, recipientFirstName, recipientPhone, consentChecked) {
  const smsHtml = consentChecked
    ? `<strong>SMS Messaging:</strong> By signing up, you consented to Caring Owls sending and receiving SMS messages on behalf of ${recipientFirstName} at ${recipientPhone}. Message frequency varies. Message and data rates may apply. Reply STOP to any message to opt out.`
    : `<strong>SMS Messaging:</strong> You have not yet opted in to SMS messaging. If you'd like Caring Owls to send and receive SMS messages on behalf of ${recipientFirstName} at ${recipientPhone}, you can opt in at any time by replying to this email or contacting us at <a href="mailto:hello@caringowls.com" style="color: #b45309;">hello@caringowls.com</a>.`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #292524; line-height: 1.6; max-width: 560px; margin: 0 auto; padding: 2rem;">
  <div style="text-align: center; margin-bottom: 2rem;">
    <h1 style="font-size: 1.5rem; color: #1c1917; margin-bottom: 0.25rem;">Caring Owls</h1>
  </div>
  <p>Hi ${caregiverFirstName},</p>
  <p>Thank you for signing up for Caring Owls. We received your request to set up communication protection for <strong>${recipientFirstName}</strong>.</p>
  <h3 style="color: #44403c; margin-top: 1.5rem;">Here's what happens next:</h3>
  <ul>
    <li>Our team will review your submission and reach out to schedule setup.</li>
    <li>In the meantime, start thinking about which phone contacts should be on ${recipientFirstName}'s approved list.</li>
    <li>If you have questions, reply to this email or reach us at <a href="mailto:hello@caringowls.com" style="color: #b45309;">hello@caringowls.com</a>.</li>
  </ul>
  <h3 style="color: #44403c; margin-top: 1.5rem;">What is Caring Owls?</h3>
  <p>Caring Owls filters calls and text messages for elderly individuals with cognitive decline, allowing only pre-approved contacts to reach them. As an authorized caregiver, you'll manage the approved contact list through our web dashboard.</p>
  <p style="font-size: 0.85rem; color: #78716c; margin-top: 2rem; border-top: 1px solid #e7e5e4; padding-top: 1rem;">
    ${smsHtml}
  </p>
  <p style="font-size: 0.85rem; color: #78716c;">
    — The Caring Owls Team<br>
    Vival Ventures LLC<br>
    <a href="https://caringowls.com" style="color: #b45309;">caringowls.com</a>
  </p>
</body>
</html>`;
}
