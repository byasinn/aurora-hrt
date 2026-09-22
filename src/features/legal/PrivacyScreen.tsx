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

export default function PrivacyScreen() {
  return (
    <LegalPage title="Política de Privacidade" updatedAt="6 de agosto de 2026">
      <P>
        Esta Política de Privacidade descreve como <strong>Luna Black</strong>, controlador dos dados tratados no aplicativo Aurora ("Aurora", "nós"), coleta, usa,
        compartilha e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº
        13.709/2018 — LGPD).
      </P>

      <H2>1. Identificação do controlador</H2>
      <P>
        Por motivo de segurança pessoal da equipe (o Aurora é um app voltado ao público trans, e preservamos essa
        proteção com prioridade), optamos por não publicar aqui os dados de registro empresarial completos. Isso não
        significa ausência de responsabilidade: o Aurora é operado sob registro formal, e essas informações estão
        disponíveis mediante solicitação legítima de autoridades competentes (incluindo a ANPD) ou ordem judicial,
        pelos canais normais (registro de domínio, provedor de hospedagem e demais prestadores listados abaixo).
        Pra qualquer solicitação como titular de dados, o canal direto é o email de contato na seção 12.
      </P>

      <H2>2. Quais dados coletamos</H2>
      <P>Coletamos as seguintes categorias de dados, sempre a partir do que você mesmo insere no app:</P>
      <Ul>
        <li>
          <strong>Dados de cadastro:</strong> email e senha (armazenada apenas como hash criptográfico — nunca em
          texto legível) ou identificador de login via Google.
        </li>
        <li>
          <strong>Dados de perfil:</strong> nome de exibição, pronomes, foto, biografia, data de início da
          transição.
        </li>
        <li>
          <strong>Dados de saúde (dado pessoal sensível, art. 5º, II da LGPD):</strong> medicamentos e doses,
          registros de humor e libido, medidas corporais, resultados de exames laboratoriais, rotinas de
          autocuidado.
        </li>
        <li>
          <strong>Conteúdo social:</strong> posts, comentários, curtidas, mensagens diretas, participação em
          comunidades — visíveis conforme suas próprias configurações de privacidade dentro do app.
        </li>
        <li>
          <strong>Dados técnicos:</strong> endereço IP (usado só para segurança, como limitar tentativas de login e
          cadastro), dados de assinatura push (se você ativar notificações), cookies de sessão.
        </li>
      </Ul>

      <H2>3. Base legal para o tratamento</H2>
      <P>
        Tratamos seus dados de saúde com base no seu <strong>consentimento explícito</strong> (art. 11, I da LGPD),
        obtido no momento do cadastro. Os demais dados são tratados com base na execução do contrato de uso do app
        (art. 7º, V) e, quando aplicável, em nosso legítimo interesse em manter o serviço seguro (art. 7º, IX). Você
        pode revogar seu consentimento a qualquer momento excluindo sua conta.
      </P>

      <H2>4. Para que usamos seus dados</H2>
      <Ul>
        <li>Fornecer as funcionalidades do app (registro de saúde, lembretes, feed social);</li>
        <li>Autenticar seu login e proteger sua conta contra acesso indevido;</li>
        <li>Enviar emails operacionais (confirmação de cadastro, recuperação de senha) e notificações push que você ativar;</li>
        <li>Prevenir abuso, fraude e uso indevido da plataforma (ex.: limite de tentativas de login e cadastro);</li>
        <li>Cumprir obrigações legais, quando exigido.</li>
      </Ul>
      <P>Não usamos seus dados de saúde para publicidade, e não vendemos dados pessoais a terceiros.</P>

      <H2>5. Com quem compartilhamos</H2>
      <P>
        Não compartilhamos seus dados de saúde com terceiros para fins comerciais. Usamos os seguintes prestadores
        de infraestrutura, como operadores de dados, apenas para fazer o app funcionar:
      </P>
      <Ul>
        <li>
          <strong>Neon</strong> (banco de dados) — armazena os dados do app, hospedado nos Estados Unidos.
        </li>
        <li>
          <strong>Cloudflare</strong> (hospedagem, CDN e proteção contra ataques) — infraestrutura de rede que
          processa as requisições do app.
        </li>
        <li>
          <strong>Resend</strong> (envio de email) — usado para emails de confirmação de cadastro e recuperação de
          senha.
        </li>
        <li>
          <strong>Google</strong> — apenas se você optar por entrar com sua conta Google, para autenticação.
        </li>
      </Ul>
      <P>
        Como parte dessa infraestrutura está hospedada fora do Brasil, pode haver transferência internacional de
        dados (art. 33 da LGPD). Esses fornecedores possuem seus próprios compromissos contratuais e técnicos de
        segurança da informação.
      </P>
      <P>Também compartilhamos, dentro do app, o conteúdo que você mesmo escolhe tornar visível a outros usuários (perfil público, posts, comunidades).</P>

      <H2>6. Por quanto tempo guardamos seus dados</H2>
      <P>
        Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir sua conta pela tela de Configurações, seus
        dados pessoais e registros de saúde são apagados permanentemente do nosso banco de dados.
      </P>

      <H2>7. Seus direitos como titular dos dados</H2>
      <P>Conforme o art. 18 da LGPD, você tem direito a:</P>
      <Ul>
        <li>Confirmar a existência de tratamento dos seus dados;</li>
        <li>Acessar seus dados — disponível a qualquer momento pela exportação de dados nas Configurações;</li>
        <li>Corrigir dados incompletos, inexatos ou desatualizados — direto nas telas do app;</li>
        <li>Solicitar a eliminação dos dados tratados com base no seu consentimento — excluindo sua conta;</li>
        <li>Revogar o consentimento a qualquer momento;</li>
        <li>Solicitar a portabilidade dos seus dados a outro fornecedor.</li>
      </Ul>
      <P>
        Você pode exercer a maioria desses direitos diretamente no app (Configurações → Exportar dados / Excluir
        conta). Para outras solicitações, entre em contato pelo email abaixo.
      </P>

      <H2>8. Segurança</H2>
      <P>
        Senhas são armazenadas com hash criptográfico (scrypt), nunca em texto legível. Toda comunicação com o app
        é feita por HTTPS. Sessões de login usam cookies seguros e expiram automaticamente. Login possui proteção
        contra tentativas repetidas de senha incorreta.
      </P>

      <H2>9. Notificação de incidentes</H2>
      <P>
        Em caso de incidente de segurança que possa gerar risco ou dano relevante a você, avisaremos pelo email
        cadastrado e faremos a comunicação à ANPD conforme exigido pela LGPD, informando o que aconteceu, quais
        dados foram afetados e as medidas tomadas.
      </P>

      <H2>10. Cookies</H2>
      <P>
        Usamos apenas um cookie essencial de sessão, necessário para manter você conectado. Não usamos cookies de
        rastreamento publicitário nem compartilhamos dados de navegação com redes de anúncio.
      </P>

      <H2>11. Menores de idade</H2>
      <P>O Aurora não é destinado a menores de 18 anos, e não coletamos intencionalmente dados de menores.</P>

      <H2>12. Alterações nesta Política</H2>
      <P>
        Podemos atualizar esta Política periodicamente. Alterações relevantes serão comunicadas dentro do app antes
        de entrarem em vigor.
      </P>

      <H2>13. Encarregado e contato</H2>
      <P>
        Pra exercer seus direitos de titular, tirar dúvidas sobre o tratamento dos seus dados, ou fazer qualquer
        solicitação relacionada a esta Política (inclusive pedidos formais de identificação do controlador por
        autoridade competente), o canal é o email <strong>privacidade@aurorahrt.com.br</strong> — esse é também o
        contato do encarregado pelo tratamento de dados (DPO) do Aurora, conforme art. 41 da LGPD.
      </P>
    </LegalPage>
  )
}
