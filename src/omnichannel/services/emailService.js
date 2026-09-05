/** IMAP/SMTP E-Mail service layer */
export const emailService = {
  channel: 'email',
  async fetchInbox({ imapHost, username, password }) {
    return { imapHost, username, action: 'FETCH_UNSEEN', simulated: true }
  },
  async sendMail({ smtpHost, from, to, subject, body, attachments = [], product }) {
    const resolvedFrom =
      from ||
      (product === 'studio'
        ? 'Bachmain Studio <studio@bachmain.com>'
        : 'BACHMAIN <noreply@bachmain.com>')
    return {
      smtpHost,
      from: resolvedFrom,
      to,
      subject,
      body,
      attachments,
      product: product || null,
      simulated: true,
    }
  },
}
