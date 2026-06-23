interface HttpConfig extends RequestInit {
  params?: Record<string, string>;
}

export class HttpError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

export async function http<T>(url: string, config: HttpConfig = {}): Promise<T> {
  const { params, headers, ...restConfig } = config;

  // Build query string if parameters are provided
  let targetUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, value);
    }
    const queryString = searchParams.toString();
    if (queryString) {
      targetUrl = `${url}?${queryString}`;
    }
  }

  const defaultHeaders: Record<string, string> = {};

  // Automatically set application/json content type unless it's FormData
  if (!(restConfig.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const finalHeaders = {
    ...defaultHeaders,
    ...headers,
  };

  const response = await fetch(targetUrl, {
    ...restConfig,
    headers: finalHeaders,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      try {
        errorData = await response.text();
      } catch {
        errorData = null;
      }
    }

    let errorMessage = `HTTP request failed with status ${response.status}`;
    if (errorData && typeof errorData === "object" && "message" in errorData) {
      errorMessage = String((errorData as { message: unknown }).message);
    } else if (errorData && typeof errorData === "object" && "error" in errorData) {
      errorMessage = String((errorData as { error: unknown }).error);
    } else if (typeof errorData === "string") {
      errorMessage = errorData;
    }

    throw new HttpError(errorMessage, response.status, errorData);
  }

  // Parse JSON response
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = (await response.json()) as T;
    return data;
  }

  // Fallback for non-JSON responses
  const textData = await response.text();
  return textData as unknown as T;
}

http.get = <T>(url: string, config?: HttpConfig) =>
  http<T>(url, { ...config, method: "GET" });

http.post = <T>(url: string, body?: unknown, config?: HttpConfig) =>
  http<T>(url, {
    ...config,
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

http.put = <T>(url: string, body?: unknown, config?: HttpConfig) =>
  http<T>(url, {
    ...config,
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

http.delete = <T>(url: string, config?: HttpConfig) =>
  http<T>(url, { ...config, method: "DELETE" });
