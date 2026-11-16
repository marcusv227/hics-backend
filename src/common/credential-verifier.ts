import { Injectable, Logger } from '@nestjs/common';
import { ProfessionalCouncil } from '@prisma/client';

export interface CredentialVerificationInput {
  council: ProfessionalCouncil;
  registrationNumber: string;
  uf: string;
}

export interface CredentialVerificationResult {
  verified: boolean;
  detail?: string;
}

export interface CredentialVerifier {
  verify(input: CredentialVerificationInput): Promise<CredentialVerificationResult>;
}

/**
 * No-op placeholder: real validation against CFM/COFEN/CREFITO/CRF
 * registries is out of scope for now. Admin approval stays fully manual
 * regardless of what this returns — swap this binding later for a real
 * implementation without touching ProfessionalsService.
 */
@Injectable()
export class ManualCredentialVerifier implements CredentialVerifier {
  private readonly logger = new Logger(ManualCredentialVerifier.name);

  async verify(input: CredentialVerificationInput): Promise<CredentialVerificationResult> {
    this.logger.debug(`Verificação automática não implementada para ${input.council} ${input.registrationNumber}/${input.uf} — segue para revisão manual.`);
    return { verified: false, detail: 'Verificação manual pendente.' };
  }
}
