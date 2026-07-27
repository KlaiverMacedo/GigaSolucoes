import { useState, useEffect } from 'react'
import api from '../services/api'
import './Dashboard.css'

function Dashboard() {
    const [tecnicos, setTecnicos] = useState([])
    const [veiculos, setVeiculos] = useState([])
    const [operacoes, setOperacoes] = useState([])
    const [loading, setLoading] = useState(true)

    // Busca os dados da API assim que o componente carrega na tela
    useEffect(() => {
        async function carregarDadosLogisticos() {
            try {
                const [resTecnicos, resVeiculos, resOperacoes] = await Promise.all([
                    api.get('/tecnicos'),
                    api.get('/veiculos'),
                    api.get('/operacoes')
                ])

                setTecnicos(resTecnicos.data)
                setVeiculos(resVeiculos.data)
                setOperacoes(resOperacoes.data)
            } catch (error) {
                console.error("Erro ao carregar dados do painel:", error)
            } finally {
                setLoading(false)
            }
        }

        carregarDadosLogisticos()
    }, [])

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Giga.Sys | Centro de Comando Logístico</h2>
                <p>Monitoramento e Alocação de Recursos Audiovisuais</p>
            </div>

            {loading ? (
                <div style={{ color: '#8892b0', textAlign: 'center', marginTop: '50px' }}>
                    Sincronizando com a base de dados central...
                </div>
            ) : (
                <div className="dashboard-grid">

                    {/* COLUNA 1: OPERAÇÕES (Ordens de Serviço) */}
                    <div className="kanban-column">
                        <h3>Ordens de Serviço <span>{operacoes.length}</span></h3>
                        <div className="cards-list">
                            {operacoes.length === 0 ? (
                                <p style={{ fontSize: '12px', color: '#8892b0' }}>Nenhuma operação cadastrada.</p>
                            ) : (
                                operacoes.map((op) => (
                                    <div className="kanban-card" key={op.id}>
                                        <div className="card-title">OS #{op.os_numero} - {op.cliente_local}</div>
                                        <div className="card-info"><span>Tipo: {op.tipo}</span><span>{op.data_operacao}</span></div>
                                        <div className="card-info"><span>Horário: {op.horario_inicio} ({op.periodo})</span></div>
                                        {op.observacoes && <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '6px' }}>Obs: {op.observacoes}</div>}
                                        <div className="card-badge">Pendente Alocação</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* COLUNA 2: TÉCNICOS DISPONÍVEIS */}
                    <div className="kanban-column">
                        <h3>Equipe Técnica <span>{tecnicos.length}</span></h3>
                        <div className="cards-list">
                            {tecnicos.length === 0 ? (
                                <p style={{ fontSize: '12px', color: '#8892b0' }}>Nenhum técnico cadastrado.</p>
                            ) : (
                                tecnicos.map((tec) => (
                                    <div className="kanban-card" key={tec.id}>
                                        <div className="card-title">{tec.nome}</div>
                                        <div className="card-info"><span>Especialidade: {tec.especialidade}</span></div>
                                        <div className="card-badge" style={{ background: 'rgba(0, 255, 100, 0.1)', color: '#00ff66' }}>Disponível</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* COLUNA 3: FROTA DE VEÍCULOS */}
                    <div className="kanban-column">
                        <h3>Frota de Veículos <span>{veiculos.length}</span></h3>
                        <div className="cards-list">
                            {veiculos.length === 0 ? (
                                <p style={{ fontSize: '12px', color: '#8892b0' }}>Nenhum veículo cadastrado.</p>
                            ) : (
                                veiculos.map((vei) => (
                                    <div className="kanban-card veiculo" key={vei.id}>
                                        <div className="card-title">{vei.modelo}</div>
                                        <div className="card-info"><span>Placa: {vei.placa}</span></div>
                                        <div className="card-badge" style={{ background: 'rgba(67, 100, 247, 0.15)', color: '#6FB1FC' }}>Pronto para Rota</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}

export default Dashboard