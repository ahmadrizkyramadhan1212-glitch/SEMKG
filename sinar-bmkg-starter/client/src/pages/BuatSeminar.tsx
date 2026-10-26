// Halaman: Buat Seminar (3 langkah).
import { useNavigate } from 'react-router-dom'
import SeminarForm from '../components/SeminarForm'

export default function BuatSeminar() {
  const navigate = useNavigate()
  return (
    <div className="form-narrow">
      <div className="top">
        <div>
          <h1>Buat Seminar</h1>
          <p>Ajukan seminar ilmiah Anda. Setelah diajukan, jadwal terkunci sampai diverifikasi admin.</p>
        </div>
      </div>
      <div className="card">
        <SeminarForm
          bisaSemua
          selesai={() => {
            alert('Seminar berhasil diajukan dan menunggu verifikasi admin.')
            navigate('/seminar-saya')
          }}
        />
      </div>
    </div>
  )
}
