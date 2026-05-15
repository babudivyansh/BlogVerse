"""Email verification utilities.

If SMTP is configured, sends real emails.  Otherwise prints the
verification link to the console so the app still works in development.
"""

import smtplib
import uuid
import resend
from datetime import datetime
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
                "from": f"{settings.APP_NAME} <hello@blogverse.info>",
                "to": [to_email],
                "subject": f"Welcome to {settings.APP_NAME}! ✨ Please verify your account",
                "html": f"""
                <div style="font-family:sans-serif;max-width:500px;margin:20px auto;padding:40px;border:1px solid #eee;border-radius:20px;background:#ffffff;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
                    <div style="text-align:center;margin-bottom:30px;">
                        <h1 style="color:#4f46e5;margin:0;font-size:28px;">Welcome Home! 🚀</h1>
                        <p style="color:#666;font-size:16px;">We're thrilled to have you join our community.</p>
                    </div>
                    <div style="background:#f9fafb;padding:30px;border-radius:15px;margin-bottom:30px;">
                        <p style="font-size:16px;color:#333;line-height:1.6;margin-top:0;">You're just one step away from unlocking the full {settings.APP_NAME} experience. Please verify your email address by clicking the button below:</p>
                        <div style="text-align:center;margin:30px 0;">
                            <a href="{verify_url}" style="background:#4f46e5;color:white;padding:15px 35px;text-decoration:none;border-radius:10px;font-weight:bold;display:inline-block;font-size:16px;">Verify My Account</a>
                        </div>
                        <p style="font-size:14px;color:#999;text-align:center;margin-bottom:0;">Link not working? Copy this into your browser:<br><span style="color:#4f46e5;">{verify_url}</span></p>
                    </div>
                    <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
                    <p style="font-size:12px;color:#999;text-align:center;line-height:1.5;">This email was sent to {to_email} because you signed up for {settings.APP_NAME}. If you didn't do this, you can safely ignore this email.</p>
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
    """Send a premium welcome email to a new newsletter subscriber."""
    subject = f"Welcome to the {settings.APP_NAME} Family! 🚀"
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:20px auto;padding:0;border:1px solid #eee;border-radius:24px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);padding:50px 40px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:32px;letter-spacing:-0.025em;">You're in! ✨</h1>
            <p style="color:rgba(255,255,255,0.9);font-size:18px;margin-top:10px;">Welcome to the {settings.APP_NAME} Newsletter</p>
        </div>
        <div style="padding:40px;background:white;">
            <p style="font-size:16px;color:#374151;line-height:1.7;margin-top:0;">
                Hello there! We're thrilled to have you with us. You've just joined a community of curious minds dedicated to exploring the future of digital storytelling.
            </p>
            <div style="background:#f9fafb;padding:25px;border-radius:16px;margin:30px 0;">
                <h3 style="color:#111827;margin-top:0;font-size:18px;">What's next?</h3>
                <ul style="color:#4b5563;font-size:15px;padding-left:20px;margin-bottom:0;">
                    <li style="margin-bottom:10px;">Weekly deep-dives into tech and design</li>
                    <li style="margin-bottom:10px;">Early access to featured stories</li>
                    <li style="margin-bottom:10px;">Exclusive community insights</li>
                </ul>
            </div>
            <div style="text-align:center;">
                <a href="{settings.FRONTEND_URL}" style="background:#4f46e5;color:white;padding:16px 40px;text-decoration:none;border-radius:12px;font-weight:bold;display:inline-block;font-size:16px;box-shadow:0 10px 15px -3px rgba(79, 70, 229, 0.3);">Explore the Feed</a>
            </div>
        </div>
        <div style="background:#f3f4f6;padding:30px;text-align:center;">
            <p style="font-size:12px;color:#9ca3af;margin:0;">
                You're receiving this because you subscribed at {settings.FRONTEND_URL}.<br>
                Stay curious. Stay inspired.
            </p>
        </div>
    </div>
    """

    if settings.RESEND_API_KEY:
        try:
            resend.api_key = settings.RESEND_API_KEY
            resend.Emails.send({
                "from": f"{settings.APP_NAME} <hello@blogverse.info>",
                "to": [to_email],
                "subject": subject,
                "html": html
            })
            print(f"[EMAIL] Enhanced Welcome email sent via Resend to {to_email}")
            return
        except Exception as e:
            print(f"[EMAIL] Resend welcome failed: {e}")

    # Fallback to SMTP
    if _send_via_smtp(to_email, subject, html):
        print(f"[EMAIL] Enhanced Welcome email sent via SMTP to {to_email}")
    else:
        print(f"[DEV] Enhanced Welcome email (not sent) for {to_email}")


def send_verification_success_email(to_email: str) -> None:
    """Send a congratulatory email after successful verification."""
    subject = f"Account Verified! Welcome to {settings.APP_NAME} 🎊"
    html = f"""
    <div style="font-family:sans-serif;max-width:500px;margin:20px auto;padding:40px;border:1px solid #eee;border-radius:24px;text-align:center;background:#ffffff;">
        <div style="font-size:60px;margin-bottom:20px;">✅</div>
        <h1 style="color:#111827;margin:0;font-size:26px;">Verification Complete!</h1>
        <p style="color:#6b7280;font-size:16px;line-height:1.6;margin-top:15px;">
            Your account is now fully active. You can now publish stories, leave comments, and engage with the community.
        </p>
        <div style="margin:35px 0;">
            <a href="{settings.FRONTEND_URL}/auth?tab=login" style="background:#4f46e5;color:white;padding:14px 35px;text-decoration:none;border-radius:12px;font-weight:bold;display:inline-block;">Log In Now</a>
        </div>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:30px 0;">
        <p style="font-size:13px;color:#9ca3af;">See you on the other side!</p>
    </div>
    """
    if settings.RESEND_API_KEY:
        try:
            resend.api_key = settings.RESEND_API_KEY
            resend.Emails.send({
                "from": f"{settings.APP_NAME} <hello@blogverse.info>",
                "to": [to_email],
                "subject": subject,
                "html": html
            })
            print(f"[EMAIL] Verification success email sent via Resend to {to_email}")
            return
        except Exception as e:
            print(f"[EMAIL] Resend verification success failed: {e}")

    # Fallback to SMTP
    _send_via_smtp(to_email, subject, html)


def send_login_notification_email(to_email: str, full_name: str) -> None:
    """Send a premium security notification email after a successful login."""
    subject = f"New Login Detected on {settings.APP_NAME} 🛡️"
    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:20px auto;padding:0;border:1px solid #eee;border-radius:24px;overflow:hidden;background:#ffffff;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
        <div style="background:#f8fafc;padding:30px;text-align:center;border-bottom:1px solid #f1f5f9;">
            <div style="background:#e0e7ff;width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-center;margin:0 auto 15px;">
                <span style="font-size:24px;line-height:48px;display:block;width:100%;text-align:center;">🛡️</span>
            </div>
            <h1 style="color:#1e293b;margin:0;font-size:22px;letter-spacing:-0.01em;">Security Notification</h1>
        </div>
        <div style="padding:40px 35px;">
            <h2 style="color:#1e293b;margin:0 0 15px;font-size:18px;">Hi {full_name},</h2>
            <p style="color:#64748b;font-size:15px;line-height:1.7;margin-top:0;">
                Your {settings.APP_NAME} account was just signed into. We're sending this to ensure it was you.
            </p>
            <div style="background:#f1f5f9;padding:20px;border-radius:16px;margin:30px 0;">
                <p style="color:#475569;font-size:13px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Login Details</p>
                <p style="color:#1e293b;font-size:15px;margin:10px 0 0;">
                    <b>Time:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')} UTC<br>
                    <b>Account:</b> {to_email}
                </p>
            </div>
            <p style="color:#64748b;font-size:14px;line-height:1.6;">
                If this was you, you can safely ignore this message. If you don't recognize this activity, please secure your account immediately:
            </p>
            <div style="text-align:center;margin-top:30px;">
                <a href="{settings.FRONTEND_URL}/auth?tab=login" style="background:#4f46e5;color:white;padding:14px 30px;text-decoration:none;border-radius:10px;font-weight:bold;display:inline-block;font-size:14px;">Secure My Account</a>
            </div>
        </div>
        <div style="background:#f8fafc;padding:25px;text-align:center;border-top:1px solid #f1f5f9;">
            <p style="font-size:11px;color:#94a3b8;margin:0;">
                Security is our priority. Sent by the {settings.APP_NAME} Team.
            </p>
        </div>
    </div>
    """
    if settings.RESEND_API_KEY:
        try:
            resend.api_key = settings.RESEND_API_KEY
            resend.Emails.send({
                "from": f"{settings.APP_NAME} <hello@blogverse.info>",
                "to": [to_email],
                "subject": subject,
                "html": html
            })
            print(f"[EMAIL] Login notification sent via Resend to {to_email}")
            return
        except Exception as e:
            print(f"[EMAIL] Resend login notification failed: {e}")

    # Fallback to SMTP
    _send_via_smtp(to_email, subject, html)


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
                    "from": f"{settings.APP_NAME} <hello@blogverse.info>",
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
