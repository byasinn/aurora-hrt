import LegalPage from './LegalPage'

function H2({ children }: { children: string }) {
  return <h2 className="pt-2 text-base font-semibold text-[var(--text)]">{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[var(--text-muted)]">{children}</p>
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5 text-[var(--text-muted)]">{children}</ul>
}

export default function TermsScreen() {
  return (
    <LegalPage title="Termos de Uso" updatedAt="6 de agosto de 2026">
      <P>
        Estes Termos de Uso regulam o acesso e uso do aplicativo Aurora ("Aurora", "app", "nós"), operado por{' '}
        <strong>Luna Black</strong> ("Controlador").
        Ao criar uma conta ou usar o Aurora, você ("usuário", "você") concorda com estes Termos e com nossa{' '}
        <a href="/privacidade" className="text-[var(--accent)] underline">
          Política de Privacidade
        </a>
        . Se você não concorda, não use o app.
      </P>

      <H2>1. Identificação do controlador</H2>
      <P>
        Por motivo de segurança pessoal da equipe (o Aurora é um app voltado ao público trans, e preservamos essa
        proteção com prioridade), optamos por não publicar aqui os dados de registro empresarial completos. O Aurora
        é operado sob registro formal, e essas informações estão disponíveis mediante solicitação legítima de
        autoridades competentes ou ordem judicial. Pra qualquer contato, veja a seção 12.
      </P>

      <H2>2. O que é a Aurora</H2>
      <P>
        A Aurora é um aplicativo pessoal de acompanhamento de terapia hormonal e transição de gênero, que permite
        registrar medicamentos, humor, medidas corporais, exames laboratoriais e rotinas, além de oferecer recursos
        sociais opcionais (perfil, feed, comunidades, mensagens diretas).
      </P>

      <H2>3. Não é aconselhamento médico</H2>
      <P>
        <strong>
          A Aurora é uma ferramenta de organização pessoal, não um serviço médico, diagnóstico ou de aconselhamento
          profissional de saúde.
        </strong>{' '}
        As informações registradas e exibidas no app não substituem consulta, diagnóstico ou tratamento com
        médicos, endocrinologistas ou outros profissionais de saúde habilitados. Decisões sobre dose, troca ou
        suspensão de medicamentos devem sempre ser tomadas com acompanhamento profissional. Em caso de emergência
        médica, procure atendimento imediato.
      </P>

      <H2>4. Elegibilidade e cadastro</H2>
      <P>
        O uso da Aurora é destinado a pessoas com 18 anos ou mais. Ao se cadastrar, você declara ter no mínimo essa
        idade e se compromete a fornecer informações verdadeiras. Você é responsável por manter a confidencialidade
        da sua senha e por todas as atividades realizadas na sua conta. Cada pessoa deve manter apenas uma conta.
      </P>

      <H2>5. Conteúdo gerado por você</H2>
      <P>
        Posts, comentários, mensagens e demais conteúdos que você publica no app são de sua responsabilidade. Ao
        publicar, você concede à Aurora uma licença não exclusiva, limitada ao funcionamento do app, para armazenar
        e exibir esse conteúdo às pessoas com quem você compartilha (seguidores, membros da mesma comunidade). Você
        continua sendo o titular do conteúdo que cria.
      </P>
      <P>É proibido publicar conteúdo que:</P>
      <Ul>
        <li>Seja ilegal, difamatório, ameaçador, ou incite ódio, violência ou discriminação;</li>
        <li>Assedie, intimide ou exponha dados pessoais de terceiros sem consentimento;</li>
        <li>Se passe por outra pessoa ou induza outros usuários a erro;</li>
        <li>Contenha spam, propaganda não solicitada ou tentativas de fraude;</li>
        <li>Viole direitos autorais ou de propriedade intelectual de terceiros.</li>
      </Ul>
      <P>
        Podemos remover conteúdo que viole estes Termos e suspender ou encerrar contas responsáveis por violações,
        a nosso critério e sem aviso prévio em casos graves.
      </P>

      <H2>6. Propriedade intelectual da Aurora</H2>
      <P>
        A marca Aurora, o design, o código-fonte e os demais elementos do app são de titularidade do Controlador ou
        de seus licenciantes, protegidos por leis de propriedade intelectual. Você não pode copiar, modificar,
        fazer engenharia reversa ou redistribuir o app sem autorização.
      </P>

      <H2>7. Encerramento de conta</H2>
      <P>
        Você pode excluir sua conta a qualquer momento pela tela de Configurações do app, o que remove
        permanentemente seus dados pessoais e registros, conforme detalhado na Política de Privacidade. Podemos
        suspender ou encerrar contas que violem estes Termos.
      </P>

      <H2>8. Isenção de garantias</H2>
      <P>
        A Aurora é fornecida "como está" e "conforme disponível". Não garantimos que o app funcionará de forma
        ininterrupta, livre de erros, ou que atenderá a expectativas específicas. Fazemos esforços razoáveis para
        manter o serviço disponível e seguro, mas eventuais indisponibilidades podem ocorrer.
      </P>

      <H2>9. Limitação de responsabilidade</H2>
      <P>
        Na máxima extensão permitida pela lei brasileira, o Controlador não se responsabiliza por danos indiretos,
        incidentais ou consequenciais decorrentes do uso ou da impossibilidade de uso do app, incluindo decisões de
        saúde tomadas com base em informações registradas por você mesmo no aplicativo.
      </P>

      <H2>10. Alterações nestes Termos</H2>
      <P>
        Podemos atualizar estes Termos periodicamente para refletir mudanças no app ou na legislação. Alterações
        relevantes serão comunicadas dentro do app. O uso continuado após a atualização implica concordância com os
        novos Termos.
      </P>

      <H2>11. Lei aplicável e foro</H2>
      <P>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do
        usuário para dirimir eventuais controvérsias, conforme o Código de Defesa do Consumidor, quando aplicável.
      </P>

      <H2>12. Contato</H2>
      <P>Dúvidas sobre estes Termos, ou solicitações formais de identificação do controlador, podem ser enviadas para contato@aurorahrt.com.br.</P>
    </LegalPage>
  )
}
