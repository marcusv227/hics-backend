import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const chokingCategory = await prisma.category.upsert({
    where: { slug: 'engasgo' },
    update: {},
    create: {
      name: 'Engasgo',
      slug: 'engasgo',
      description: 'Obstrução de vias aéreas por corpo estranho.',
      iconUrl: 'https://cdn.hics.app/icons/choking.svg',
    },
  });

  const cardiacCategory = await prisma.category.upsert({
    where: { slug: 'parada-cardiorrespiratoria' },
    update: {},
    create: {
      name: 'Parada Cardiorrespiratória',
      slug: 'parada-cardiorrespiratoria',
      description: 'Reconhecimento e resposta à PCR, incluindo RCP.',
      iconUrl: 'https://cdn.hics.app/icons/cpr.svg',
    },
  });

  const burnsCategory = await prisma.category.upsert({
    where: { slug: 'queimaduras' },
    update: {},
    create: {
      name: 'Queimaduras',
      slug: 'queimaduras',
      description: 'Queimaduras térmicas de 1º e 2º grau.',
      iconUrl: 'https://cdn.hics.app/icons/burns.svg',
    },
  });

  const traumaCategory = await prisma.category.upsert({
    where: { slug: 'traumas' },
    update: {},
    create: {
      name: 'Traumas',
      slug: 'traumas',
      description: 'Fraturas, cortes e ferimentos.',
      iconUrl: 'https://cdn.hics.app/icons/trauma.svg',
    },
  });

  await seedHeimlichAdult(chokingCategory.id);
  await seedHeimlichInfant(chokingCategory.id);
  await seedCpr(cardiacCategory.id);
  await seedBurns(burnsCategory.id);

  await seedCprTrack(cardiacCategory.id);

  await prisma.educationalVideo.upsert({
    where: { id: '0ed3771c-c7b8-4246-8f2c-3c2e6d0193d5' },
    update: {},
    create: {
      id: '0ed3771c-c7b8-4246-8f2c-3c2e6d0193d5',
      categoryId: chokingCategory.id,
      title: 'Manobra de Heimlich em adultos — passo a passo',
      youtubeVideoId: 'oAJPZ2ScVE0',
      durationSeconds: 240,
      description: 'Demonstração da manobra de desobstrução de vias aéreas em adultos conscientes.',
      thumbnailUrl: 'https://img.youtube.com/vi/oAJPZ2ScVE0/hqdefault.jpg',
      sourceReference: 'American Heart Association — Guidelines 2020',
    },
  });

  await prisma.educationalVideo.upsert({
    where: { id: '3e68b32e-a280-4c57-a1be-2646ce9c91b7' },
    update: {},
    create: {
      id: '3e68b32e-a280-4c57-a1be-2646ce9c91b7',
      categoryId: cardiacCategory.id,
      title: 'RCP com compressões torácicas — treinamento leigo',
      youtubeVideoId: 'BFbaz0yjDHU',
      durationSeconds: 300,
      description: 'Como realizar compressões torácicas de qualidade em caso de PCR.',
      thumbnailUrl: 'https://img.youtube.com/vi/BFbaz0yjDHU/hqdefault.jpg',
      sourceReference: 'American Heart Association — Guidelines 2020',
    },
  });

  console.log('Seed concluído com sucesso.');
}

async function seedHeimlichAdult(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: 'c8ddddb1-0039-4770-ac97-828887f057bd' },
    update: {},
    create: {
      id: 'c8ddddb1-0039-4770-ac97-828887f057bd',
      categoryId,
      title: 'Manobra de Heimlich em adultos',
      summary: 'Desobstrução de vias aéreas por corpo estranho em adultos conscientes.',
      severityLevel: 'HIGH',
      sourceReference: 'American Heart Association — Guidelines 2020',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Reconheça os sinais de engasgo',
      instruction:
        'Observe se a pessoa leva as mãos ao pescoço, não consegue tossir, falar ou respirar. Pergunte: "Você está engasgado?"',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Posicione-se atrás da vítima',
      instruction:
        'Fique atrás da pessoa, incline-a levemente para frente e posicione um pé entre as pernas dela para dar estabilidade.',
      warningText: null,
    },
    {
      stepNumber: 3,
      title: 'Aplique as compressões abdominais',
      instruction:
        'Feche uma mão em punho e posicione-a logo acima do umbigo. Segure o punho com a outra mão e faça compressões rápidas para dentro e para cima.',
      warningText: 'Nunca aplique a manobra em gestantes ou obesos na região abdominal — direcione ao tórax.',
    },
    {
      stepNumber: 4,
      title: 'Repita até a desobstrução',
      instruction:
        'Continue as compressões até que o objeto seja expelido ou a vítima perca a consciência.',
      warningText: null,
    },
    {
      stepNumber: 5,
      title: 'Se a vítima perder a consciência',
      instruction:
        'Deite a vítima no chão com cuidado, acione o SAMU (192) e inicie a RCP imediatamente.',
      warningText: 'Ligue para o 192 assim que possível, mesmo enquanto presta o socorro.',
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedHeimlichInfant(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: '3891a794-7398-4c42-9f42-3e438ede7509' },
    update: {},
    create: {
      id: '3891a794-7398-4c42-9f42-3e438ede7509',
      categoryId,
      title: 'Desobstrução de vias aéreas em bebês (menores de 1 ano)',
      summary: 'Técnica de tapotagem e compressões torácicas para engasgo em bebês.',
      severityLevel: 'HIGH',
      sourceReference: 'American Heart Association — Guidelines 2020',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Confirme o engasgo',
      instruction:
        'Observe tosse fraca, choro fraco ou ausente, dificuldade para respirar ou coloração azulada dos lábios.',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Posicione o bebê de bruços',
      instruction:
        'Apoie o bebê no seu antebraço, de bruços, com a cabeça mais baixa que o tronco, sustentando o queixo com os dedos.',
      warningText: null,
    },
    {
      stepNumber: 3,
      title: 'Aplique 5 tapotagens nas costas',
      instruction:
        'Com a base da mão, aplique 5 golpes firmes entre as escápulas do bebê.',
      warningText: null,
    },
    {
      stepNumber: 4,
      title: 'Vire o bebê e aplique 5 compressões torácicas',
      instruction:
        'Vire o bebê de barriga para cima sobre o outro antebraço e aplique 5 compressões no centro do tórax com dois dedos.',
      warningText: 'Nunca faça compressões abdominais em bebês.',
    },
    {
      stepNumber: 5,
      title: 'Repita e acione o SAMU',
      instruction:
        'Alterne tapotagens e compressões até a desobstrução. Acione o 192 imediatamente se o bebê perder a consciência.',
      warningText: 'Se o bebê perder a consciência, inicie RCP pediátrica e ligue para o 192.',
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedCpr(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: '2c08beb5-86a7-4ce1-b182-3145756ad162' },
    update: {},
    create: {
      id: '2c08beb5-86a7-4ce1-b182-3145756ad162',
      categoryId,
      title: 'Ressuscitação Cardiopulmonar (RCP) em adultos',
      summary: 'Compressões torácicas para vítimas de parada cardiorrespiratória.',
      severityLevel: 'CRITICAL',
      sourceReference: 'American Heart Association — Guidelines 2020',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Verifique a responsividade',
      instruction:
        'Chame a vítima e toque os ombros. Se não houver resposta e a respiração for ausente ou anormal, presuma PCR.',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Acione o SAMU (192)',
      instruction:
        'Peça para alguém ligar para o 192 e trazer um desfibrilador (DEA), se disponível. Se estiver sozinho, ligue você mesmo antes de iniciar a RCP.',
      warningText: null,
    },
    {
      stepNumber: 3,
      title: 'Posicione as mãos no centro do tórax',
      instruction:
        'Coloque a vítima em superfície rígida e plana. Posicione a base de uma mão no centro do tórax, entre os mamilos, e a outra mão sobre a primeira.',
      warningText: null,
    },
    {
      stepNumber: 4,
      title: 'Realize compressões torácicas',
      instruction:
        'Comprima o tórax a uma profundidade de 5 a 6 cm, numa frequência de 100 a 120 compressões por minuto, permitindo o retorno total do tórax entre as compressões.',
      warningText: 'Minimize interrupções nas compressões torácicas.',
    },
    {
      stepNumber: 5,
      title: 'Use o DEA assim que disponível',
      instruction:
        'Ligue o desfibrilador automático externo e siga as instruções de voz do aparelho.',
      warningText: null,
    },
    {
      stepNumber: 6,
      title: 'Continue até a chegada do socorro',
      instruction:
        'Mantenha os ciclos de compressão até a chegada da equipe de emergência ou a vítima apresentar sinais de vida.',
      warningText: null,
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedBurns(categoryId: string) {
  const procedure = await prisma.emergencyProcedure.upsert({
    where: { id: '518c1d4d-d382-4c94-a1b1-4bda99649dd4' },
    update: {},
    create: {
      id: '518c1d4d-d382-4c94-a1b1-4bda99649dd4',
      categoryId,
      title: 'Queimaduras de 1º e 2º grau',
      summary: 'Primeiros socorros para queimaduras térmicas superficiais e de espessura parcial.',
      severityLevel: 'MEDIUM',
      sourceReference: 'Sociedade Brasileira de Queimaduras',
      isOfflineAvailable: true,
    },
  });

  const steps = [
    {
      stepNumber: 1,
      title: 'Afaste a vítima da fonte de calor',
      instruction: 'Interrompa o contato com a fonte térmica e remova roupas e acessórios próximos à área queimada, se não estiverem grudados.',
      warningText: null,
    },
    {
      stepNumber: 2,
      title: 'Resfrie a queimadura',
      instruction: 'Coloque a área afetada sob água corrente em temperatura ambiente por 10 a 20 minutos.',
      warningText: 'Nunca use gelo diretamente sobre a queimadura — pode agravar a lesão.',
    },
    {
      stepNumber: 3,
      title: 'Cubra a lesão',
      instruction: 'Cubra a área com um pano limpo, seco e não aderente. Não estoure bolhas.',
      warningText: 'Não aplique pomadas caseiras, pasta de dente, manteiga ou outros produtos não indicados.',
    },
    {
      stepNumber: 4,
      title: 'Avalie a gravidade',
      instruction:
        'Queimaduras de 2º grau com bolhas extensas, em rosto, mãos, genitais ou articulações, ou de 3º grau, exigem atendimento médico imediato.',
      warningText: null,
    },
    {
      stepNumber: 5,
      title: 'Busque atendimento médico se necessário',
      instruction: 'Procure uma unidade de saúde ou acione o SAMU (192) em queimaduras extensas, profundas ou em áreas sensíveis.',
      warningText: null,
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { procedureId_stepNumber: { procedureId: procedure.id, stepNumber: step.stepNumber } },
      update: {},
      create: { procedureId: procedure.id, ...step },
    });
  }
}

async function seedCprTrack(categoryId: string) {
  const track = await prisma.trainingTrack.upsert({
    where: { id: '1c28c916-e910-4986-b84e-9be0d0dcc175' },
    update: {},
    create: {
      id: '1c28c916-e910-4986-b84e-9be0d0dcc175',
      categoryId,
      title: 'Fundamentos de RCP',
      description: 'Aprenda os fundamentos da ressuscitação cardiopulmonar em adultos.',
      estimatedTimeMinutes: 15,
      coverImageUrl: 'https://cdn.hics.app/covers/cpr-track.jpg',
    },
  });

  const cards = [
    {
      orderIndex: 1,
      title: 'O que é uma PCR?',
      contentText:
        'A parada cardiorrespiratória (PCR) é a interrupção súbita da atividade cardíaca e da respiração. Reconhecer rapidamente os sinais salva vidas.',
    },
    {
      orderIndex: 2,
      title: 'A cadeia de sobrevivência',
      contentText:
        'Reconhecimento precoce, acionamento do 192, RCP de qualidade, desfibrilação precoce e cuidados pós-parada formam a cadeia de sobrevivência.',
    },
    {
      orderIndex: 3,
      title: 'Compressões de qualidade',
      contentText:
        'Compressões devem ter 5-6 cm de profundidade, frequência de 100-120 por minuto, com retorno total do tórax entre cada compressão.',
    },
  ];

  for (const card of cards) {
    await prisma.trainingCard.upsert({
      where: { trackId_orderIndex: { trackId: track.id, orderIndex: card.orderIndex } },
      update: {},
      create: { trackId: track.id, ...card },
    });
  }

  const question = await prisma.quizQuestion.upsert({
    where: { id: '83d87550-f0cf-4bc2-bb63-adc5e016255e' },
    update: {},
    create: {
      id: '83d87550-f0cf-4bc2-bb63-adc5e016255e',
      trackId: track.id,
      questionText: 'Qual a frequência recomendada de compressões torácicas durante a RCP em adultos?',
      explanation:
        'A frequência recomendada pela AHA é de 100 a 120 compressões por minuto, com profundidade de 5 a 6 cm.',
    },
  });

  const options = [
    { id: '1d63b720-f167-4afb-b7dc-bbf8b0074bb4', optionText: '60 a 80 compressões por minuto', isCorrect: false },
    { id: 'e5fd2bd9-327a-4859-8934-205cfab305ae', optionText: '100 a 120 compressões por minuto', isCorrect: true },
    { id: 'd7201e52-e57f-43a4-9bc8-a00a4a0084e8', optionText: '150 a 180 compressões por minuto', isCorrect: false },
  ];

  for (const option of options) {
    await prisma.quizOption.upsert({
      where: { id: option.id },
      update: {},
      create: { questionId: question.id, ...option },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
