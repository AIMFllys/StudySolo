"""Email service using Aliyun DirectMail SMTP.

Sends verification code emails via SMTP SSL (port 465).
Shared SMTP account: accounts@email.1037solo.com
"""

import logging
import random
import smtplib
import string
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _generate_code(length: int = 6) -> str:
    """Generate a random numeric verification code."""
    return "".join(random.choices(string.digits, k=length))


def _build_verification_email_html(code: str) -> str:
    """Build a branded HTML email template for verification codes."""
    return f"""\
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:40px 20px;">
    <tr><td align="center">
      <table width="460" cellpadding="0" cellspacing="0" style="background:#1E293B;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:32px 32px 0;text-align:center;">
          <div style="font-size:28px;font-weight:700;background:linear-gradient(135deg,#6366F1,#818CF8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
            ⚡ StudySolo
          </div>
          <div style="font-size:12px;color:#94A3B8;margin-top:4px;">1037Solo 统一账户</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="color:#E2E8F0;font-size:15px;margin:0 0 8px;">您好，</p>
          <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;line-height:1.6;">
            您正在进行账号验证操作，以下是您的验证码：
          </p>
          <div style="text-align:center;margin:24px 0;">
            <div style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#6366F1,#4F46E5);border-radius:12px;letter-spacing:8px;font-size:32px;font-weight:700;color:#FFFFFF;">
              {code}
            </div>
          </div>
          <p style="color:#94A3B8;font-size:13px;text-align:center;margin:16px 0 0;">
            验证码 <strong style="color:#E2E8F0;">5 分钟</strong>内有效，请勿告知他人
          </p>
        </td></tr>
        <!-- Divider -->
        <tr><td style="padding:0 32px;">
          <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px 28px;text-align:center;">
          <p style="color:#64748B;font-size:11px;margin:0;line-height:1.6;">
            如果您没有请求此验证码，请忽略此邮件。<br>
            © {datetime.now().year} 1037Solo Team · 
            <a href="https://studyflow.1037solo.com" style="color:#6366F1;text-decoration:none;">studyflow.1037solo.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


class EmailService:
    """Send emails via Aliyun DirectMail SMTP."""

    def __init__(self) -> None:
        s = get_settings()
        self.smtp_host = s.smtp_host
        self.smtp_port = s.smtp_port
        self.smtp_user = s.smtp_user
        self.smtp_pass = s.smtp_pass

    def _send(self, to: str, subject: str, html_body: str) -> None:
        """Send an email via SMTP SSL."""
        msg = MIMEMultipart("alternative")
        msg["From"] = f"StudySolo <{self.smtp_user}>"
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        try:
            with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=10) as server:
                server.login(self.smtp_user, self.smtp_pass)
                server.sendmail(self.smtp_user, [to], msg.as_string())
            logger.info("Email sent to %s", to)
        except Exception:
            logger.exception("Failed to send email to %s", to)
            raise

    def send_verification_code(self, to: str, code: str) -> None:
        """Send a verification code email."""
        subject = f"【StudySolo】验证码：{code}"
        html = _build_verification_email_html(code)
        self._send(to, subject, html)


# ---------------------------------------------------------------------------
# Helper: generate code + store in DB + send email
# ---------------------------------------------------------------------------

async def send_verification_code_to_email(
    email: str,
    code_type: str,
    db_client,
) -> str:
    """Generate a 6-digit code, store it, and send via email.

    Returns the generated code (useful for testing).
    """
    code = _generate_code()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()

    # Mark previous unused codes for this email+type as used
    await db_client.from_("verification_codes_v2").update(
        {"is_used": True}
    ).eq("email", email).eq("type", code_type).eq("is_used", False).execute()

    # Insert new code
    await db_client.from_("verification_codes_v2").insert({
        "email": email,
        "code": code,
        "type": code_type,
        "is_used": False,
        "expires_at": expires_at,
    }).execute()

    # Send email
    service = EmailService()
    service.send_verification_code(email, code)

    return code


async def verify_code(
    email: str,
    code: str,
    code_type: str,
    db_client,
) -> bool:
    """Verify a code against the database.

    Returns True if valid, False otherwise.
    Marks the code as used on success.
    """
    now = datetime.now(timezone.utc).isoformat()

    result = await db_client.from_("verification_codes_v2").select("id").eq(
        "email", email
    ).eq("code", code).eq("type", code_type).eq("is_used", False).gte(
        "expires_at", now
    ).limit(1).execute()

    if not result.data:
        return False

    # Mark as used
    code_id = result.data[0]["id"]
    await db_client.from_("verification_codes_v2").update(
        {"is_used": True}
    ).eq("id", code_id).execute()

    return True
