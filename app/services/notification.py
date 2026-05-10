"""Send email notifications via Resend API."""
import resend
from app.config import settings


def send_status_email(recipient_email: str, ticket_id: str, status: str, note: str = ""):
    if not settings.RESEND_API_KEY:
        return

    resend.api_key = settings.RESEND_API_KEY
    body = f"""
<h2>Complaint Update — {ticket_id}</h2>
<p>Your complaint status has been updated to: <strong>{status}</strong></p>
{"<p>Note: " + note + "</p>" if note else ""}
<p>Track your complaint at: {settings.FRONTEND_URL}/track/{ticket_id}</p>
<br>
<p>— Smart City GIMS Team</p>
"""
    try:
        resend.Emails.send({
            "from": settings.EMAILS_FROM,
            "to": recipient_email,
            "subject": f"[{ticket_id}] Status Update: {status}",
            "html": body,
        })
    except Exception:
        pass  # notification failure should not block complaint updates
