import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getCompanyHeaders(): Record<string, string> {
  const stored = localStorage.getItem('empresaAtiva');
  if (stored) {
    try {
      const empresa = JSON.parse(stored);
      if (empresa && empresa.id) {
        return { 'x-company-id': String(empresa.id) };
      }
    } catch (e) {
      console.error('Error parsing empresaAtiva', e);
    }
  }
  return {};
}

function appendCompanyParam(url: string) {
  const stored = localStorage.getItem('empresaAtiva');
  if (stored) {
    try {
      const empresa = JSON.parse(stored);
      if (empresa && empresa.id) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}companyId=${empresa.id}`;
      }
    } catch (e) {
      console.error('Error parsing empresaAtiva for URL param', e);
    }
  }
  return url;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getCompanyHeaders(),
  };

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const finalUrl = appendCompanyParam(url);

  const res = await fetch(finalUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      // Handle complex queryKeys properly
      let url: string;
      if (typeof queryKey[0] === 'string') {
        url = queryKey[0];
        // Add query parameters if they exist
        if (queryKey.length > 1 && typeof queryKey[1] === 'object') {
          const params = new URLSearchParams();
          const queryParams = queryKey[1] as Record<string, any>;
          Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, String(value));
            }
          });
          const paramString = params.toString();
          if (paramString) {
            url += (url.includes('?') ? '&' : '?') + paramString;
          }
        }
      } else {
        url = queryKey.join("/") as string;
      }
      
      const finalUrl = appendCompanyParam(url);
      const res = await fetch(finalUrl, {
        headers: { ...getCompanyHeaders() },
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
