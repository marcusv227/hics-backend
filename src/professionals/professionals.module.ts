import { Module } from '@nestjs/common';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';
import { ManualCredentialVerifier } from '../common/credential-verifier';

@Module({
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, ManualCredentialVerifier],
})
export class ProfessionalsModule {}
