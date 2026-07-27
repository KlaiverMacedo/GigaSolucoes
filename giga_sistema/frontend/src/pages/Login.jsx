import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import '../App.css'
// Se o nome do seu arquivo de imagem for diferente, ajuste abaixo:
import logoImg from '../assets/logo_giga.png'

function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const [isLoading, setIsLoading] = useState(false)
    const [showVideo, setShowVideo] = useState(false)
    const videoRef = useRef(null)

    // Instanciando o Roteador
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await api.post('/login', {
                username: username,
                password: password
            })

            if (response.status === 200) {
                setShowVideo(true)

                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.play()
                    }
                }, 800)
            }
        } catch (error) {
            console.error("Detalhes do erro:", error)
            setIsLoading(false)
            alert("Acesso negado: Verifique seu usuário e senha.")
        }
    }

    const handleVideoEnd = () => {
        setShowVideo(false)
        // A mágica acontece aqui: Roteamento instantâneo sem recarregar a página!
        navigate('/dashboard')
    }

    return (
        <>
            <div className={`video-overlay ${showVideo ? 'active' : ''}`}>
                <video ref={videoRef} onEnded={handleVideoEnd} playsInline>
                    <source src="/intro.mp4" type="video/mp4" />
                    Seu navegador não suporta vídeos.
                </video>
            </div>

            <div className={`login-wrapper ${showVideo ? 'fade-out' : ''}`}>
                <div className="login-card">
                    <div className="logo-placeholder" style={{ background: 'none', border: 'none' }}>
                        <img
                            src={logoImg}
                            alt="Giga Soluções Audiovisuais"
                            style={{ maxWidth: '100%', maxHeight: '90px', objectFit: 'contain' }}
                        />
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>Usuário / Matrícula</label>
                            <input
                                type="text"
                                placeholder="ex: master@giga"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label>Senha de Acesso</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn-login" disabled={isLoading}>
                            {isLoading ? 'Autenticando...' : 'Iniciar Sessão'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Login;