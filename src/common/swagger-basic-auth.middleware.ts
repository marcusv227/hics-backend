import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';

function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

export function swaggerBasicAuth(user: string, password: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (header?.startsWith('Basic ')) {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
      const separatorIndex = decoded.indexOf(':');
      const reqUser = decoded.slice(0, separatorIndex);
      const reqPassword = decoded.slice(separatorIndex + 1);

      if (safeCompare(reqUser, user) && safeCompare(reqPassword, password)) {
        return next();
      }
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="HICS API Docs"');
    res.status(401).send('Autenticação necessária.');
  };
}
