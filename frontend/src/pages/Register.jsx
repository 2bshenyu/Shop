import React, {useState} from 'react'
import api from '../api'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../components/Toast'

export default function Register(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('buyer')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()
  const toast = useToast()

  async function onSubmit(e){
    e.preventDefault();
    try{
      setLoading(true)
      const res = await api.request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name: 'Student', role }) });
      api.setToken(res.token);
      const qp = new URLSearchParams(loc.search);
      const next = qp.get('next');
      if (next) nav(next); else nav('/');
    }catch(err){
      toast.push('注册失败')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card" style={{maxWidth:480, margin:'0 auto'}}>
        <h2>Register</h2>
        <form onSubmit={onSubmit} style={{display:'flex', flexDirection:'column', gap:12}}>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" />
          <label>身份</label>
          <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="buyer">买家</option>
            <option value="merchant">商家</option>
          </select>
          <button className="button" type="submit" disabled={loading} style={{marginTop:6}}>
            {loading ? <span className="spinner"/> : null}
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  )
}
