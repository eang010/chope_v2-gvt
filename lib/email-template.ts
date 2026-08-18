const LOGO_URL = 'https://go.gov.sg/chopelogo'
const CONTACT_EMAIL = 'emily_ang@stb.gov.sg'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Header logo, body, issue line, and automated-footer used by Chope transactional mail. */
export function chopeEmailDocument(bodyParagraph: string): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center" style="text-align:center;">
      <img src="${LOGO_URL}" alt="Chope" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto;" />
      <p>${bodyParagraph}</p>
      <p>For any issues or enquiries, reach out to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
      <p style="margin: 0 0 12px 0; color: #868e96; font-size: 11px; line-height: 1.6; border-top: 1px solid #e9ecef; padding-top: 16px;">
      <strong>Want to manage alerts?</strong><br>
      Open Chope app &gt; Avatar icon in the navigation bar &gt; Settings icon &gt; Email Notifications.
      </p>
      <p style="margin: 0; color: #adb5bd; font-size: 11px;">
      This is an automated message from Chope. Please do not reply to this email.
      </p>
    </td>
  </tr>
</table>`
}
