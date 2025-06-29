import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface Props {
  children: React.ReactNode;
}

const client = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider(props: Props) {
  return (
    <QueryClientProvider client={client}>{props.children}</QueryClientProvider>
  );
}
