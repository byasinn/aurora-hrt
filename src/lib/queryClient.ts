import { MutationCache, QueryClient } from '@tanstack/react-query'

// Brilho é calculado no servidor a partir de quase tudo (dia, rotina, dose, treino, curtida,
// comentário…). Em vez de lembrar de invalidar em cada hook, qualquer mutação bem-sucedida marca os
// pontos como velhos — só refaz a busca de quem está na tela.
export const queryClient: QueryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points'] })
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})
