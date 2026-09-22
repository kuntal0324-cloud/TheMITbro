#!/usr/bin/env python3
"""Generate the mobile-fillable Set 01 controlled-test authorization form."""

from __future__ import annotations

from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.acroform import AcroForm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from commercial_authorization_common import (
    ATTESTATION,
    AUTHORIZATION_TEMPLATE_PATH,
    CANDIDATE_ID,
    CURRENCY,
    PAYMENT_MODE,
    PRICE_RUPEES,
    PRODUCT_ID,
    load_release_basis,
)

WIDTH, HEIGHT = A4
MARGIN = 42
INK = HexColor("#132238")
BLUE = HexColor("#185adb")
MUTED = HexColor("#5b6b80")
LINE = HexColor("#cfd8e6")
PALE_BLUE = HexColor("#eef5ff")
PALE_AMBER = HexColor("#fff5df")
FONT = "DejaVuSans"
FONT_BOLD = "DejaVuSans-Bold"

pdfmetrics.registerFont(TTFont(FONT, "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont(FONT_BOLD, "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))


def draw_wrapped(c: canvas.Canvas, text: str, x: float, y: float, width: float, *, size: float = 9.2, leading: float = 12) -> float:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if c.stringWidth(candidate, FONT, size) <= width:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    c.setFont(FONT, size)
    c.setFillColor(INK)
    for value in lines:
        c.drawString(x, y, value)
        y -= leading
    return y


def header(c: canvas.Canvas, page: int, title: str) -> float:
    c.setFillColor(INK)
    c.rect(0, HEIGHT - 74, WIDTH, 74, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 16)
    c.drawString(MARGIN, HEIGHT - 38, "TheMITbro · Commercial Authorization")
    c.setFont(FONT, 8.5)
    c.drawRightString(WIDTH - MARGIN, HEIGHT - 38, f"Set 01 · page {page}/3")
    c.setFillColor(INK)
    c.setFont(FONT_BOLD, 15)
    c.drawString(MARGIN, HEIGHT - 103, title)
    return HEIGHT - 123


def footer(c: canvas.Canvas) -> None:
    c.setStrokeColor(LINE)
    c.line(MARGIN, 30, WIDTH - MARGIN, 30)
    c.setFillColor(MUTED)
    c.setFont(FONT, 7.5)
    c.drawString(MARGIN, 18, "Controlled TEST authorization only · no live payment or bundle authorization")


def label(c: canvas.Canvas, text: str, x: float, y: float) -> None:
    c.setFillColor(INK)
    c.setFont(FONT_BOLD, 8.5)
    c.drawString(x, y, text)


def text_field(
    c: canvas.Canvas,
    form: AcroForm,
    name: str,
    label_text: str,
    y: float,
    *,
    value: str = "",
    height: float = 24,
    multiline: bool = False,
    read_only: bool = False,
    font_size: float = 8.5,
) -> float:
    label(c, label_text, MARGIN, y)
    flags: list[str] = []
    if multiline:
        flags.append("multiline")
    if read_only:
        flags.append("readOnly")
    form.textfield(
        name=name,
        tooltip=label_text,
        value=value,
        x=MARGIN,
        y=y - height - 5,
        width=WIDTH - 2 * MARGIN,
        height=height,
        borderColor=LINE,
        fillColor=white if not read_only else PALE_BLUE,
        textColor=black,
        forceBorder=True,
        borderWidth=1,
        fontName="Helvetica",
        fontSize=font_size,
        fieldFlags=" ".join(flags),
    )
    return y - height - 19


def checkbox(c: canvas.Canvas, form: AcroForm, name: str, text: str, y: float) -> float:
    form.checkbox(
        name=name,
        tooltip=text,
        x=MARGIN,
        y=y - 11,
        size=13,
        checked=False,
        buttonStyle="check",
        borderColor=LINE,
        fillColor=white,
        textColor=BLUE,
        forceBorder=True,
    )
    return draw_wrapped(c, text, MARGIN + 22, y, WIDTH - 2 * MARGIN - 22, size=8.8, leading=11) - 8


def main() -> None:
    basis = load_release_basis()
    AUTHORIZATION_TEMPLATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(AUTHORIZATION_TEMPLATE_PATH), pagesize=A4, pageCompression=1)
    c.setTitle("GATE 2027 EE Set 01 Commercial Authorization — Controlled Test")
    c.setAuthor("TheMITbro release controls")
    form = c.acroForm

    y = header(c, 1, "A. Fixed release scope and seller identity")
    c.setFillColor(PALE_AMBER)
    c.roundRect(MARGIN, y - 48, WIDTH - 2 * MARGIN, 42, 8, fill=1, stroke=0)
    y = draw_wrapped(
        c,
        "This form can authorize only a controlled Razorpay TEST-mode listing. It cannot authorize live payments, public launch, preorders, or the 20/50-paper bundles.",
        MARGIN + 10,
        y - 20,
        WIDTH - 2 * MARGIN - 20,
        size=8.6,
        leading=11,
    ) - 12
    for name, title, value, font_size in [
        ("product_id", "Product ID (fixed)", PRODUCT_ID, 8.5),
        ("candidate_id", "Candidate ID (fixed)", CANDIDATE_ID, 8.5),
        ("currency", "Currency (fixed)", CURRENCY, 8.5),
        ("price_rupees", "Individual price in rupees (fixed)", str(PRICE_RUPEES), 8.5),
        ("payment_mode", "Payment mode (fixed)", PAYMENT_MODE, 8.5),
        ("learner_pack_sha256", "Exact learner-pack SHA-256 (fixed)", basis["learner_pack_sha256"], 6.8),
    ]:
        y = text_field(c, form, name, title, y, value=value, read_only=True, font_size=font_size)
    y = text_field(c, form, "legal_seller_name", "Legal seller/business name *", y)
    y = text_field(c, form, "trading_name", "Trading/brand name *", y)
    footer(c)
    c.showPage()

    y = header(c, 2, "B. Address, customer care, grievance and policy review")
    y = text_field(c, form, "principal_geographic_address", "Principal geographic business address *", y, height=42, multiline=True)
    y = text_field(c, form, "customer_care_email", "Customer-care email *", y)
    y = text_field(c, form, "customer_care_phone", "Customer-care telephone (with country code) *", y)
    y = text_field(c, form, "grievance_officer_name", "Grievance officer name/title *", y)
    y = text_field(c, form, "grievance_email", "Grievance email *", y)
    y = text_field(c, form, "grievance_phone", "Grievance telephone (with country code) *", y)
    y = text_field(c, form, "business_tax_identifiers", "Public business/tax identifiers required for display (or 'Not applicable') *", y, height=34, multiline=True)
    label(c, "Policy review — tick every box after reviewing the deployed wording", MARGIN, y)
    y -= 20
    for name, text in [
        ("privacy_reviewed", "Privacy Notice reviewed and accurate for controlled test mode."),
        ("terms_reviewed", "Terms & Conditions reviewed and accurate for controlled test mode."),
        ("refund_reviewed", "Refund & Cancellation Policy reviewed and accurate for controlled test mode."),
        ("contact_reviewed", "Contact & Support page reviewed and accurate for controlled test mode."),
    ]:
        y = checkbox(c, form, name, text, y)
    y = text_field(c, form, "policy_review_date", "Policy review date (YYYY-MM-DD) *", y)
    footer(c)
    c.showPage()

    y = header(c, 3, "C. Explicit controlled-test decision and sign-off")
    for name, text in [
        ("sale_authorized_test", "Authorize the exact Set 01 RC1 learner pack at INR 29 for controlled TEST transactions only."),
        ("storefront_activated_test", "Authorize the Set 01 listing to appear as a clearly labelled TEST purchase in a controlled preview."),
        ("no_live_payment_confirmed", "Confirm that live Razorpay credentials, real payments and public production sale remain prohibited."),
        ("bundles_blocked_confirmed", "Confirm that the 20-paper and 50-paper bundles remain locked and cannot be purchased."),
    ]:
        y = checkbox(c, form, name, text, y)
    y -= 2
    y = text_field(c, form, "candidate_content_sha256", "Candidate content SHA-256 (fixed)", y, value=basis["candidate_content_sha256"], read_only=True, font_size=6.8)
    y = text_field(c, form, "release_authorization_content_sha256", "Exact-artifact authorization SHA-256 (fixed)", y, value=basis["release_authorization_content_sha256"], read_only=True, font_size=6.8)
    y = text_field(c, form, "authorized_by", "Authorizer full name *", y)
    y = text_field(c, form, "role_or_authority", "Role/authority *", y)
    y = text_field(c, form, "authorization_date", "Authorization date (YYYY-MM-DD) *", y)
    y = text_field(c, form, "signature", "Typed signature (full legal name) *", y)
    label(c, "Required attestation (fixed)", MARGIN, y)
    y -= 82
    c.setFillColor(PALE_BLUE)
    c.setStrokeColor(LINE)
    c.roundRect(MARGIN, y, WIDTH - 2 * MARGIN, 68, 6, fill=1, stroke=1)
    draw_wrapped(c, ATTESTATION, MARGIN + 9, y + 54, WIDTH - 2 * MARGIN - 18, size=7.5, leading=10)
    form.textfield(
        name="attestation_text",
        tooltip="Required controlled-test attestation",
        value=ATTESTATION,
        x=1,
        y=1,
        width=1,
        height=1,
        borderColor=white,
        fillColor=white,
        textColor=white,
        forceBorder=False,
        borderWidth=0,
        fontName="Helvetica",
        fontSize=1,
        fieldFlags="readOnly",
    )
    y -= 17
    checkbox(c, form, "attestation_confirmed", "I have read, understand and accept the fixed attestation above.", y)
    footer(c)
    c.save()
    print(f"Created: {AUTHORIZATION_TEMPLATE_PATH}")


if __name__ == "__main__":
    main()
