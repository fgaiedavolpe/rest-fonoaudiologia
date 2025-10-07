import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Volume2, Download, RefreshCw, FileText, User, Calendar, Save, FolderOpen, X, Printer } from 'lucide-react'
import './App.css'

// Listas de fonemas baseadas no IPA para o Português
const CONSOANTES = [
  'p', 't', 'k', 'b', 'd', 'g', 'f', 's', 'ʃ', 'v', 'z', 'ʒ', 'm', 'n', 'ɲ', 'l', 'r', 'ʎ', 'R'
]

const ENCONTROS_CONSONANTAIS = [
  'pl', 'tl', 'kl', 'bl', 'dl', 'gl', 'fl', 'vl', 'pr', 'tr', 'kr', 'br', 'dr', 'gr', 'fr', 'vr'
]

const VOGAIS = ['i', 'e', 'ɛ', 'a', 'ɔ', 'o', 'u']

// Tipos de acentuação
const TIPOS_ACENTUACAO = ['oxítona', 'paroxítona', 'proparoxítona']

// Lógica de feedback por bloco
const FEEDBACK_POR_BLOCO = {
  1: 18, // Bloco 1: dar feedback para 18 pseudopalavras
  2: 14, // Bloco 2: dar feedback para 14 pseudopalavras
  3: 10, // Bloco 3: dar feedback para 10 pseudopalavras
  4: 6,  // Bloco 4: dar feedback para 6 pseudopalavras
  5: 2   // Bloco 5: dar feedback para 2 pseudopalavras
}

function App() {
  const [etapaAtual, setEtapaAtual] = useState('paciente') // 'paciente', 'selecao', 'resultados'
  const printRef = useRef(null)
  
  // Dados do paciente e sessão
  const [nomePaciente, setNomePaciente] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [dataSessao, setDataSessao] = useState(new Date().toISOString().split('T')[0])
  const [idadePaciente, setIdadePaciente] = useState('')
  
  // Dados da geração
  const [fonemasSelecionados, setFonemasSelecionados] = useState([])
  const [pseudopalavras, setPseudopalavras] = useState([])
  const [blocoTreino, setBlocoTreino] = useState([])
  const [blocosRandomizados, setBlocosRandomizados] = useState([])
  
  // Dados da aplicação (marcação de erros)
  const [marcacoes, setMarcacoes] = useState({})
  
  // Sistema de sessões salvas
  const [sessoesSalvas, setSessoesSalvas] = useState([])
  const [nomeSessao, setNomeSessao] = useState('')
  const [dialogSalvarAberto, setDialogSalvarAberto] = useState(false)
  const [dialogCarregarAberto, setDialogCarregarAberto] = useState(false)

  // Carregar sessões salvas do localStorage
  useEffect(() => {
    const sessoesSalvasStorage = localStorage.getItem('rest-sessoes-salvas')
    if (sessoesSalvasStorage) {
      setSessoesSalvas(JSON.parse(sessoesSalvasStorage))
    }
  }, [])

  // Função para calcular idade baseada na data da sessão
  const calcularIdade = (dataNasc, dataSess) => {
    if (!dataNasc || !dataSess) return ''
    
    const sessao = new Date(dataSess)
    const nascimento = new Date(dataNasc)
    
    let anos = sessao.getFullYear() - nascimento.getFullYear()
    let meses = sessao.getMonth() - nascimento.getMonth()
    
    if (meses < 0) {
      anos--
      meses += 12
    }
    
    if (sessao.getDate() < nascimento.getDate()) {
      meses--
      if (meses < 0) {
        anos--
        meses += 12
      }
    }
    
    return `${anos} anos e ${meses} meses`
  }

  // Efeito para recalcular idade quando as datas mudam
  useEffect(() => {
    setIdadePaciente(calcularIdade(dataNascimento, dataSessao))
  }, [dataNascimento, dataSessao])

  // Função para atualizar data de nascimento
  const handleDataNascimentoChange = (e) => {
    setDataNascimento(e.target.value)
  }

  // Função para atualizar data da sessão
  const handleDataSessaoChange = (e) => {
    setDataSessao(e.target.value)
  }

  // Função para selecionar/deselecionar fonemas (restante da lógica de geração omitida para brevidade)
  const toggleFonema = (fonema) => {
    if (fonemasSelecionados.includes(fonema)) {
      setFonemasSelecionados(fonemasSelecionados.filter(f => f !== fonema))
    } else if (fonemasSelecionados.length < 4) {
      setFonemasSelecionados([...fonemasSelecionados, fonema])
    }
  }

  // Funções de geração (mantidas do código anterior)
  const gerarSilaba = (consoantes, vogais) => {
    const consoante = consoantes[Math.floor(Math.random() * consoantes.length)]
    const vogal = vogais[Math.floor(Math.random() * vogais.length)]
    return consoante + vogal
  }

  const gerarPseudopalavra = (consoantes, vogais) => {
    const silaba1 = gerarSilaba(consoantes, vogais)
    const silaba2 = gerarSilaba(consoantes, vogais)
    const silaba3 = gerarSilaba(consoantes, vogais)
    const tipoAcentuacao = TIPOS_ACENTUACAO[Math.floor(Math.random() * TIPOS_ACENTUACAO.length)]
    
    return {
      palavra: silaba1 + silaba2 + silaba3,
      silabas: [silaba1, silaba2, silaba3],
      acentuacao: tipoAcentuacao
    }
  }

  const gerarPseudopalavras = () => {
    if (fonemasSelecionados.length !== 4) return []

    const palavrasGeradas = []
    const tentativasMaximas = 1000
    let tentativas = 0

    while (palavrasGeradas.length < 20 && tentativas < tentativasMaximas) {
      const novaPalavra = gerarPseudopalavra(fonemasSelecionados, VOGAIS)
      const palavraExiste = palavrasGeradas.some(p => p.palavra === novaPalavra.palavra)
      
      if (!palavraExiste) {
        palavrasGeradas.push(novaPalavra)
      }
      tentativas++
    }
    return palavrasGeradas
  }

  const embaralharArray = (array) => {
    const arrayEmbaralhado = [...array]
    for (let i = arrayEmbaralhado.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayEmbaralhado[i], arrayEmbaralhado[j]] = [arrayEmbaralhado[j], arrayEmbaralhado[i]]
    }
    return arrayEmbaralhado
  }

  const gerarFeedbackParaBloco = (numeroBloco, palavras) => {
    const quantidadeFeedback = FEEDBACK_POR_BLOCO[numeroBloco]
    const indices = Array.from({ length: 20 }, (_, i) => i)
    const indicesEmbaralhados = embaralharArray(indices)
    const indicesComFeedback = indicesEmbaralhados.slice(0, quantidadeFeedback)
    
    return palavras.map((palavra, index) => ({
      ...palavra,
      darFeedback: indicesComFeedback.includes(index)
    }))
  }

  const gerarBlocos = () => {
    const palavrasGeradas = gerarPseudopalavras()
    
    if (palavrasGeradas.length === 0) return

    setPseudopalavras(palavrasGeradas)

    const palavrasEmbaralhadas = embaralharArray(palavrasGeradas)
    const treino = palavrasEmbaralhadas.slice(0, 5)
    setBlocoTreino(treino)

    const blocos = []
    for (let i = 0; i < 5; i++) {
      const palavrasEmbaralhadas = embaralharArray(palavrasGeradas)
      const palavrasComFeedback = gerarFeedbackParaBloco(i + 1, palavrasEmbaralhadas)
      
      blocos.push({
        numero: i + 1,
        palavras: palavrasComFeedback,
        quantidadeFeedback: FEEDBACK_POR_BLOCO[i + 1]
      })
    }
    setBlocosRandomizados(blocos)

    const marcacoesIniciais = {}
    blocos.forEach(bloco => {
      bloco.palavras.forEach((palavra, index) => {
        const chave = `bloco${bloco.numero}_palavra${index}`
        marcacoesIniciais[chave] = {
          batida: false,
          fonema: false,
          suavidade: false
        }
      })
    })
    setMarcacoes(marcacoesIniciais)

    setEtapaAtual('resultados')
  }

  // Função para atualizar marcação de erro
  const atualizarMarcacao = (blocoNum, palavraIndex, tipo, valor) => {
    const chave = `bloco${blocoNum}_palavra${palavraIndex}`
    setMarcacoes(prev => ({
      ...prev,
      [chave]: {
        ...prev[chave],
        [tipo]: valor
      }
    }))
  }

  // Funções de Salvar/Carregar Sessão (mantidas do código anterior)
  const salvarSessao = () => {
    if (!nomeSessao.trim()) return

    const sessao = {
      id: Date.now(),
      nome: nomeSessao,
      dataCriacao: new Date().toISOString(),
      dadosPaciente: {
        nome: nomePaciente,
        dataNascimento: dataNascimento
      },
      fonemasSelecionados,
      pseudopalavras,
      blocoTreino,
      blocosRandomizados
    }

    const novasSessoes = [...sessoesSalvas, sessao]
    setSessoesSalvas(novasSessoes)
    localStorage.setItem('rest-sessoes-salvas', JSON.stringify(novasSessoes))
    
    setNomeSessao('')
    setDialogSalvarAberto(false)
  }

  const carregarSessao = (sessao) => {
    setNomePaciente(sessao.dadosPaciente.nome)
    setDataNascimento(sessao.dadosPaciente.dataNascimento)
    // A idade será recalculada pelo useEffect
    setFonemasSelecionados(sessao.fonemasSelecionados)
    setPseudopalavras(sessao.pseudopalavras)
    setBlocoTreino(sessao.blocoTreino)
    setBlocosRandomizados(sessao.blocosRandomizados)

    // Inicializar marcações vazias para a nova sessão
    const marcacoesIniciais = {}
    sessao.blocosRandomizados.forEach(bloco => {
      bloco.palavras.forEach((palavra, index) => {
        const chave = `bloco${bloco.numero}_palavra${index}`
        marcacoesIniciais[chave] = {
          batida: false,
          fonema: false,
          suavidade: false
        }
      })
    })
    setMarcacoes(marcacoesIniciais)

    setDialogCarregarAberto(false)
    setEtapaAtual('resultados')
  }

  const deletarSessao = (sessaoId) => {
    const novasSessoes = sessoesSalvas.filter(s => s.id !== sessaoId)
    setSessoesSalvas(novasSessoes)
    localStorage.setItem('rest-sessoes-salvas', JSON.stringify(novasSessoes))
  }

  // NOVO: Função para gerar relatório PDF (usando impressão estilizada)
  const gerarRelatorioPDF = () => {
    // Apenas chamamos a função de impressão. O CSS fará o resto.
    window.print()
  }

  // Função para reiniciar
  const reiniciar = () => {
    setFonemasSelecionados([])
    setPseudopalavras([])
    setBlocoTreino([])
    setBlocosRandomizados([])
    setMarcacoes({})
    setEtapaAtual('paciente')
  }

  // Função para formatar palavra com acentuação visual
  const formatarPalavraComAcentuacao = (pseudopalavra) => {
    const { silabas, acentuacao } = pseudopalavra
    let silabaTonica = 0
    
    switch (acentuacao) {
      case 'oxítona':
        silabaTonica = 2
        break
      case 'paroxítona':
        silabaTonica = 1
        break
      case 'proparoxítona':
        silabaTonica = 0
        break
    }

    return (
      <span className="font-mono text-lg">
        {silabas.map((silaba, index) => (
          <span
            key={index}
            className={index === silabaTonica ? 'font-bold underline' : ''}
          >
            {silaba}
          </span>
        ))}
      </span>
    )
  }

  // Componente Checkbox de Erro Personalizado
  const ErrorCheckbox = ({ id, checked, onCheckedChange, label }) => (
    <div className="flex items-center space-x-2">
      <div 
        className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${
          checked ? 'border-destructive bg-destructive' : 'border-gray-400'
        }`}
        onClick={() => onCheckedChange(!checked)}
      >
        {checked && <X className="h-3 w-3 text-white" />}
      </div>
      <Label htmlFor={id} className="text-sm cursor-pointer" onClick={() => onCheckedChange(!checked)}>
        {label}
      </Label>
    </div>
  )

  // ... (Restante do código da tela 'paciente' e 'selecao' omitido por ser igual)

  // Tela de Dados do Paciente
  if (etapaAtual === 'paciente') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 p-4 print:hidden">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              REST - Programa de Fonoaudiologia
            </h1>
            <p className="text-lg text-gray-600">
              Gerador de Pseudopalavras para Treino Fonológico
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados do Paciente e Sessão
              </CardTitle>
              <CardDescription>
                Insira os dados do paciente e da sessão para gerar a lista personalizada de pseudopalavras.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Paciente</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Digite o nome completo do paciente"
                  value={nomePaciente}
                  onChange={(e) => setNomePaciente(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={dataNascimento}
                    onChange={handleDataNascimentoChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataSessao">Data da Sessão</Label>
                  <Input
                    id="dataSessao"
                    type="date"
                    value={dataSessao}
                    onChange={handleDataSessaoChange}
                  />
                </div>
              </div>

              {idadePaciente && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">Idade na data da sessão:</span>
                    <span className="text-primary font-semibold">{idadePaciente}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setEtapaAtual('selecao')}
                  disabled={!nomePaciente || !dataNascimento || !dataSessao}
                  size="lg"
                  className="flex-1"
                >
                  Continuar para Seleção de Fonemas
                </Button>

                <Dialog open={dialogCarregarAberto} onOpenChange={setDialogCarregarAberto}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Carregar Sessão
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Carregar Sessão Salva</DialogTitle>
                      <DialogDescription>
                        Selecione uma sessão salva para reutilizar as pseudopalavras.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {sessoesSalvas.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Nenhuma sessão salva encontrada.</p>
                      ) : (
                        sessoesSalvas.map((sessao) => (
                          <div key={sessao.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{sessao.nome}</div>
                              <div className="text-sm text-gray-500">
                                {sessao.dadosPaciente.nome} - {new Date(sessao.dataCriacao).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => carregarSessao(sessao)}
                              >
                                Carregar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deletarSessao(sessao.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Tela de Seleção de Fonemas
  if (etapaAtual === 'selecao') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 p-4 print:hidden">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Seleção de Fonemas
            </h1>
            <div className="text-lg text-gray-600 mb-4">
              <strong>Paciente:</strong> {nomePaciente} ({idadePaciente})
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Seleção de Fonemas
              </CardTitle>
              <CardDescription>
                Selecione exatamente 4 consoantes ou encontros consonantais para gerar as pseudopalavras.
                Fonemas selecionados: {fonemasSelecionados.length}/4
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Consoantes Simples */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Consoantes Simples</h3>
                <div className="flex flex-wrap gap-2">
                  {CONSOANTES.map((consoante) => (
                    <Button
                      key={consoante}
                      variant={fonemasSelecionados.includes(consoante) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFonema(consoante)}
                      disabled={!fonemasSelecionados.includes(consoante) && fonemasSelecionados.length >= 4}
                      className="font-mono text-base min-w-[3rem]"
                    >
                      {consoante}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Encontros Consonantais */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Encontros Consonantais</h3>
                <div className="flex flex-wrap gap-2">
                  {ENCONTROS_CONSONANTAIS.map((encontro) => (
                    <Button
                      key={encontro}
                      variant={fonemasSelecionados.includes(encontro) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFonema(encontro)}
                      disabled={!fonemasSelecionados.includes(encontro) && fonemasSelecionados.length >= 4}
                      className="font-mono text-base min-w-[3rem]"
                    >
                      {encontro}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Fonemas Selecionados */}
              {fonemasSelecionados.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Fonemas Selecionados</h3>
                  <div className="flex flex-wrap gap-2">
                    {fonemasSelecionados.map((fonema) => (
                      <Badge key={fonema} variant="default" className="font-mono text-base px-3 py-1">
                        {fonema}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setEtapaAtual('paciente')}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={gerarBlocos}
                  disabled={fonemasSelecionados.length !== 4}
                  className="flex-2"
                >
                  Gerar Pseudopalavras e Blocos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Informações sobre as Vogais */}
          <Card>
            <CardHeader>
              <CardTitle>Vogais Utilizadas</CardTitle>
              <CardDescription>
                As seguintes vogais serão utilizadas na geração das pseudopalavras:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {VOGAIS.map((vogal) => (
                  <Badge key={vogal} variant="secondary" className="font-mono text-base px-3 py-1">
                    {vogal}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Tela de Resultados com Marcação de Erros
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 print:hidden">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Aplicação da Sessão
          </h1>
          <div className="text-lg text-gray-600 mb-4">
            <strong>Paciente:</strong> {nomePaciente} ({idadePaciente}) | <strong>Data:</strong> {new Date(dataSessao).toLocaleDateString('pt-BR')}
          </div>
          <div className="flex justify-center gap-2 mb-4">
            {fonemasSelecionados.map((fonema) => (
              <Badge key={fonema} variant="default" className="font-mono text-base px-3 py-1">
                {fonema}
              </Badge>
            ))}
          </div>
          <div className="flex justify-center gap-3 mb-4">
            <Button onClick={reiniciar} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Nova Sessão
            </Button>
            
            <Dialog open={dialogSalvarAberto} onOpenChange={setDialogSalvarAberto}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Sessão
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Salvar Sessão</DialogTitle>
                  <DialogDescription>
                    Salve esta configuração de pseudopalavras para reutilizar em futuras sessões.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeSessao">Nome da Sessão</Label>
                    <Input
                      id="nomeSessao"
                      placeholder="Ex: Sessão 1 - João"
                      value={nomeSessao}
                      onChange={(e) => setNomeSessao(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setDialogSalvarAberto(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={salvarSessao}
                      disabled={!nomeSessao.trim()}
                      className="flex-1"
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={gerarRelatorioPDF} variant="default">
              <Printer className="h-4 w-4 mr-2" />
              Gerar Relatório PDF
            </Button>
          </div>
        </div>

        {/* Conteúdo do Relatório/Aplicação */}
        <div ref={printRef} className="print:p-6 print:bg-white print:shadow-none">
          {/* Cabeçalho do Relatório (Visível apenas na impressão) */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              RELATÓRIO DE SESSÃO - PROGRAMA REST
            </h1>
            <div className="text-base text-gray-700">
              <strong>Paciente:</strong> {nomePaciente} | <strong>Idade:</strong> {idadePaciente} | <strong>Data:</strong> {new Date(dataSessao).toLocaleDateString('pt-BR')}
            </div>
            <div className="text-sm text-gray-500">
              Fonemas Trabalhados: {fonemasSelecionados.join(', ')}
            </div>
            <Separator className="mt-2" />
          </div>

          <div className="grid gap-6">
            {/* Bloco de Treino */}
            <Card className="print:shadow-none print:border-gray-300">
              <CardHeader>
                <CardTitle className="text-xl">Bloco de Treino (5 palavras)</CardTitle>
                <CardDescription>
                  Pseudopalavras selecionadas aleatoriamente para treino inicial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {blocoTreino.map((pseudopalavra, index) => (
                    <div key={index} className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20 print:bg-gray-100">
                      <div className="text-lg font-mono">
                        {formatarPalavraComAcentuacao(pseudopalavra)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Blocos Randomizados com Marcação de Erros */}
            <div className="grid gap-4">
              {blocosRandomizados.map((bloco) => (
                <Card key={bloco.numero} className="print:shadow-none print:border-gray-300">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Bloco {bloco.numero} (20 palavras)
                    </CardTitle>
                    <CardDescription className="print:hidden">
                      Dar feedback para <strong>{bloco.quantidadeFeedback}</strong> pseudopalavras (destacadas em laranja)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bloco.palavras.map((pseudopalavra, index) => {
                        const chave = `bloco${bloco.numero}_palavra${index}`
                        const marcacao = marcacoes[chave] || { batida: false, fonema: false, suavidade: false }
                        
                        return (
                          <div 
                            key={index} 
                            className={`p-4 rounded-lg border ${
                              pseudopalavra.darFeedback 
                                ? 'bg-accent/20 border-accent/40 print:bg-yellow-50 print:border-yellow-200' 
                                : 'bg-gray-50 border-gray-200 print:bg-white'
                            }`}
                          >
                            <div className="text-center mb-3">
                              <div className="text-lg font-mono mb-1">
                                {formatarPalavraComAcentuacao(pseudopalavra)}
                              </div>
                              {pseudopalavra.darFeedback && (
                                <div className="text-xs text-accent font-semibold print:text-gray-600">
                                  FEEDBACK
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <ErrorCheckbox
                                id={`${chave}_batida`}
                                checked={marcacao.batida}
                                onCheckedChange={(checked) => 
                                  atualizarMarcacao(bloco.numero, index, 'batida', checked)
                                }
                                label="BATIDA"
                              />
                              
                              <ErrorCheckbox
                                id={`${chave}_fonema`}
                                checked={marcacao.fonema}
                                onCheckedChange={(checked) => 
                                  atualizarMarcacao(bloco.numero, index, 'fonema', checked)
                                }
                                label="FONEMA"
                              />
                              
                              <ErrorCheckbox
                                id={`${chave}_suavidade`}
                                checked={marcacao.suavidade}
                                onCheckedChange={(checked) => 
                                  atualizarMarcacao(bloco.numero, index, 'suavidade', checked)
                                }
                                label="SUAVIDADE"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
