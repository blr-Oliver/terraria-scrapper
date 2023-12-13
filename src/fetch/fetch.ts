import * as http from 'http';
import * as https from 'https';

export const agent: https.Agent = new https.Agent({
  keepAlive: true,
  maxTotalSockets: 20,
  scheduling: 'fifo',
  timeout: 5000
});

export async function fetchHtmlRaw(url: string | URL, options?: https.RequestOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const requestOptions: https.RequestOptions = options ? {...options} : {};
    if (!('agent' in requestOptions)) requestOptions.agent = agent;
    const request: http.ClientRequest = https.request(url, requestOptions);

    const errorHandler = (err: any) => reject(err);
    request.on('error', errorHandler);
    request.once('response', response => {
      response.on('error', errorHandler);
      let error = validate(response);
      if (error) {
        response.resume();
        errorHandler(error);
      } else {
        response.setEncoding('utf8');
        const chunks: string[] = [];
        response.on('data', (chunk: string) => {
          chunks.push(chunk);
        });
        response.on('end', () => {
          resolve(chunks.join(''));
        });
      }
    });

    request.end();
  })
}

function validate(response: http.IncomingMessage): Error | undefined {
  if (response.statusCode !== 200) {
    return new Error(`Status code is not OK: ${response.statusCode}`);
  } else {
    let contentType = response.headers['content-type']!;
    if (!/^text\/html/.test(contentType))
      return new Error(`Content-Type is not compatible with 'text/html': ${contentType}`);
  }
}

export function normalizeFileName(name: string): string {
  return name.replaceAll(/[\.:]/g, '_');
}