"""Email verification utilities.

If SMTP is configured, sends real emails.  Otherwise prints the
verification link to the console so the app still works in development.
"""

import smtplib
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def generate_verification_token() -> str:
    """Return a unique token for email verification."""
    return uuid.uuid4().hex


def _build_verification_email(to_email: str, token: str) -> MIMEMultipart:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Verify your {settings.APP_NAME} account"
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email

    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;">
      <h2 style="color:#6366f1;">Welcome to {settings.APP_NAME}!</h2>
      <p>Click the button below to verify your email address:</p>
      <a href="{verify_url}"
         style="display:inline-block;padding:12px 32px;background:#6366f1;
                color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Verify Email
      </a>
      <p style="margin-top:24px;color:#64748b;font-size:14px;">
        Or copy this link: {verify_url}
      </p>
    </div>
    """
    msg.attach(MIMEText(html, "html"))
    return msg


def send_verification_email(to_email: str, token: str) -> None:
    """Send (or log) a verification email."""
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    if settings.SMTP_HOST and settings.SMTP_USERNAME:
        msg = _build_verification_email(to_email, token)
        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
            print(f"[EMAIL] Verification email sent to {to_email}")
        except Exception as exc:
            print(f"[EMAIL] Failed to send email: {exc}")
            print(f"[EMAIL] Verification link: {verify_url}")
    else:
        # Development fallback — print link to console
        print(f"[DEV] Verification link for {to_email}: {verify_url}")
