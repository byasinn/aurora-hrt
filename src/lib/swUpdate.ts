/**
 * Faz uma atualização já publicada chegar em quem tem o app aberto (instalado na tela inicial,
 * às vezes fica dias sem fechar) o mais rápido possível, sem exigir nenhuma ação da pessoa:
 *
 * 1. Toda vez que o app volta a ficar visível (reabriu pela tela inicial, trocou de app e voltou),
 *    força uma checagem de atualização — sem isso, o navegador só confere de vez em quando sozinho.
 * 2. Quando uma versão nova assume o controle (o sw.ts já faz skipWaiting()+clients.claim() sozinho,
 *    sem esperar confirmação), recarrega a página uma vez pra trocar o JS/CSS em memória pelo novo —
 *    sem isso, a aba/app já aberto continua rodando o código antigo até fechar e abrir de novo.
 */
export function watchForServiceWorkerUpdates(): void {
  if (!('serviceWorker' in navigator)) return

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    navigator.serviceWorker.getRegistration().then((reg) => reg?.update())
  })

  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })
}
