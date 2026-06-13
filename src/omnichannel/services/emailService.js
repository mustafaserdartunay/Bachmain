/** IMAP/SMTP E-Mail service layer */
export const emailService = {
  channel: 'email',
  async fetchInbox({ imapHost, username, password }) {
    return { imapHost, username, action: 'FETCH_UNSEEN', simulated: true }
  },
  async sendMail({ smtpHost, from, to, subject, body, attachments = [] }) {
    return {
      smtpHost,
      from,
      to,
      subject,
      body,
      attachments,
      simulated: true,
    }
  },
}
