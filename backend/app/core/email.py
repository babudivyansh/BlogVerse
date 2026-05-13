"""Email verification utilities.

If SMTP is configured, sends real emails.  Otherwise prints the
verification link to the console so the app still works in development.
"""

import smtplib
import uuid
import resend
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
      <div style="margin: 32px 0;">
        <a href="{verify_url}"
           style="display:inline-block;padding:12px 32px;background:#6366f1;
                  color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;">
          Verify Email
        </a>
      </div>
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

    # 1. Try Resend API (Preferred for production/Render)
    if settings.RESEND_API_KEY:
        try:
            resend.api_key = settings.RESEND_API_KEY
            params = {
                "from": f"{settings.APP_NAME} <onboarding@resend.dev>",
                "to": [to_email],
                "subject": f"Verify your {settings.APP_NAME} account",
                "html": f"""
                <div style="font-family:sans-serif;max-width:500px;margin:20px auto;padding:20px;border:1px solid #eee;border-radius:10px;">
                    <h2 style="color:#4f46e5;">Welcome to {settings.APP_NAME}!</h2>
                    <p>Please verify your email address to get started:</p>
                    <a href="{verify_url}" style="background:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin:10px 0;">Verify Email</a>
                    <p style="font-size:12px;color:#666;">If the button doesn't work, copy this link: {verify_url}</p>
                </div>
                """
            }
            # Note: If user has a verified domain on Resend, they should change 'from' 
            # for now we use the default sandbox 'onboarding@resend.dev'
            resend.Emails.send(params)
            print(f"[EMAIL] Verification email sent via Resend to {to_email}")
            return
        except Exception as exc:
            print(f"[EMAIL] Resend failed: {exc}")

    # 2. Fallback to SMTP
    if settings.SMTP_HOST and settings.SMTP_USERNAME:
        msg = _build_verification_email(to_email, token)
        try:
            print(f"[DEBUG] Attempting SMTP connection to {settings.SMTP_HOST}:{settings.SMTP_PORT} for {settings.SMTP_USERNAME}...")
            with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT), timeout=10) as server:
                print("[DEBUG] Connected. Starting TLS...")
                if settings.SMTP_USE_TLS:
                    server.starttls()
                print("[DEBUG] TLS started. Logging in...")
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                print("[DEBUG] Logged in. Sending message...")
                server.send_message(msg)
            print(f"[EMAIL] Verification email sent via SMTP to {to_email}")
        except Exception as exc:
            print(f"[EMAIL] SMTP failed: {exc}")
            print(f"[EMAIL] Verification link: {verify_url}")
    else:
        # 3. Development fallback — print link to console
        print(f"[DEV] Verification link for {to_email}: {verify_url}")
