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


def _send_via_smtp(to_email: str, subject: str, html_content: str) -> bool:
    """Helper to send email via SMTP fallback."""
    if not (settings.SMTP_HOST and settings.SMTP_USERNAME):
        return False
        
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.APP_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_content, "html"))
    
    try:
        print(f"[DEBUG] Attempting SMTP fallback for {to_email} via {settings.SMTP_HOST}...")
        with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT), timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as exc:
        print(f"[EMAIL] SMTP fallback failed for {to_email}: {exc}")
        return False


def send_welcome_email(to_email: str) -> None:
    """Send a welcome email to a new newsletter subscriber."""
    subject = f"Welcome to the {settings.APP_NAME} Newsletter! ✨"
    html = f"""
    <div style="font-family:sans-serif;max-width:500px;margin:20px auto;padding:30px;border:1px solid #eee;border-radius:15px;background:#fcfcfc;">
        <h1 style="color:#4f46e5;margin-bottom:10px;">Welcome Aboard!</h1>
        <p style="font-size:16px;color:#333;line-height:1.6;">Thanks for subscribing to the <b>{settings.APP_NAME}</b> newsletter. You're now part of a community that values clarity and depth in digital storytelling.</p>
        <p style="font-size:16px;color:#333;line-height:1.6;">Expect weekly insights, tech trends, and the best of our community directly in your inbox.</p>
        <div style="margin:30px 0;text-align:center;">
            <a href="{settings.FRONTEND_URL}" style="background:#4f46e5;color:white;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Explore the Blog</a>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="font-size:12px;color:#999;text-align:center;">You're receiving this because you signed up at {settings.FRONTEND_URL}. <br> No spam, just pure value.</p>
    </div>
    """

    if settings.RESEND_API_KEY:
        try:
            resend.api_key = settings.RESEND_API_KEY
            resend.Emails.send({
                "from": f"{settings.APP_NAME} <onboarding@resend.dev>",
                "to": [to_email],
                "subject": subject,
                "html": html
            })
            print(f"[EMAIL] Welcome email sent via Resend to {to_email}")
            return
        except Exception as e:
            print(f"[EMAIL] Resend welcome failed: {e}")

    # Fallback to SMTP
    if _send_via_smtp(to_email, subject, html):
        print(f"[EMAIL] Welcome email sent via SMTP to {to_email}")
    else:
        print(f"[DEV] Welcome email (not sent) for {to_email}")


def send_blog_broadcast(subscribers: list, blog_title: str, blog_slug: str, blog_summary: str) -> None:
    """Send a new blog post broadcast to all subscribers."""
    blog_url = f"{settings.FRONTEND_URL}/blog/{blog_slug}"
    subject = f"New Post: {blog_title} 🚀"
    
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:20px auto;padding:0;border:1px solid #eee;border-radius:15px;overflow:hidden;">
        <div style="background:#4f46e5;padding:30px;text-align:center;">
            <h2 style="color:white;margin:0;">Fresh from the Blog</h2>
        </div>
        <div style="padding:40px;">
            <h1 style="color:#111;font-size:24px;margin-top:0;">{blog_title}</h1>
            <p style="color:#555;font-size:16px;line-height:1.7;margin-bottom:30px;">{blog_summary or 'A new story has been shared on BlogVerse. Dive in to explore the latest insights.'}</p>
            <div style="text-align:center;">
                <a href="{blog_url}" style="background:#4f46e5;color:white;padding:15px 40px;text-decoration:none;border-radius:10px;font-weight:bold;display:inline-block;">Read the Full Story</a>
            </div>
        </div>
        <div style="background:#f9f9f9;padding:20px;text-align:center;border-top:1px solid #eee;">
            <p style="font-size:12px;color:#999;margin:0;">Stay curious. Stay informed. <br> {settings.APP_NAME} Community</p>
        </div>
    </div>
    """

    if settings.RESEND_API_KEY:
        resend.api_key = settings.RESEND_API_KEY
        for email in subscribers:
            try:
                resend.Emails.send({
                    "from": f"{settings.APP_NAME} <onboarding@resend.dev>",
                    "to": [email],
                    "subject": subject,
                    "html": html
                })
                print(f"[EMAIL] Broadcast sent to {email}")
            except Exception as e:
                print(f"[EMAIL] Broadcast failed via Resend for {email}: {e}")
                # Try SMTP fallback for this specific recipient
                if _send_via_smtp(email, subject, html):
                    print(f"[EMAIL] Broadcast sent via SMTP to {email}")
    else:
        # No Resend API Key, try SMTP for all
        sent_count = 0
        for email in subscribers:
            if _send_via_smtp(email, subject, html):
                sent_count += 1
        print(f"[EMAIL] Broadcast completed via SMTP. Sent to {sent_count}/{len(subscribers)} subscribers.")
