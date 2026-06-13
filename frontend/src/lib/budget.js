// Hitung total pengeluaran (expense) untuk hari ini / minggu ini / bulan ini
// dari daftar cashflow. Transfer (beli aset, hutang/piutang) TIDAK dihitung.
// Semua dihitung dalam waktu lokal pengguna.

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function startOfWeek(d) {
  const x = startOfDay(d)
  const day = (x.getDay() + 6) % 7 // Senin = 0
  x.setDate(x.getDate() - day)
  return x
}
function startOfMonth(d) {
  const x = new Date(d)
  return new Date(x.getFullYear(), x.getMonth(), 1)
}

export function computeSpent(flows) {
  const now = new Date()
  const sod = startOfDay(now)
  const sow = startOfWeek(now)
  const som = startOfMonth(now)
  let daily = 0, weekly = 0, monthly = 0
  ;(flows || []).filter(f => f.type === 'expense').forEach(f => {
    const d = new Date(f.date)
    const amt = Number(f.amount) || 0
    if (d >= som) monthly += amt
    if (d >= sow) weekly += amt
    if (d >= sod) daily += amt
  })
  return { daily, weekly, monthly }
}
