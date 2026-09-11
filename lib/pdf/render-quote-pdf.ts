import { Buffer } from "node:buffer";
import { lookup } from "node:dns/promises";
import {
  request as httpRequest,
  type IncomingMessage,
} from "node:http";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP } from "node:net";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import sharp from "sharp";
import {
  QuotePdfDocument,
  type QuotePdfPreferences,
  type QuotePdfQuote,
} from "@/lib/pdf/quote-pdf";

const LOGO_FETCH_TIMEOUT_MS = 5_000;
const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const MAX_LOGO_PIXELS = 16_000_000;
const MAX_LOGO_REDIRECTS = 3;

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);
const BLOCKED_HOSTNAME_SUFFIXES = [
  ".localhost",
  ".local",
  ".localdomain",
  ".internal",
  ".lan",
  ".home.arpa",
];

const BLOCKED_IPV4_ADDRESSES = new BlockList();
const BLOCKED_IPV6_ADDRESSES = new BlockList();

[
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
].forEach(([network, prefix]) => {
  BLOCKED_IPV4_ADDRESSES.addSubnet(
    network as string,
    prefix as number,
    "ipv4"
  );
});

[
  ["::", 96],
  ["::ffff:0:0", 96],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3ffe::", 16],
  ["3fff::", 20],
  ["5f00::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["fec0::", 10],
  ["ff00::", 8],
].forEach(([network, prefix]) => {
  BLOCKED_IPV6_ADDRESSES.addSubnet(
    network as string,
    prefix as number,
    "ipv6"
  );
});

type LogoFormat = "jpeg" | "png" | "svg" | "webp";
type ResolvedAddress = { address: string; family: 4 | 6 };

const LOGO_FORMAT_BY_CONTENT_TYPE: Record<string, LogoFormat> = {
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

const LOGO_FORMAT_BY_EXTENSION: Record<string, LogoFormat> = {
  ".jpg": "jpeg",
  ".jpeg": "jpeg",
  ".png": "png",
  ".svg": "svg",
  ".webp": "webp",
};

function cleanText(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

function inferLogoFormat(url: URL) {
  const extension = url.pathname.match(/\.[a-z0-9]+$/i)?.[0].toLowerCase();
  return extension ? LOGO_FORMAT_BY_EXTENSION[extension] ?? null : null;
}

function parseHttpLogoUrl(value: string) {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Logo URL must use HTTP or HTTPS");
  }

  if (url.username || url.password) {
    throw new Error("Logo URL must not contain credentials");
  }

  return url;
}

function normalizeHostname(hostname: string) {
  const unwrapped =
    hostname.startsWith("[") && hostname.endsWith("]")
      ? hostname.slice(1, -1)
      : hostname;

  return unwrapped.toLowerCase().replace(/\.+$/, "");
}

function isBlockedHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  );
}

function isBlockedIpAddress(address: string, family: 4 | 6) {
  return family === 4
    ? BLOCKED_IPV4_ADDRESSES.check(address, "ipv4")
    : BLOCKED_IPV6_ADDRESSES.check(address, "ipv6");
}

function createAbortError() {
  const error = new Error("Operation aborted");
  error.name = "AbortError";
  return error;
}

function withAbort<T>(promise: Promise<T>, signal: AbortSignal) {
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(createAbortError());

    if (signal.aborted) {
      reject(createAbortError());
      return;
    }

    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      }
    );
  });
}

async function resolveApprovedAddresses(url: URL, signal: AbortSignal) {
  const hostname = normalizeHostname(url.hostname);

  if (!hostname || isBlockedHostname(hostname)) {
    throw new Error("Logo hostname is not allowed");
  }

  const literalFamily = isIP(hostname);
  let addresses: ResolvedAddress[];

  if (literalFamily === 4 || literalFamily === 6) {
    addresses = [{ address: hostname, family: literalFamily }];
  } else {
    try {
      const resolved = await withAbort(
        lookup(hostname, { all: true, verbatim: true }),
        signal
      );
      addresses = resolved.map(({ address, family }) => {
        if (family !== 4 && family !== 6) {
          throw new Error("Logo hostname resolved to an unsupported IP family");
        }

        return {
          address: normalizeHostname(address),
          family,
        };
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }

      throw new Error("Logo hostname could not be resolved");
    }
  }

  if (addresses.length === 0) {
    throw new Error("Logo hostname did not resolve to an IP address");
  }

  for (const { address, family } of addresses) {
    if (isIP(address) !== family || isBlockedIpAddress(address, family)) {
      throw new Error("Logo hostname resolves to a blocked IP address");
    }
  }

  return addresses;
}

function requestLogoUrl(
  url: URL,
  address: ResolvedAddress,
  signal: AbortSignal
) {
  const hostname = normalizeHostname(url.hostname);
  const requestOptions = {
    family: address.family,
    headers: {
      Accept: "image/svg+xml,image/png,image/jpeg,image/webp",
      "Accept-Encoding": "identity",
      Host: url.host,
      "User-Agent": "RelanceClient-PDF/1.0",
    },
    hostname: address.address,
    method: "GET",
    path: `${url.pathname}${url.search}`,
    port: url.port || undefined,
    signal,
  };

  return new Promise<IncomingMessage>((resolve, reject) => {
    const request =
      url.protocol === "https:"
        ? httpsRequest(
            {
              ...requestOptions,
              servername: isIP(hostname) ? undefined : hostname,
            },
            resolve
          )
        : httpRequest(requestOptions, resolve);

    request.once("error", reject);
    request.end();
  });
}

async function requestLogoResponse(sourceUrl: URL, signal: AbortSignal) {
  let currentUrl = sourceUrl;

  for (let redirectCount = 0; ; redirectCount += 1) {
    const addresses = await resolveApprovedAddresses(currentUrl, signal);
    const response = await requestLogoUrl(currentUrl, addresses[0], signal);
    const statusCode = response.statusCode ?? 0;

    if (!REDIRECT_STATUS_CODES.has(statusCode)) {
      return { finalUrl: currentUrl, response };
    }

    const location = response.headers.location;
    response.destroy();

    if (!location) {
      throw new Error("Logo redirect is missing a location");
    }

    if (redirectCount >= MAX_LOGO_REDIRECTS) {
      throw new Error("Logo request has too many redirects");
    }

    currentUrl = parseHttpLogoUrl(new URL(location, currentUrl).toString());
  }
}

function getHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveLogoFormat(
  response: IncomingMessage,
  finalUrl: URL,
  sourceUrl: URL
) {
  const contentType = getHeaderValue(response.headers["content-type"])
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();

  if (contentType) {
    if (!contentType.startsWith("image/")) {
      throw new Error("Logo response is not an image");
    }

    const format = LOGO_FORMAT_BY_CONTENT_TYPE[contentType];
    if (!format) {
      throw new Error("Logo image format is unsupported");
    }

    return format;
  }

  const format = inferLogoFormat(finalUrl) ?? inferLogoFormat(sourceUrl);

  if (!format) {
    throw new Error("Logo image format is unsupported");
  }

  return format;
}

async function readLogoResponse(response: IncomingMessage) {
  const contentLength = getHeaderValue(response.headers["content-length"]);
  const declaredLength = contentLength ? Number(contentLength) : Number.NaN;

  if (Number.isFinite(declaredLength) && declaredLength > MAX_LOGO_BYTES) {
    throw new Error("Logo file exceeds the maximum allowed size");
  }

  const chunks: Buffer[] = [];
  let totalLength = 0;

  for await (const chunk of response) {
    const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    totalLength += value.byteLength;
    if (totalLength > MAX_LOGO_BYTES) {
      response.destroy();
      throw new Error("Logo file exceeds the maximum allowed size");
    }

    chunks.push(value);
  }

  if (totalLength === 0) {
    throw new Error("Logo response is empty");
  }

  return Buffer.concat(chunks, totalLength);
}

async function fetchLogo(logoUrl: string) {
  const sourceUrl = parseHttpLogoUrl(logoUrl);
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    LOGO_FETCH_TIMEOUT_MS
  );

  try {
    const { finalUrl, response } = await requestLogoResponse(
      sourceUrl,
      controller.signal
    );
    const statusCode = response.statusCode ?? 0;

    if (statusCode < 200 || statusCode >= 300) {
      response.destroy();
      throw new Error(`Logo request failed with status ${statusCode}`);
    }

    try {
      const format = resolveLogoFormat(response, finalUrl, sourceUrl);
      const data = await readLogoResponse(response);

      return { data, format };
    } catch (error) {
      response.destroy();
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Logo request timed out");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function rasterDataUri(data: Buffer, format: "jpeg" | "png") {
  const contentType = format === "jpeg" ? "image/jpeg" : "image/png";
  return `data:${contentType};base64,${data.toString("base64")}`;
}

async function convertLogoToPng(data: Buffer) {
  const png = await sharp(data, {
    density: 192,
    limitInputPixels: MAX_LOGO_PIXELS,
  })
    .resize({
      width: 480,
      height: 280,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return rasterDataUri(png, "png");
}

async function fetchLogoDataUri(logoUrl: string) {
  const { data, format } = await fetchLogo(logoUrl);

  if (format === "jpeg" || format === "png") {
    return rasterDataUri(data, format);
  }

  return convertLogoToPng(data);
}

function parseLogoDataUri(logoUrl: string) {
  const match = logoUrl.match(
    /^data:image\/(png|jpe?g|webp|svg\+xml);base64,([a-z0-9+/=\s]+)$/i
  );

  if (!match) return null;

  const encodedData = match[2].replace(/\s/g, "");
  const estimatedLength = Math.ceil((encodedData.length * 3) / 4);

  if (estimatedLength > MAX_LOGO_BYTES) {
    throw new Error("Logo data URI exceeds the maximum allowed size");
  }

  const data = Buffer.from(encodedData, "base64");
  if (data.length === 0) {
    throw new Error("Logo data URI is empty");
  }

  const subtype = match[1].toLowerCase();
  const format: LogoFormat = subtype.startsWith("jp")
    ? "jpeg"
    : subtype === "svg+xml"
      ? "svg"
      : (subtype as "png" | "webp");

  return { data, format };
}

export async function prepareQuotePdfPreferences(
  preferences: QuotePdfPreferences
): Promise<QuotePdfPreferences> {
  const logoUrl = cleanText(preferences?.logoUrl);

  if (!preferences || !logoUrl) {
    return preferences;
  }

  try {
    const inlineLogo = parseLogoDataUri(logoUrl);
    const preparedLogo = inlineLogo
      ? inlineLogo.format === "jpeg" || inlineLogo.format === "png"
        ? rasterDataUri(inlineLogo.data, inlineLogo.format)
        : await convertLogoToPng(inlineLogo.data)
      : await fetchLogoDataUri(logoUrl);

    return { ...preferences, logoUrl: preparedLogo };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn("QUOTE_PDF_LOGO_PREPARATION_ERROR:", message);
    return { ...preferences, logoUrl: null };
  }
}

async function readableToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    stream.on("data", (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

async function renderDocumentBuffer(
  quote: QuotePdfQuote,
  preferences: QuotePdfPreferences
) {
  const output = await pdf(
    React.createElement(QuotePdfDocument, {
      quote,
      preferences,
    }) as React.ReactElement
  ).toBuffer();

  if (Buffer.isBuffer(output)) {
    return output;
  }

  return readableToBuffer(output);
}

export async function renderQuotePdfBuffer(
  quote: QuotePdfQuote,
  preferences: QuotePdfPreferences
) {
  const pdfPreferences = await prepareQuotePdfPreferences(preferences);

  try {
    return await renderDocumentBuffer(quote, pdfPreferences);
  } catch (error) {
    if (!pdfPreferences?.logoUrl) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn("QUOTE_PDF_LOGO_RENDER_ERROR:", message);
    return renderDocumentBuffer(quote, { ...pdfPreferences, logoUrl: null });
  }
}
