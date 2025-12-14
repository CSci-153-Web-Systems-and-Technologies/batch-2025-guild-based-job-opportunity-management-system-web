export async function sendAcceptanceEmail(to: string, displayName: string | null, jobTitle: string | null) {
  const apiKey = process.env.SENDGRID_API_KEY
  const from = process.env.MAIL_FROM || 'no-reply@example.com'

  if (!apiKey) {
    console.warn('SENDGRID_API_KEY not set — skipping sendAcceptanceEmail')
    return
  }

  const subject = `Your application was accepted${jobTitle ? ` — ${jobTitle}` : ''}`
  const name = displayName || 'Applicant'
  const text = `${name},\n\nGood news — your application for ${jobTitle || 'the job'} was accepted. An admin will follow up with next steps.\n\nThanks,\nThe Team`
  const html = `<p>${name},</p><p>Good news — your application for <strong>${jobTitle || 'the job'}</strong> was <strong>accepted</strong>. An admin will follow up with next steps.</p><p>Thanks,<br/>The Team</p>`

  const body = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject,
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html }
    ]
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`SendGrid send failed: ${res.status} ${res.statusText} ${errText}`)
  }
}

export default sendAcceptanceEmail
