/**
 * Kirim email lewat Resend (https://resend.com) — cukup API key, tanpa SMTP.
 * Butuh env: RESEND_API_KEY. Opsional: EMAIL_FROM (default alamat uji Resend).
 */
async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Layanan email belum dikonfigurasi (RESEND_API_KEY kosong).');
  const from = process.env.EMAIL_FROM || 'Finance Monitor <onboarding@resend.dev>';

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Email gagal terkirim (${resp.status}): ${t}`);
  }
  return true;
}

module.exports = { sendEmail };
